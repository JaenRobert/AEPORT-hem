import http.server
import socketserver
import json
import os
import sys
import socket
import glob
from datetime import datetime

# --- KONFIGURATION ---
START_PORT = 8000
MAX_PORT_RETRIES = 10
# Vi letar data i dessa mappar
MEMORY_DIRS = ['json', 'txt', 'gdoc'] 
PUBLIC_DIR = "public"
# Filer vi visar i listan "Minnet"
EXTENSIONS = {'.json', '.txt', '.md', '.gdoc'}

class AESIHandler(http.server.SimpleHTTPRequestHandler):
    """
    ÆSI Custom Handler v5.3 (Omni-Scanner).
    Hanterar statiska filer, API-anrop och massiv datavävning från alla mappar.
    """

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == '/memory':
            self.handle_memory_request()
        elif self.path.startswith('/public/'):
            super().do_GET()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/chat':
            self.handle_chat_request()
        elif self.path == '/weave':
            self.handle_weave_request()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_memory_request(self):
        """Scannar ALLA undermappar i memory/logs."""
        files_found = []
        base_log_dir = os.path.join(os.getcwd(), 'memory', 'logs')

        # Scanna rekursivt eller specifika mappar
        for subdir in MEMORY_DIRS:
            target = os.path.join(base_log_dir, subdir)
            if os.path.exists(target):
                for f in os.listdir(target):
                    if any(f.endswith(ext) for ext in EXTENSIONS):
                        # Snygga till typ-ikonen
                        ftype = "file"
                        if f.endswith(".json"): ftype = "json"
                        elif f.endswith(".txt"): ftype = "text"
                        elif f.endswith(".gdoc"): ftype = "link"
                        
                        files_found.append({
                            "name": f,
                            "type": ftype,
                            "folder": subdir, 
                            "path": os.path.join("memory", "logs", subdir, f)
                        })
        
        self.send_json({"status": "success", "count": len(files_found), "files": files_found})

    def handle_chat_request(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data)
            user_input = data.get('text', '')
            response_data = {
                "reply": f"Mottaget i Brunnen: '{user_input}'",
                "node": "ERNIE (060)",
                "status": "LOGGED"
            }
            self.send_json(response_data)
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def handle_weave_request(self):
        """VÄVAREN: Läser JSON-filer från BÅDE 'json' och 'txt' mappen."""
        try:
            all_entries = []
            files_scanned = 0
            
            # 1. HITTA FILER (Vi letar efter .json överallt där du kan ha lagt dem)
            search_patterns = [
                os.path.join(os.getcwd(), 'memory', 'logs', 'json', '*.json'),
                os.path.join(os.getcwd(), 'memory', 'logs', 'txt', '*.json') # Fångar json i txt-mappen
            ]
            
            all_files = []
            for pattern in search_patterns:
                all_files.extend(glob.glob(pattern))

            print(f"[*] Vävaren hittade {len(all_files)} filer att bearbeta.")

            # 2. LÄS FILER
            for filepath in all_files:
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().strip()
                        if not content: continue
                        
                        data = json.load(f) # Detta kan fela om json är trasig
                        files_scanned += 1
                        
                        # Normalisera datan till en platt lista
                        if isinstance(data, list):
                            for entry in data:
                                if isinstance(entry, dict): all_entries.append(entry)
                        elif isinstance(data, dict):
                            all_entries.append(data)
                            
                except Exception as e:
                    # Ignorera trasiga filer tyst
                    continue

            # 3. SORTERA (Kronologiskt)
            # Vi letar efter nycklar som 'timestamp', 'date', 'created_at'
            def get_sort_key(x):
                return x.get('timestamp', x.get('date', '9999'))
            
            all_entries.sort(key=get_sort_key)
            
            # 4. SKAPA HTML (BOKEN)
            html = """
            <!DOCTYPE html>
            <html lang="sv">
            <head>
                <meta charset="UTF-8">
                <title>ÆSI MASTER HISTORY</title>
                <style>
                    body { background: #111; color: #ccc; font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
                    .entry { margin-bottom: 25px; padding: 15px; background: #1a1a1a; border-radius: 8px; border-left: 4px solid #333; }
                    .meta { font-size: 0.8em; color: #666; margin-bottom: 5px; display: flex; justify-content: space-between; }
                    .sender { font-weight: bold; color: #fff; }
                    .content { white-space: pre-wrap; }
                    .user { border-left-color: #10b981; }
                    .node { border-left-color: #6366f1; }
                    h1 { color: #fff; border-bottom: 1px solid #333; padding-bottom: 20px; }
                    a { color: #6366f1; }
                </style>
            </head>
            <body>
            <h1>ÆSI MASTER HISTORY</h1>
            <p>Vävd från """ + str(files_scanned) + """ filer.</p>
            """

            # 5. SKAPA TXT (CONTEXT)
            txt = "ÆSI MASTER CONTEXT\n==================\n\n"

            for entry in all_entries:
                # Försök hitta text och avsändare med olika nyckelnamn
                text = entry.get('text', entry.get('content', entry.get('reply', '')))
                if not text: continue
                
                sender = entry.get('sender', entry.get('node', entry.get('role', 'System')))
                time = entry.get('timestamp', '')
                
                css_class = "user" if str(sender).lower() in ['user', 'jag', 'dirigent', 'jæn'] else "node"

                # HTML append
                html += f'<div class="entry {css_class}"><div class="meta"><span class="sender">{sender}</span><span>{time}</span></div><div class="content">{text}</div></div>'
                
                # TXT append
                txt += f"[{time}] {sender}: {text}\n\n"

            html += "</body></html>"

            # 6. SPARA
            if not os.path.exists(PUBLIC_DIR): os.makedirs(PUBLIC_DIR)
            
            with open(os.path.join(PUBLIC_DIR, 'FULL_HISTORY.html'), 'w', encoding='utf-8') as f: f.write(html)
            with open(os.path.join(PUBLIC_DIR, 'FULL_CONTEXT.txt'), 'w', encoding='utf-8') as f: f.write(txt)

            self.send_json({
                "status": "success",
                "message": f"Vävde ihop {len(all_entries)} rader från {files_scanned} filer.",
                "files": ["/public/FULL_HISTORY.html", "/public/FULL_CONTEXT.txt"]
            })

        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

def find_free_port(start_port):
    port = start_port
    while port < start_port + MAX_PORT_RETRIES:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            port += 1
    return None

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def run_server():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root_dir)
    port = find_free_port(START_PORT)
    if not port: sys.exit(1)
    
    print(f"\n=== ÆSI PORTAL v5.3 (OMNI-SCANNER) ===")
    print(f"[*] Root: {root_dir}")
    print(f"[*] URL:  http://localhost:{port}")
    print(f"======================================")

    with socketserver.TCPServer(("", port), AESIHandler) as httpd:
        try: httpd.serve_forever()
        except KeyboardInterrupt: pass

if __name__ == "__main__":
    run_server()