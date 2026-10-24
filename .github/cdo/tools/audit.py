import os,re,sys,json,collections,html
root=sys.argv[1]
pages={}
for d,_,fs in os.walk(root):
    if '/.git' in d: continue
    for f in fs:
        if f.endswith('.html'):
            p=os.path.join(d,f); rel='/'+os.path.relpath(p,root)
            url=rel[:-len('index.html')] if rel.endswith('/index.html') else rel
            pages[url]=p
files=set()
for d,_,fs in os.walk(root):
    if '/.git' in d: continue
    for f in fs: files.add('/'+os.path.relpath(os.path.join(d,f),root))
redir=set()
for l in open(os.path.join(root,'_redirects')):
    l=l.split('#')[0].split()
    if len(l)>=2: redir.add(l[0])
def exists(u):
    u=u.split('#')[0].split('?')[0]
    if not u: return True
    u=html.unescape(u)
    from urllib.parse import unquote
    u=unquote(u)
    if u in redir or u.rstrip('/') in redir: return True
    if u in files: return True
    if u.endswith('/') and (u+'index.html') in files: return True
    if (u+'/index.html') in files or (u+'.html') in files: return True
    if u.startswith('/wp-admin'): return True
    return False
stats=collections.Counter(); issues=collections.defaultdict(list)
titles=collections.defaultdict(list); descs=collections.defaultdict(list)
broken=collections.Counter()
for url,p in pages.items():
    h=open(p,errors='ignore').read()
    t=re.search(r'<title>(.*?)</title>',h,re.S)
    t=t.group(1).strip() if t else ''
    if not t: issues['no_title'].append(url)
    titles[t].append(url)
    if len(t)>65: issues['title_long'].append(url)
    m=re.search(r'<meta name="description" content="([^"]*)"',h)
    if not m or not m.group(1).strip(): issues['no_desc'].append(url)
    else:
        descs[m.group(1)].append(url)
        if len(m.group(1))>165: issues['desc_long'].append(url)
        if len(m.group(1))<70: issues['desc_short'].append(url)
    if 'rel="canonical"' not in h: issues['no_canonical'].append(url)
    if 'og:image' not in h: issues['no_og_image'].append(url)
    if 'application/ld+json' not in h: issues['no_schema'].append(url)
    if '<html lang' not in h: issues['no_lang'].append(url)
    if 'name="viewport"' not in h: issues['no_viewport'].append(url)
    h1=len(re.findall(r'<h1[\s>]',h))
    if h1==0: issues['no_h1'].append(url)
    if h1>1: issues['multi_h1'].append(url)
    for im in re.findall(r'<img\b[^>]*>',h):
        stats['img']+=1
        if not re.search(r'\balt="[^"]+',im): stats['img_noalt']+=1; issues['img_noalt'].append(url)
        if 'loading=' not in im: stats['img_nolazy']+=1
        if 'width=' not in im: stats['img_nowidth']+=1
    for a in re.findall(r'(?:href|src)="(/[^"/][^"]*|/)"',h):
        if a.startswith('//'): continue
        if not exists(a): broken[a]+=1; issues['broken_link_pages'].append(url)
    if re.search(r'[\w.+-]+@[\w-]+\.[\w.]+',re.sub(r'<script.*?</script>','',h,flags=re.S)) : issues['email_visible'].append(url)
    if '—' in re.sub(r'<[^>]+>','',h): issues['em_dash'].append(url)
    if 'http://' in h and 'http://www.w3.org' not in h: issues['http_links'].append(url)
    if 'wp-json' in h or 'admin-ajax' in h or 'wp-comments-post' in h: issues['wp_endpoints'].append(url)
print('pages',len(pages))
for k,v in sorted(issues.items()): print(k,len(set(v)), list(dict.fromkeys(v))[:4])
print('stats',dict(stats))
print('dup titles',sum(1 for t,v in titles.items() if len(v)>1), [ (t[:50],len(v)) for t,v in titles.items() if len(v)>2][:8])
print('dup descs',sum(1 for t,v in descs.items() if len(v)>1))
print('broken targets',len(broken)); 
for b,c in broken.most_common(40): print(' ',c,b)
