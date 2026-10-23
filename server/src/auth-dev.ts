/**
 * Local dev sign-in (auth.ts). Kept free of imports so test/auth.mjs can check the rule under plain Node.
 *
 * Dev tokens look like `dev:<uid>` or `dev:<uid>:<phone or email>`. They are accepted only when AUTH_MODE=dev,
 * over plain http, and only for a request addressed to this machine. A deployed Worker is reached over https at its
 * own host name (Cloudflare routes by host), so it refuses dev tokens even if AUTH_MODE=dev were set there by mistake.
 * 10.0.2.2 is the Android emulator's name for the PC it runs on.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "10.0.2.2"]);

export function devTokenAllowed(authMode: string | undefined, url: URL): boolean {
  return authMode === "dev" && url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
}
