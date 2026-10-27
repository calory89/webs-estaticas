from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class H(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


ThreadingHTTPServer(('127.0.0.1', 8899), H).serve_forever()
