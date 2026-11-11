# Servidor local que imita a Cloudflare Pages + el worker: URLs limpias, brotli, cabeceras de cache.
import sys, os, re, http.server, socketserver, mimetypes, functools
import brotli
ROOT=os.path.abspath(sys.argv[1]); PORT=int(sys.argv[2])
IMM='public, max-age=31536000, immutable'
_cache={}
def comp(path, data):
    k=(path, os.path.getmtime(path), len(data))
    if k not in _cache: _cache[k]=brotli.compress(data, quality=5)
    return _cache[k]
class H(http.server.BaseHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def log_message(self,*a): pass
    def do_HEAD(self): self.do_GET(head=True)
    def do_GET(self, head=False):
        from urllib.parse import urlsplit, unquote
        u=urlsplit(self.path); p=unquote(u.path); v='v=' in (u.query or '')
        fp=os.path.normpath(os.path.join(ROOT, p.lstrip('/')))
        if not fp.startswith(ROOT): return self.send_error(403)
        if os.path.isdir(fp):
            if not p.endswith('/'):
                self.send_response(308); self.send_header('location', p+'/'); self.send_header('content-length','0'); self.end_headers(); return
            fp=os.path.join(fp,'index.html')
        elif not os.path.exists(fp) and os.path.exists(fp+'.html'): fp=fp+'.html'
        status=200
        if not os.path.isfile(fp):
            fp=os.path.join(ROOT,'404.html'); status=404
        data=open(fp,'rb').read()
        ct=mimetypes.guess_type(fp)[0] or 'application/octet-stream'
        if fp.endswith('.webmanifest'): ct='application/manifest+json'
        if fp.endswith('.js'): ct='application/javascript'
        cc='public, max-age=0, must-revalidate'
        if status==200:
            if re.match(r'^/a/', p): cc=IMM
            elif re.match(r'^/[dl]/[^/]+\.json$', p): cc=IMM if v else 'public, max-age=3600'
            elif re.search(r'\.(png|jpe?g|webp|gif|svg|ico|woff2?)$', p): cc='public, max-age=86400'
            elif re.search(r'\.(json|csv|js)$', p) and p!='/sw.js': cc='public, max-age=86400' if v else 'public, max-age=3600'
        self.send_response(status)
        if ct.startswith('text/') or ct in ('application/javascript','application/json','application/manifest+json','image/svg+xml'):
            if 'br' in self.headers.get('accept-encoding',''):
                data=comp(fp,data); self.send_header('content-encoding','br')
            if ct.startswith('text/'): ct+='; charset=utf-8'
        self.send_header('content-type',ct); self.send_header('content-length',str(len(data))); self.send_header('cache-control',cc)
        self.end_headers()
        if not head: self.wfile.write(data)
class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads=True; allow_reuse_address=True
S(('127.0.0.1',PORT),H).serve_forever()
