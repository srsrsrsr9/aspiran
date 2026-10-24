// Sign-in and the access switch on the web (auth-build.md). Firebase Authentication proves who someone is
// (Google only); the server's own accounts table says whether they may use
// the app. This module:
//   - loads the Firebase JS SDK from gstatic only when the server says sign-in is set up (config.auth),
//   - in local dev (AUTH_MODE=dev on the server, localhost only) offers a fake "dev sign-in" instead,
//   - adds the ID token to every member call (fetch and WebSocket), refreshing it as Firebase does,
//   - checks /me/status on open and when the tab comes back (at most every 6 hours), and treats a 403
//     account_suspended from any call the same way,
//   - keeps a 72-hour offline grace from the last successful check.
// Username and password (config.auth.password, server password.ts) is the other way in: the server issues its own
// session token, kept here in localStorage and sent exactly like the Firebase ID token. With a recovery email
// (config.auth.recovery), "Forgot password?" mails a single-use reset code.
// The Google email stays with Firebase and the server's accounts table; nothing here shows it to anyone else.

const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/10.14.1";
export const CHECK_EVERY_MS = 6 * 3600_000;
export const GRACE_MS = 72 * 3600_000;
const MEMBER_ROUTE = /^\/(pods\/(join|leave|me|choose)|pods\/[\w-]+\/ws|members\/profile|commons\/[\w-]+\/ws|season\/add|mocks\/band|plus(\/.*)?|chotu|chotu\/report|consent|privacy\/(export|delete)|rooms\/(list|join|leave|photo)|rooms\/photo\/\w+|rooms\/[\w-]+\/ws)$/;

const K = "upsc:auth:";
const ls = {
  get(k, d = null) { try { const v = localStorage.getItem(K + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(K + k); } catch {} },
};

let cfg = { mode: "unconfigured", required: true };
let fb = null;            // { app, auth, mod } once the SDK is loaded
let devToken = ls.get("devToken");
let pwToken = ls.get("pwToken");    // our own session token after a username and password sign-in
let token = null;         // the current ID token, cached for WebSocket URLs (which can't wait for a promise)
let onSuspended = () => {};

/** What the session knows: { uid, memberId, provider, label } or null. label is for this person only ("Signed in with Google"). */
export const session = () => ls.get("session");
// Offline, the Firebase SDK may not load: a saved session still counts (the 72-hour grace decides how long).
export const signedIn = () => !!session() && (!!devToken || !!pwToken || !!fb?.auth.currentUser || (!fb && cfg.mode === "firebase"));
export const suspended = () => ls.get("suspended");
export const lastOk = () => ls.get("lastOk", 0);
export const mode = () => cfg.mode;
/** With sign-in not required (rollout) and not set up, the app works as it did before sign-in existed. */
export const optional = () => !cfg.required && cfg.mode === "unconfigured" && !cfg.password;
/** Username and password sign-in is offered (the password_login flag). */
export const passwordOn = () => !!cfg.password;
/** "Forgot password?" by email works on this server (mail is set up). */
export const recoveryOn = () => !!cfg.password && !!cfg.recovery;

export async function init(authConfig, { onSuspend } = {}) {
  if (authConfig) { cfg = authConfig; ls.set("config", authConfig); } else cfg = ls.get("config") ?? cfg;
  if (onSuspend) onSuspended = onSuspend;
  installFetch(); installWebSocket();
  if (cfg.mode === "firebase" && cfg.firebase?.apiKey) {
    try { await loadFirebase(); } catch { /* offline: the grace period covers us until the SDK can load */ }
  }
}

async function loadFirebase() {
  if (fb) return fb;
  const [{ initializeApp }, mod] = await Promise.all([import(`${FIREBASE_SDK}/firebase-app.js`), import(`${FIREBASE_SDK}/firebase-auth.js`)]);
  const app = initializeApp(cfg.firebase);
  const auth = mod.initializeAuth(app, { persistence: [mod.indexedDBLocalPersistence, mod.browserLocalPersistence], popupRedirectResolver: mod.browserPopupRedirectResolver });
  fb = { app, auth, mod };
  await auth.authStateReady();
  mod.onIdTokenChanged(auth, async (u) => { token = u ? await u.getIdToken().catch(() => null) : null; });
  // Coming back from a Google redirect (when the popup was blocked).
  await mod.getRedirectResult(auth).catch(() => null);
  if (auth.currentUser) token = await auth.currentUser.getIdToken().catch(() => null);
  return fb;
}

/** The ID token for a server call. Firebase refreshes it about once an hour; force=true gets a new one now. */
export async function getToken(force = false) {
  if (devToken) return devToken;
  if (pwToken) return pwToken;
  const u = fb?.auth.currentUser;
  if (!u) return null;
  try { token = await u.getIdToken(force); } catch { /* offline: keep the cached one */ }
  return token;
}

// --- Signing in ---------------------------------------------------------------------------------------

export async function signInGoogle() {
  const { auth, mod } = await loadFirebase();
  const provider = new mod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try { await mod.signInWithPopup(auth, provider); }
  catch (e) {
    if (e?.code === "auth/popup-blocked" || e?.code === "auth/operation-not-supported-in-this-environment") { await mod.signInWithRedirect(auth, provider); return; }
    throw friendly(e);
  }
}

/** Local dev only (the server says mode "dev"): a clearly fake token, no Firebase. */
export function devSignIn(email) {
  const contact = String(email ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+$/.test(contact)) throw new Error("Type any email for the dev account.");
  devToken = `dev:${contact.replace(/[^\w]/g, "").slice(-30)}:${contact}`;
  ls.set("devToken", devToken);
  token = devToken;
}

/**
 * Username and password: kind "signup" or "signin". Stores the session token and the session, like establish().
 * Returns the server's answer ({ memberId, status, mustChange, username }).
 */
export async function passwordSignIn(kind, username, password, memberIdHint) {
  const r = await rawFetch(`/auth/password/${kind === "signup" ? "signup" : "signin"}`, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: String(username ?? "").trim().toLowerCase(), password, memberId: memberIdHint ?? null, appVersion: "web" }) }).catch(() => null);
  if (!r) throw new Error("You seem to be offline. Connect and try again.");
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "Couldn't sign you in. Please try again.");
  savePasswordSession(d);
  if (d.status === "suspended") { markSuspended(d.support); return d; }
  ls.del("suspended"); ls.set("lastOk", Date.now());
  return d;
}
function savePasswordSession(d) {
  pwToken = d.token; token = d.token; ls.set("pwToken", d.token);
  ls.set("session", { uid: d.uid, memberId: d.memberId, provider: "password", username: d.username, email: null, label: `Signed in as @${d.username}` });
}
/** Change the password (or set a new one after a temporary password). Other devices are signed out. */
export async function changePassword(current, next) {
  const r = await rawFetch("/auth/password/change", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + pwToken },
    body: JSON.stringify({ current, next }) }).catch(() => null);
  if (!r) throw new Error("You seem to be offline. Connect and try again.");
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "Couldn't change your password. Please try again.");
  savePasswordSession(d);
  return d;
}

/** POST to /auth/password/<op>, with this device's session token when signed in. Throws with the server's message. */
async function pwPost(op, body = {}, fallback = "Something went wrong. Please try again.") {
  const headers = { "content-type": "application/json", ...(pwToken ? { authorization: "Bearer " + pwToken } : {}) };
  const r = await rawFetch("/auth/password/" + op, { method: "POST", headers, body: JSON.stringify(body) }).catch(() => null);
  if (!r) throw new Error("You seem to be offline. Connect and try again.");
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? fallback);
  return d;
}
/** The recovery email on this account: { email, pending, mail }. */
export const recoveryStatus = () => pwPost("recovery");
/** Sends a 6-digit code to the address; it's used only after recoveryVerify. */
export const recoveryAdd = (email) => pwPost("recovery/add", { email: String(email ?? "").trim() }, "Couldn't send the code. Please try again.");
export const recoveryVerify = (code) => pwPost("recovery/verify", { code: String(code ?? "").trim() });
export const recoveryRemove = () => pwPost("recovery/remove");
/** By username or recovery email. The answer is the same whether or not the account exists. */
export const forgotPassword = (who) => pwPost("forgot", { who: String(who ?? "").trim() });
/** Sets a new password with the code from the email, and signs this browser in. Other devices are signed out. */
export async function resetPassword(code, next) {
  const d = await pwPost("reset", { token: String(code ?? "").trim(), next, appVersion: "web" }, "Couldn't reset your password. Please try again.");
  savePasswordSession(d);
  if (d.status === "suspended") { markSuspended(d.support); return d; }
  ls.del("suspended"); ls.set("lastOk", Date.now());
  return d;
}

function friendly(e) {
  const code = e?.code ?? "";
  const msg = {
    "auth/too-many-requests": "Too many tries. Wait a little and try again.",
    "auth/popup-closed-by-user": "The Google window was closed before you finished.",
    "auth/cancelled-popup-request": "The Google window was closed before you finished.",
    "auth/unauthorized-domain": "Google sign-in isn't allowed on this web address yet.",
    "auth/network-request-failed": "You seem to be offline. Connect and try again.",
  }[code];
  return new Error(msg ?? "Couldn't sign you in. Please try again.");
}

/**
 * After Firebase (or dev) sign-in: tells the server, which creates the account on first sign-in and links this
 * browser's existing member id so nothing is lost. Returns { memberId, status }.
 */
export async function establish(memberIdHint) {
  const t = await getToken(true);
  if (!t) throw new Error("Not signed in.");
  const r = await rawFetch("/auth/session", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + t }, body: JSON.stringify({ memberId: memberIdHint ?? null, appVersion: "web" }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "Couldn't reach the server. Try again when you're online.");
  const u = fb?.auth.currentUser;
  const email = d.provider === "google.com" ? u?.email ?? null : devToken?.split(":")[2] ?? null;
  const label = d.provider === "password" ? `Signed in as @${session()?.username ?? ""}`
    : d.provider === "google.com" ? `Signed in with Google${email ? ` as ${email}` : ""}` : `Dev sign-in${email ? ` as ${email}` : ""}`;
  ls.set("session", { uid: d.uid, memberId: d.memberId, provider: d.provider, email, label, ...(d.provider === "password" ? { username: session()?.username } : {}) });
  if (d.status === "suspended") { markSuspended(d.support); return d; }
  ls.del("suspended"); ls.set("lastOk", Date.now());
  return d;
}

export async function signOut() {
  if (pwToken) rawFetch("/auth/password/signout", { method: "POST" }).catch(() => {});
  ls.del("session"); ls.del("devToken"); ls.del("pwToken"); devToken = null; pwToken = null; token = null;
  if (fb?.auth.currentUser) await fb.mod.signOut(fb.auth).catch(() => {});
}

/** For "Delete my data": removes the Firebase user too. Firebase may ask for a recent sign-in; then we say so. */
export async function deleteFirebaseUser() {
  const u = fb?.auth.currentUser;
  if (!u) { await signOut(); return { ok: true }; }
  try { await fb.mod.deleteUser(u); await signOut(); return { ok: true }; }
  catch (e) { await signOut(); return { ok: false, why: e?.code === "auth/requires-recent-login" ? "Your data was deleted. To also remove your sign-in, sign in again and choose Delete once more." : "Your data was deleted, but we couldn't remove your sign-in. Write to us and we'll do it." }; }
}

// --- The access check -------------------------------------------------------------------------------

function markSuspended(support) {
  ls.set("suspended", { at: Date.now(), support: support ?? cfg.support ?? null });
  signOut();
  onSuspended();
}

/**
 * Checks /me/status when due (or now with force). Returns "ok", "suspended", "signin" (the account needs a new
 * sign-in), "offline-ok" (offline within the 72-hour grace) or "offline-expired".
 */
export async function check({ force = false } = {}) {
  if (optional()) return "ok";
  if (suspended()) return "suspended";
  if (!signedIn()) return "signin";
  const last = lastOk();
  if (!force && Date.now() - last < CHECK_EVERY_MS) return "ok";
  try {
    const t = await getToken();
    if (!t) return Date.now() - last < GRACE_MS ? "offline-ok" : "offline-expired";
    const r = await rawFetch("/me/status", { headers: { authorization: "Bearer " + t }, cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) return "signin";
    if (!r.ok) throw new Error(String(r.status));
    if (d.status === "suspended") { markSuspended(d.support); return "suspended"; }
    if (d.status === "none") { await establish(session()?.memberId); return "ok"; }
    ls.set("lastOk", Date.now());
    return "ok";
  } catch {
    return Date.now() - last < GRACE_MS ? "offline-ok" : "offline-expired";
  }
}
/** Offline and past the grace period: the app still reads what this browser has, with an offline banner. */
export const graceOver = () => !optional() && signedIn() && Date.now() - lastOk() >= GRACE_MS;
/** After a suspension is lifted, the person signs in again from the notice. */
export const clearSuspended = () => ls.del("suspended");

// --- Every member call carries the token ---------------------------------------------------------------

const rawFetch = window.fetch.bind(window);
function installFetch() {
  if (window.fetch.authWrapped) return;
  const wrapped = async (input, init = {}) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, location.href);
    if (url.origin !== location.origin || !MEMBER_ROUTE.test(url.pathname.replace(/\/+$/, ""))) return rawFetch(input, init);
    const send = async (force) => {
      const t = await getToken(force);
      const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : {}));
      if (t) headers.set("authorization", "Bearer " + t);
      return rawFetch(input, { ...init, headers });
    };
    let r = await send(false);
    if (r.status === 401 && fb?.auth.currentUser) r = await send(true); // an expired token: refresh once
    if (r.status === 403) {
      const d = await r.clone().json().catch(() => ({}));
      if (d.code === "account_suspended") markSuspended(d.support);
    } else if (r.ok) ls.set("lastOk", Date.now());
    return r;
  };
  wrapped.authWrapped = true;
  window.fetch = wrapped;
}
function installWebSocket() {
  const Real = window.WebSocket;
  if (Real.authWrapped) return;
  class AuthWebSocket extends Real {
    constructor(address, protocols) {
      const url = new URL(String(address), location.href);
      if (MEMBER_ROUTE.test(url.pathname) && (token || devToken || pwToken)) url.searchParams.set("auth", devToken ?? pwToken ?? token);
      super(url.toString(), protocols);
      this.addEventListener("message", (e) => { try { if (JSON.parse(e.data)?.code === "account_suspended") markSuspended(); } catch {} });
    }
  }
  AuthWebSocket.authWrapped = true;
  window.WebSocket = AuthWebSocket;
}
