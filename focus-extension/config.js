// Where the UPSC Pods app is served. The bridge only talks to pages on these origins.
// To change the live domain, edit APP_ORIGINS here AND the matching line in manifest.json
// (content_scripts.matches), then reload the extension. See README.md, "Deployed app".
// Live app: https://upsc-pods-production.chotu-aec.workers.dev (add a custom domain here when there is one).
const APP_ORIGINS = [
  "https://upsc-pods-production.chotu-aec.workers.dev",
  /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.workers\.dev$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];
