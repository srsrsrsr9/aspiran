// Preloaded by the older suites (`node --import ./test/dev-auth.mjs test/smoke.mjs`, see package.json) so they keep
// testing what they were written for now that member routes need a sign-in. Needs a local server with AUTH_MODE=dev.
//
// Every call to a member route gets a dev token for the member id it already carries (body memberId or ?member=),
// so each test member is its own signed-in account and the server links that id on first use. Calls with no member
// id share one dev account. Sockets get the token as ?auth=. test/auth.mjs tests sign-in itself and doesn't use this.
const MEMBER_ROUTE = /^\/(library|practice\/questions|brief\/(latest|\d{4}-\d{2}-\d{2})|pods\/(join|leave|me|choose|merge-stay)|pods\/[\w-]+\/ws|members\/profile|commons\/[\w-]+\/ws|season\/add|mocks\/band|plus(\/.*)?|chotu|chotu\/report|consent|privacy\/(export|delete)|rooms\/(list|join|leave|photo)|rooms\/photo\/\w+|rooms\/[\w-]+\/ws|answers\/evaluate|interview\/follow)$/;

// One tester per run, so the daily content limit (60 library loads per account) never carries from suite to suite.
const TESTER = "suite-tester-" + Math.random().toString(36).slice(2, 8);
const tokenFor = (member) => "dev:" + (member ? "m-" + member : TESTER);

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (!MEMBER_ROUTE.test(url.pathname.replace(/\/+$/, ""))) return realFetch(input, init);
  let member = url.searchParams.get("member");
  if (!member && typeof init.body === "string") { try { member = JSON.parse(init.body).memberId ?? null; } catch { /* not JSON */ } }
  const headers = new Headers(init.headers ?? {});
  headers.set("authorization", "Bearer " + tokenFor(member));
  return realFetch(input, { ...init, headers });
};

const RealWebSocket = globalThis.WebSocket;
globalThis.WebSocket = class extends RealWebSocket {
  constructor(address, protocols) {
    const url = new URL(String(address));
    if (MEMBER_ROUTE.test(url.pathname) && !url.searchParams.has("auth")) url.searchParams.set("auth", tokenFor(url.searchParams.get("member")));
    super(url.toString(), protocols);
  }
};
