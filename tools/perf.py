import sys, json
from playwright.sync_api import sync_playwright
U=sys.argv[1]; runs=int(sys.argv[2]) if len(sys.argv)>2 else 3
JS="""()=>new Promise(res=>{let lcp=0,cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)cls+=e.value}).observe({type:'layout-shift',buffered:true});
setTimeout(()=>{const n=performance.getEntriesByType('navigation')[0];const fcp=(performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime;
const rs=performance.getEntriesByType('resource');res({ttfb:Math.round(n.responseStart),fcp:Math.round(fcp),lcp:Math.round(lcp),cls:+cls.toFixed(3),dcl:Math.round(n.domContentLoadedEventEnd),
html_kb:Math.round(n.transferSize/1024),total_kb:Math.round((n.transferSize+rs.reduce((a,r)=>a+(r.transferSize||0),0))/1024),req:rs.length+1})},6000)})"""
with sync_playwright() as p:
    b=p.chromium.launch(); out=[]
    for i in range(runs):
        c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=3,service_workers='block',locale='es-ES')
        pg=c.new_page(); cdp=c.new_cdp_session(pg)
        cdp.send('Network.enable'); import os
        if os.environ.get('FAST'): pass
        else: cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':150,'downloadThroughput':1.6e6/8,'uploadThroughput':750e3/8})
        os.environ.get('FAST') or cdp.send('Emulation.setCPUThrottlingRate',{'rate':4}); cdp.send('Network.setCacheDisabled',{'cacheDisabled':True})
        pg.route('**/__sb/**',lambda r:r.abort())
        pg.goto(U,wait_until='load',timeout=120000); out.append(pg.evaluate(JS)); c.close()
    for o in out: print(o)
    med=lambda k: sorted(o[k] for o in out)[len(out)//2]
    print('MEDIANA', {k:med(k) for k in out[0]})
