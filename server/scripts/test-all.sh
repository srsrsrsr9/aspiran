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
pass=(); fail=()
for s in $SUITES; do
  dir=".wrangler-test-$s"; rm -rf "$dir"
  for f in schema.sql migrations/*.sql; do
    npx wrangler d1 execute upsc-pods --local --persist-to "$dir" --file="$f" >/dev/null 2>&1
  done
  # Payment keys are blanked unless the suite asks for them (.dev.vars may hold sandbox keys).
  vars="--var AUTH_MODE:dev --var EDITOR_TOKEN:$TOKEN ${EXTRA[$s]:---var CASHFREE_APP_ID: --var CASHFREE_SECRET_KEY:}"
  npx wrangler dev --port $PORT --persist-to "$dir" ${=vars} >"$LOG/$s.server.log" 2>&1 &
  pid=$!
  for i in {1..60}; do curl -s -o /dev/null "http://127.0.0.1:$PORT/health" && break; sleep 1; done
  # Matched pods are what the suites test: no sign-up threshold.
  curl -s -o /dev/null -X POST "http://127.0.0.1:$PORT/admin/api/growth/threshold" -H "authorization: Bearer $TOKEN" -H "content-type: application/json" -d '{"signupThreshold":0}'
  imp=(--import ./test/dev-auth.mjs); (( ${NOAUTH[(Ie)$s]} )) && imp=()
  if EDITOR_TOKEN=$TOKEN CF_SECRET=local-test-secret BASE="http://127.0.0.1:$PORT" node $imp "test/$s.mjs" >"$LOG/$s.log" 2>&1; then
    pass+=($s); echo "✓ $s"
  else
    fail+=($s); echo "✗ $s  (see $LOG/$s.log)"; tail -5 "$LOG/$s.log" | sed 's/^/    /'
  fi
  kill $pid 2>/dev/null; pkill -P $pid 2>/dev/null; wait $pid 2>/dev/null
  lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null
  rm -rf "$dir"
done
echo; echo "${#pass} passed, ${#fail} failed${fail:+: $fail}"
(( ${#fail} == 0 ))
