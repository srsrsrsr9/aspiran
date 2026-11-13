#!/bin/zsh
# Do the database files and the running server agree? `npm run check:schema`
# The database's shape is written down twice: in schema.sql plus migrations/ (the record, and what a fresh setup
# runs), and in the server itself, which creates and alters tables as it starts (staff.ts ensureSchema). This builds
# one local database each way and compares every table and column. Anything the server makes that the files don't
# record fails the check, so the files stay a complete record. Nothing here touches production.
cd "$(dirname "$0")/.."
PORT=8789
A=.wrangler-test-schema-files; B=.wrangler-test-schema-server
rm -rf $A $B
Q="SELECT m.name AS t, p.name AS c FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%' AND m.name NOT LIKE '_cf_%' AND m.name NOT LIKE 'd1_%' ORDER BY 1, 2"
cols() { npx wrangler d1 execute upsc-pods --local --persist-to "$1" --json --command "$Q" 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const r of JSON.parse(s)[0].results)console.log(r.t+"."+r.c)})'; }
for f in schema.sql migrations/*.sql; do npx wrangler d1 execute upsc-pods --local --persist-to $A --file="$f" >/dev/null 2>&1; done
cols $A | sort > /tmp/schema-files.txt
pkill -9 -f "dev --port $PORT" 2>/dev/null
node node_modules/wrangler/bin/wrangler.js dev --port $PORT --persist-to $B --var AUTH_MODE:dev --var EDITOR_TOKEN:schema-check >/tmp/schema-server.log 2>&1 &
pid=$!
for i in {1..90}; do curl -s -m 2 -o /dev/null "http://127.0.0.1:$PORT/health" && break; sleep 1; done
# A few calls that make the server build its tables.
for u in /config /status.json /learn /try "/rooms/list"; do curl -s -m 20 -o /dev/null "http://127.0.0.1:$PORT$u"; done
curl -s -m 20 -o /dev/null -H "authorization: Bearer schema-check" "http://127.0.0.1:$PORT/admin/api/payments"
kill $pid 2>/dev/null; sleep 2; kill -9 $pid 2>/dev/null; pkill -9 -f "socket-addr=entry=[^ ]*:$PORT" 2>/dev/null
cols $B | sort > /tmp/schema-server.txt
rm -rf $A $B
only_server=$(comm -13 /tmp/schema-files.txt /tmp/schema-server.txt)
only_files=$(comm -23 /tmp/schema-files.txt /tmp/schema-server.txt)
echo "$(wc -l < /tmp/schema-files.txt | tr -d ' ') columns in the files, $(wc -l < /tmp/schema-server.txt | tr -d ' ') made by the server."
if [[ -n "$only_files" ]]; then
  echo "\nIn the files only (fine: the pipeline and desk tables come from schema.sql alone):"; echo "$only_files" | cut -d. -f1 | sort | uniq -c | sed 's/^/  /'
fi
if [[ -n "$only_server" ]]; then
  echo "\n✗ Made by the server but missing from schema.sql and migrations/ (add them to a migration):"; echo "$only_server" | sed 's/^/  /'; exit 1
fi
echo "✓ Everything the server creates is recorded in the files."
