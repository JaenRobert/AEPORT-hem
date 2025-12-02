#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Edge Server for ÆSI — read-only endpoints

Serves:
- /edge/foundation.json
- /edge/E1TAN_EDGE.js
- /edge/manifest

Run:
  python edge_server.py

"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import json
import os
from datetime import datetime

PORT = int(os.environ.get('EDGE_PORT', 8081))


class EdgeHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # allow cross-origin reads (public, read-only)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'public, max-age=60')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def serve_file(self, relpath, content_type='application/octet-stream'):
        if not os.path.exists(relpath):
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'not found'}).encode('utf-8'))
            return
        try:
            with open(relpath, 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            # simple ETag based on mtime
            mtime = os.path.getmtime(relpath)
            etag = str(int(mtime))
            self.send_header('ETag', etag)
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def do_GET(self):
        # map edge paths
        if self.path == '/edge/foundation.json':
            return self.serve_file('edge/foundation.json', 'application/json')
        if self.path == '/edge/E1TAN_EDGE.js':
            # try project root name fallback
            if os.path.exists('E1tan_EDge.js'):
                return self.serve_file('E1tan_EDge.js', 'application/javascript')
            return self.serve_file('edge/E1TAN_EDGE.js', 'application/javascript')
        if self.path == '/edge/manifest':
            if os.path.exists('ASI_MANIFEST.md'):
                return self.serve_file('ASI_MANIFEST.md', 'text/markdown')
            return self.serve_file('edge/ASI_MANIFEST.md', 'text/markdown')

        if self.path == '/edge/':
            # small index page
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            html = f"""
            <html><head><meta charset="utf-8"><title>ÆSI Edge</title></head>
            <body style="background:#111;color:#eee;font-family:system-ui;padding:20px">
            <h2>ÆSI Edge</h2>
            <ul>
              <li><a href="/edge/foundation.json">foundation.json</a></li>
              <li><a href="/edge/E1TAN_EDGE.js">E1TAN_EDGE.js</a></li>
              <li><a href="/edge/manifest">manifest</a></li>
            </ul>
            <p>Served at {datetime.utcnow().isoformat()} UTC</p>
            </body></html>
            """
            self.wfile.write(html.encode('utf-8'))
            return

        # fallback to static files
        return super().do_GET()


def main():
    server = ThreadingHTTPServer(('0.0.0.0', PORT), EdgeHandler)
    print(f"ÆSI Edge server listening on http://0.0.0.0:{PORT}/edge/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopping edge server...')
        server.shutdown()


if __name__ == '__main__':
    main()
