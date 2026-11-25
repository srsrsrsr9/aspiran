# python3 -I verify.py <expect.json> <wrangler-args...>: reads every expected row back and compares byte for byte.
import json,os,sys,subprocess
ACT=os.environ.get('ACT','import 2026-11-25b batch and approve')
exp=json.load(open(sys.argv[1])); args=sys.argv[2:]; ids=list(exp); bad=0; got={}
for i in range(0,len(ids),10):
    q="SELECT * FROM library WHERE id IN (%s)"%",".join("'%s'"%x for x in ids[i:i+10])
    o=subprocess.run(args+['--json','--command',q],capture_output=True,text=True).stdout
    for r in json.loads(o[o.find('[\n'):])[0]['results']: got[r['id']]=r
q="SELECT item_id, COUNT(*) n FROM content_versions WHERE action='%s' GROUP"%ACT.replace("'","''")+" BY item_id"
o=subprocess.run(args+['--json','--command',q],capture_output=True,text=True).stdout
ver={r['item_id']:r['n'] for r in json.loads(o[o.find('[\n'):])[0]['results']}
for k,e in exp.items():
    r=got.get(k)
    if not r: print('MISSING',k); bad+=1; continue
    for c,v in e.items():
        if r[c]!=v: print('DIFF',k,c); bad+=1
    if ver.get(k)!=1: print('VERSIONS',k,ver.get(k)); bad+=1
print(len(got),'rows read back;',sum(ver.values()),'version rows;',bad,'differences')
