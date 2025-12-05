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
MEMORY_DIRS = ['json', 'txt', 'gdoc'] 
PUBLIC_DIR = "public"
EXTENSIONS = {'.json', '.txt', '.md', '.gdoc'}

class AESIHandler(http.server.SimpleHTTPRequestHandler):
    """
    ÆSI Handler v6.0 (Chronos Editor).
    Stödjer selektiv vävning, nod-filtrering och dynamiska mallar.
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
        files_found = []
        base_log_dir = os.path.join(os.getcwd(), 'memory', 'logs')

        for subdir in MEMORY_DIRS:
            target = os.path.join(base_log_dir, subdir)
            if os.path.exists(target):
                for f in os.listdir(target):
                    if any(f.endswith(ext) for ext in EXTENSIONS):
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
            # Archivarius svarar
            response_data = {
                "reply": f"Noterat. Arkiverar '{user_input}' i minnesbanken.",
                "node": "ARCHIVARIUS",
                "status": "LOGGED"
            }
            self.send_json(response_data)
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def handle_weave_request(self):
        """VÄVAREN v6.0: Avancerad logik för filtrering och mallar."""
        try:
            # 1. LÄS PARAMETRAR FRÅN FRONTEND
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = {}
            if post_data:
                request_data = json.loads(post_data)
            
            selected_files = request_data.get('files', []) # Lista på filnamn
            template_mode = request_data.get('template', 'standard') # 'standard', 'legal', 'story'
            filter_node = request_data.get('filter_node', '').lower() # T.ex. "ernie"

            all_entries = []
            files_processed = 0
            
            # 2. HITTA KANDIDATFILER
            search_patterns = [
                os.path.join(os.getcwd(), 'memory', 'logs', 'json', '*.json'),
                os.path.join(os.getcwd(), 'memory', 'logs', 'txt', '*.json')
            ]
            candidates = []
            for pattern in search_patterns:
                candidates.extend(glob.glob(pattern))

            # 3. FILTRERA FIL-LISTAN (OM ANVÄNDAREN VALT SPECIFIKA)
            final_file_list = []
            if not selected_files:
                final_file_list = candidates # Kör allt om inget är valt
            else:
                for fpath in candidates:
                    fname = os.path.basename(fpath)
                    if fname in selected_files:
                        final_file_list.append(fpath)

            print(f"[*] Vävaren: {len(final_file_list)} filer. Mall: {template_mode}. Filter: {filter_node}")

            # 4. LÄS & FILTRERA INNEHÅLL
            for filepath in final_file_list:
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().strip()
                        if not content: continue
                        data = json.load(f)
                        files_processed += 1
                        
                        entries_in_file = []
                        if isinstance(data, list):
                            for entry in data:
                                if isinstance(entry, dict): entries_in_file.append(entry)
                        elif isinstance(data, dict):
                            entries_in_file.append(data)
                        
                        # --- META-FILTER (NOD/SENDER) ---
                        for entry in entries_in_file:
                            sender = str(entry.get('sender', entry.get('node', 'UNKNOWN'))).lower()
                            # Om filter är aktivt, hoppa över poster som inte matchar
                            if filter_node and filter_node not in sender:
                                continue 
                            all_entries.append(entry)
                            
                except: continue

            # 5. SORTERA
            all_entries.sort(key=lambda x: x.get('timestamp', x.get('date', '9999')))
            
            # 6. APPLICERA MALL (TEMPLATES)
            title = "ÆSI MASTER HISTORY"
            bg_color = "#111"
            font = "monospace"
            accent = "#6366f1"
            intro_text = "Standardiserad logg över systemaktivitet."
            
            if template_mode == 'legal':
                title = "ÆSI PROTOKOLL & LAGBOK"
                bg_color = "#0f0505" # Mörkröd ton
                font = "'Times New Roman', serif"
                accent = "#ef4444"
                intro_text = "Följande dokument utgör den juridiska och etiska grunden för systemet."
            elif template_mode == 'story':
                title = "KRÖNIKAN OM ÆSI"
                bg_color = "#050f05" # Mörkgrön ton
                font = "'Georgia', serif"
                accent = "#10b981"
                intro_text = "En berättelse om uppkomst, utveckling och framtid."

            html = f"""
            <!DOCTYPE html>
            <html lang="sv">
            <head>
                <meta charset="UTF-8">
                <title>{title}</title>
                <style>
                    body {{ background: {bg_color}; color: #ccc; font-family: {font}; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }}
                    .entry {{ margin-bottom: 25px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 4px solid #333; }}
                    .meta {{ font-size: 0.8em; opacity: 0.7; margin-bottom: 5px; display: flex; justify-content: space-between; text-transform: uppercase; letter-spacing: 1px; }}
                    .sender {{ font-weight: bold; color: {accent}; }}
                    .content {{ white-space: pre-wrap; }}
                    h1 {{ color: {accent}; border-bottom: 1px solid #333; padding-bottom: 20px; }}
                    .intro {{ font-style: italic; color: #888; margin-bottom: 2rem; }}
                </style>
            </head>
            <body>
            <h1>{title}</h1>
            <p class="intro">{intro_text}</p>
            <p style="font-size: 0.8rem; border: 1px solid #333; padding: 5px; display: inline-block;">
                <strong>Filter:</strong> {filter_node if filter_node else "ALLA"} | 
                <strong>Källfiler:</strong> {files_processed} |
                <strong>Poster:</strong> {len(all_entries)}
            </p>
            <hr style="border:0; border-top:1px solid #333; margin: 2rem 0;">
            """

            txt = f"{title}\n{'='*len(title)}\n\n"

            for entry in all_entries:
                text = entry.get('text', entry.get('content', entry.get('reply', '')))
                if not text: continue
                
                sender = entry.get('sender', entry.get('node', 'UNKNOWN'))
                time = entry.get('timestamp', '')
                
                html += f'<div class="entry"><div class="meta"><span class="sender">{sender}</span><span>{time}</span></div><div class="content">{text}</div></div>'
                txt += f"[{time}] {sender}: {text}\n\n"

            html += "</body></html>"

            # 7. SPARA
            if not os.path.exists(PUBLIC_DIR): os.makedirs(PUBLIC_DIR)
            
            with open(os.path.join(PUBLIC_DIR, 'FULL_HISTORY.html'), 'w', encoding='utf-8') as f: f.write(html)
            with open(os.path.join(PUBLIC_DIR, 'FULL_CONTEXT.txt'), 'w', encoding='utf-8') as f: f.write(txt)

            self.send_json({
                "status": "success",
                "message": f"Vävde {len(all_entries)} rader (Filter: {filter_node or 'Inget'}).",
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

def run_server():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root_dir)
    port = find_free_port(START_PORT)
    if not port: sys.exit(1)
    
    print(f"\n=== ÆSI PORTAL v6.0 (CHRONOS EDITOR) ===")
    print(f"[*] Root: {root_dir}")
    print(f"[*] URL:  http://localhost:{port}")
    print(f"========================================")

    with socketserver.TCPServer(("", port), AESIHandler) as httpd:
        try: httpd.serve_forever()
        except KeyboardInterrupt: pass

if __name__ == "__main__":
    run_server()