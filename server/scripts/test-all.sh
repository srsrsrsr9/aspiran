#!/bin/zsh
# Runs every server test suite with one command: `npm run test:all` (or `npm run test:all -- auth rooms` for some).
# Each suite gets its own fresh local database and its own local server, started the way that suite's header asks,
# so one suite can't upset the next. Nothing here touches production. Takes about five minutes.
cd "$(dirname "$0")/.."
TOKEN=test-all-token
PORT=8790
LOG=$(mktemp -d)
typeset -A EXTRA
EXTRA[payments]="--var CASHFREE_APP_ID:local-test-app --var CASHFREE_SECRET_KEY:local-test-secret --var CASHFREE_API_BASE:http://127.0.0.1:8799/pg"
EXTRA[models-hf]="--var MODEL_FILES_URL:"
NOAUTH=(auth metrics password roadmap try models-hf)   # suites that sign in by themselves
SUITES=($@); (( $#SUITES )) || SUITES=(smoke auth community rooms friends chotu languages mocks metrics roadmap payments password ca pyq try models-hf)
# Whatever is still listening on the test port goes: the server's own worker process can outlive it.
free_port() {
  pkill -9 -f "dev --port $PORT" 2>/dev/null
  pkill -9 -f "socket-addr=entry=[^ ]*:$PORT" 2>/dev/null
  for p in $(lsof -ti tcp:$PORT 2>/dev/null); do kill -9 $p 2>/dev/null; done
  for i in {1..20}; do lsof -ti tcp:$PORT >/dev/null 2>&1 || break; sleep 0.5; done
}
pass=(); fail=()
free_port
for s in $SUITES; do
  dir=".wrangler-test-$s"; rm -rf "$dir"
  for f in schema.sql migrations/*.sql; do
    npx wrangler d1 execute upsc-pods --local --persist-to "$dir" --file="$f" >/dev/null 2>&1
  done
  # Payment keys are blanked unless the suite asks for them (.dev.vars may hold sandbox keys).
  vars="--var AUTH_MODE:dev --var EDITOR_TOKEN:$TOKEN ${EXTRA[$s]:---var CASHFREE_APP_ID: --var CASHFREE_SECRET_KEY:}"
  # Started with node directly (not npx), so $pid is the server itself and stopping it really stops it.
  node node_modules/wrangler/bin/wrangler.js dev --port $PORT --persist-to "$dir" ${=vars} >"$LOG/$s.server.log" 2>&1 &
  pid=$!
  up=0; for i in {1..90}; do curl -s -m 2 -o /dev/null "http://127.0.0.1:$PORT/health" && { up=1; break; }; sleep 1; done
  (( up )) || { fail+=($s); echo "✗ $s  (the local server did not start)"; tail -15 "$LOG/$s.server.log" | sed 's/^/    /'; pkill -9 -P $pid 2>/dev/null; kill -9 $pid 2>/dev/null; continue; }
  # Matched pods are what the suites test: no sign-up threshold.
  curl -s -m 10 -o /dev/null -X POST "http://127.0.0.1:$PORT/admin/api/growth/threshold" -H "authorization: Bearer $TOKEN" -H "content-type: application/json" -d '{"signupThreshold":0}'
  imp=(--import ./test/dev-auth.mjs); (( ${NOAUTH[(Ie)$s]} )) && imp=()
  # A suite that hangs is stopped after five minutes, so one stuck suite can't hold up the rest.
  EDITOR_TOKEN=$TOKEN CF_SECRET=local-test-secret BASE="http://127.0.0.1:$PORT" node $imp "test/$s.mjs" >"$LOG/$s.log" 2>&1 &
  tp=$!
  ( sleep 300; kill -9 $tp 2>/dev/null ) &
  wp=$!
  wait $tp; rc=$?
  kill $wp 2>/dev/null
  if (( rc == 0 )); then
    pass+=($s); echo "✓ $s"
  else
    fail+=($s); echo "✗ $s  (exit $rc; see $LOG/$s.log)"; tail -8 "$LOG/$s.log" | sed 's/^/    /'
    echo "    --- server log ---"; tail -12 "$LOG/$s.server.log" | sed 's/^/    /'
  fi
  # Stop the server: ask nicely, give it five seconds, then make sure nothing is left on the port.
  kill $pid 2>/dev/null; pkill -P $pid 2>/dev/null
  for i in {1..10}; do kill -0 $pid 2>/dev/null || break; sleep 0.5; done
  kill -9 $pid 2>/dev/null
  free_port
  rm -rf "$dir"
done
echo; echo "${#pass} passed, ${#fail} failed${fail:+: $fail}"
(( ${#fail} == 0 ))
