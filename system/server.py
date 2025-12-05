import http.server
import socketserver
import json
import os
import sys
import socket
import glob
import urllib.request
import urllib.error
from datetime import datetime

# --- .ENV LOADER ---
def load_dotenv():
    """Läser .env filen i roten och sätter miljövariabler."""
    env_path = os.path.join(os.getcwd(), '.env')
    if os.path.exists(env_path):
        print(f"[*] Laddar konfiguration från {env_path}")
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                try:
                    key, value = line.split('=', 1)
                    value = value.strip().strip("'").strip('"')
                    os.environ[key.strip()] = value
                except: continue
    else:
        print("[!] Ingen .env fil hittades. Kör i Offline-läge (Simulerad AI).")

load_dotenv()

# --- KONFIGURATION ---
START_PORT = 8000
MAX_PORT_RETRIES = 10
MEMORY_DIRS = ['json', 'txt', 'gdoc'] 
PUBLIC_DIR = "public"
EXTENSIONS = {'.json', '.txt', '.md', '.gdoc'}

# --- AI CONFIG ---
API_URL = os.environ.get("AESI_API_URL", "https://api.openai.com/v1/chat/completions") 
API_KEY = os.environ.get("AESI_API_KEY", "") 
API_MODEL = os.environ.get("AESI_API_MODEL", "gpt-4o-mini")

class AESIHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == '/memory': self.handle_memory_request()
        elif self.path.startswith('/public/'): super().do_GET()
        else: super().do_GET()

    def do_POST(self):
        if self.path == '/chat': self.handle_chat_request()
        elif self.path == '/weave': self.handle_weave_request()
        else: self.send_error(404, "Endpoint not found")

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
                        files_found.append({"name": f, "type": ftype, "folder": subdir, "path": os.path.join("memory", "logs", subdir, f)})
        self.send_json({"status": "success", "count": len(files_found), "files": files_found})

    def call_ai_api(self, user_prompt, system_context=""):
        if not API_KEY: return None
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}
        payload = {
            "model": API_MODEL,
            "messages": [
                {"role": "system", "content": f"Du är ARCHIVARIUS (ÆSI PORTAL). Du har tillgång till systemets minne. Kontext: {system_context[:15000]}"},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7
        }
        try:
            req = urllib.request.Request(API_URL, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))['choices'][0]['message']['content']
        except Exception as e:
            return f"[AI ERROR] {str(e)}"

    def handle_chat_request(self):
        length = int(self.headers['Content-Length'])
        data = json.loads(self.rfile.read(length))
        user_input = data.get('text', '')
        context = ""
        try:
            with open(os.path.join(PUBLIC_DIR, 'FULL_CONTEXT.txt'), 'r', encoding='utf-8') as f: 
                context = f.read()[-8000:]
        except: pass
        reply = self.call_ai_api(user_input, context)
        node = "ARCHIVARIUS (AI)" if reply else "ARCHIVARIUS (LOKAL)"
        if not reply:
            reply = f"Noterat: '{user_input}'. (Konfigurera .env för AI-svar)"
        self.send_json({"reply": reply, "node": node, "status": "LOGGED"})

    def handle_weave_request(self):
        try:
            length = int(self.headers['Content-Length'])
            req = json.loads(self.rfile.read(length))
            sel_files = req.get('files', [])
            template = req.get('template', 'standard')
            filter_node = req.get('filter_node', '').lower()

            all_entries = []
            files_processed = 0
            patterns = [os.path.join(os.getcwd(), 'memory', 'logs', 'json', '*.json'), 
                        os.path.join(os.getcwd(), 'memory', 'logs', 'txt', '*.json')]
            candidates = []
            for p in patterns: candidates.extend(glob.glob(p))
            final_list = [f for f in candidates if os.path.basename(f) in sel_files] if sel_files else candidates
            print(f"[*] Weaving {len(final_list)} files...")
            for fp in final_list:
                try:
                    with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().strip()
                        if not content: continue
                        data = json.load(f)
                        files_processed += 1
                        entries = data if isinstance(data, list) else [data]
                        for entry in entries:
                            if not isinstance(entry, dict): continue
                            sender = str(entry.get('sender', entry.get('node', 'UNKNOWN'))).lower()
                            if filter_node and filter_node not in sender: continue
                            all_entries.append(entry)
                except: continue
            all_entries.sort(key=lambda x: x.get('timestamp', x.get('date', '9999')))
            title = "ÆSI MASTER HISTORY"
            bg = "#111"
            accent = "#6366f1"
            if template == 'legal': title, bg, accent = "ÆSI LAGBOK", "#0f0505", "#ef4444"
            if template == 'story': title, bg, accent = "ÆSI KRÖNIKA", "#050f05", "#10b981"
            html = f"""<!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8"><title>{title}</title>
            <style>body{{background:{bg};color:#ccc;font-family:monospace;padding:40px;max-width:900px;margin:0 auto;line-height:1.6}}
            h1{{color:{accent};border-bottom:1px solid #333;padding-bottom:10px}}
            .entry{{margin-bottom:20px;padding:15px;background:rgba(255,255,255,0.05);border-left:4px solid #333}}
            .sender{{color:{accent};font-weight:bold;display:block;margin-bottom:5px}}
            </style></head><body><h1>{title}</h1><p>Filter: {filter_node or 'ALLA'} | Filer: {files_processed}</p>"""
            txt = f"{title}\n{'='*len(title)}\n\n"
            for e in all_entries:
                text = e.get('text', e.get('content', e.get('reply', '')))
                if not text: continue
                sender = e.get('sender', e.get('node', 'UNKNOWN'))
                ts = e.get('timestamp', '')
                html += f'<div class="entry"><span class="sender">{sender} <small style="color:#666">[{ts}]</small></span>{text}</div>'
                txt += f"[{ts}] {sender}:\n{text}\n\n"
            html += "</body></html>"
            if not os.path.exists(PUBLIC_DIR): os.makedirs(PUBLIC_DIR)
            with open(os.path.join(PUBLIC_DIR, 'FULL_HISTORY.html'), 'w', encoding='utf-8') as f: f.write(html)
            with open(os.path.join(PUBLIC_DIR, 'FULL_CONTEXT.txt'), 'w', encoding='utf-8') as f: f.write(txt)
            self.send_json({"status": "success", "message": f"Vävde {len(all_entries)} poster.", "files": ["/public/FULL_HISTORY.html", "/public/FULL_CONTEXT.txt"]})
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

def find_free_port(start):
    port = start
    while port < start + MAX_PORT_RETRIES:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError: port += 1
    return None

if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    port = find_free_port(START_PORT)
    if port:
        print(f"\n=== ÆSI PORTAL v6.2 (CHRONOS) ===\n[*] URL: http://localhost:{port}\n[*] API: {'ONLINE' if API_KEY else 'OFFLINE'}")
        with socketserver.TCPServer(("", port), AESIHandler) as httpd:
            try: httpd.serve_forever()
            except: pass