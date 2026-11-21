#!/usr/bin/env python3
# Kolaboro MCP server test (n34c, 21 Nov 2026): calls every tool once on https://kolaboro.com/mcp and writes the result file given as argument (/data/mcp-tests.json).
import json, urllib.request, datetime, sys
U='https://kolaboro.com/mcp'
def call(m, p, i):
    req=urllib.request.Request(U, data=json.dumps({'jsonrpc':'2.0','id':i,'method':m,'params':p}).encode(), headers={'content-type':'application/json','accept':'application/json, text/event-stream','user-agent':'mcp-test','mcp-protocol-version':'2025-06-18'})
    return json.load(urllib.request.urlopen(req, timeout=60))
tl=call('tools/list',{},1)['result']['tools']
A={'search_projects':{'market':'Bali','limit':2},'get_project':{'id':'BALI-001'},'project_quick_answer':{'slug':'amani-melasti'},'compare_projects':{'projects':['amani-melasti','anjuna-bay']},'list_by_handover_year':{'year':2027,'market':'Dubai','limit':3},
 'search_text':{'query':'proyectos en Dubái'},'get_certificate':{'slug':'amani-melasti'},'market_stats':{'market':'Dubai'},'database_stats':{},'public_log':{'days':2},'dataset_files':{},'verify_signature':None,
 'project_history':{'slug':'amani-melasti'},'project_evidence':{'slug':'amani-melasti'},'compare_markets':{'markets':['Dubai','Bali','Phuket']},'transparency_proof':{'slug':'amani-melasti'},'dataset_delta':{}}
R=[];sig=None
for i,t in enumerate(tl):
    n=t['name'];a=A.get(n,{})
    if n=='verify_signature':
        r0=call('tools/call',{'name':'database_stats','arguments':{}},90); body=r0['result']['content'][0]['text']; s=json.loads(r0['result']['content'][1]['text'])['kolaboro_signature']
        a={'body':body,'signature':s.get('signature') or s.get('value')}
    try:
        r=call('tools/call',{'name':n,'arguments':a},i+2)['result']; ok=not r.get('isError'); txt=r['content'][0]['text']
        sg=json.loads(r['content'][1]['text'])['kolaboro_signature'] if len(r['content'])>1 else None
        det=('signed' if sg and (sg.get('signature') or sg.get('value')) else 'not signed')+', %d bytes'%len(txt)
        if n=='verify_signature': det=txt[:80].replace('\n',' ')
    except Exception as e: ok=False; det=str(e)[:100]
    R.append({'tool':n,'ok':ok,'detail':det}); print(n,ok,det)
json.dump({'type':'kolaboro-mcp-tests-v1','at':datetime.datetime.utcnow().replace(microsecond=0).isoformat()+'Z','endpoint':U,'server':call('initialize',{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'t','version':'1'}},999)['result']['serverInfo'],'passed':sum(r['ok'] for r in R),'total':len(R),'results':R},open(sys.argv[1],'w'),indent=1)
