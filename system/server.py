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

# --- .ENV LOADER (Inga externa bibliotek krävs) ---
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

START_PORT = 8000
MAX_PORT_RETRIES = 10
MEMORY_DIRS = ['json', 'txt', 'gdoc'] 
PUBLIC_DIR = "public"
EXTENSIONS = {'.json', '.txt', '.md', '.gdoc'}

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

    def call_ai_api(self, user_prompt, system_context=""):
        if not API_KEY:
            return None
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }
        safe_context = system_context[:15000]
        payload = {
            "model": API_MODEL,
            "messages": [
                {"role": "system", "content": f"Du är ARCHIVARIUS (ÆSI PORTAL). Du är systemets minne och guide. Svara koncist och insiktsfullt. Här är relevant kontext från minnet:\n\n{safe_context}"},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7
        }
        try:
            req = urllib.request.Request(API_URL, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result['choices'][0]['message']['content']
        except Exception as e:
            print(f"[AI ERROR] {e}")
            return f"Anslutningsfel mot Noden: {str(e)}"

    def handle_chat_request(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data)
            user_input = data.get('text', '')
            context = ""
            context_path = os.path.join(PUBLIC_DIR, 'FULL_CONTEXT.txt')
            if os.path.exists(context_path):
                try:
                    with open(context_path, 'r', encoding='utf-8') as f:
                        context = f.read()[-8000:] 
                except: pass
            ai_reply = self.call_ai_api(user_input, context)
            if ai_reply:
                reply_text = ai_reply
                node_name = "ARCHIVARIUS (AI)"
            else:
                if "väv" in user_input.lower():
                    reply_text = "Jag uppfattar att du vill väva historien. Använd kontrollpanelen till höger för att initiera processen."
                elif "status" in user_input.lower():
                    reply_text = "Systemet är online. Minnesbankerna är säkrade. API-nyckel saknas för full kognitiv kapacitet."
                else:
                    reply_text = f"Noterat: '{user_input}'. (Konfigurera .env för att aktivera AI-analys)"
                node_name = "ARCHIVARIUS (LOKAL)"
            response_data = {
                "reply": reply_text,
                "node": node_name,
                "status": "LOGGED"
            }
            self.send_json(response_data)
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def handle_weave_request(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = {}
            if post_data:
                request_data = json.loads(post_data)
            selected_files = request_data.get('files', [])
            template_mode = request_data.get('template', 'standard')
            filter_node = request_data.get('filter_node', '').lower()
            all_entries = []
            files_processed = 0
            search_patterns = [
                os.path.join(os.getcwd(), 'memory', 'logs', 'json', '*.json'),
                os.path.join(os.getcwd(), 'memory', 'logs', 'txt', '*.json')
            ]
            candidates = []
            for pattern in search_patterns:
                candidates.extend(glob.glob(pattern))
            final_file_list = []
            if not selected_files:
                final_file_list = candidates
            else:
                for fpath in candidates:
                    fname = os.path.basename(fpath)
                    if fname in selected_files:
                        final_file_list.append(fpath)
            print(f"[*] Vävaren: {len(final_file_list)} filer. Mall: {template_mode}. Filter: {filter_node}")
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
                        for entry in entries_in_file:
                            sender = str(entry.get('sender', entry.get('node', 'UNKNOWN'))).lower()
                            if filter_node and filter_node not in sender:
                                continue 
                            all_entries.append(entry)
                except: continue
            all_entries.sort(key=lambda x: x.get('timestamp', x.get('date', '9999')))
            title = "ÆSI MASTER HISTORY"
            bg_color = "#111"
            font = "monospace"
            accent = "#6366f1"
            intro_text = "Standardiserad logg över systemaktivitet."
            if template_mode == 'legal':
                title = "ÆSI PROTOKOLL & LAGBOK"
                bg_color = "#0f0505"
                font = "'Times New Roman', serif"
                accent = "#ef4444"
                intro_text = "Juridisk och etisk grunddata."
            elif template_mode == 'story':
                title = "KRÖNIKAN OM ÆSI"
                bg_color = "#050f05"
                font = "'Georgia', serif"
                accent = "#10b981"
                intro_text = "Den narrativa berättelsen."
            html = f"""<!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8"><title>{title}</title>
            <style>body{{background:{bg_color};color:#ccc;font-family:{font};max-width:900px;margin:0 auto;padding:40px;line-height:1.6}}
            .entry{{margin-bottom:20px;padding:15px;background:rgba(255,255,255,0.05);border-left:4px solid #333}}
            .sender{{color:{accent};font-weight:bold}} h1{{color:{accent};border-bottom:1px solid #333;padding-bottom:10px}}</style>
            </head><body><h1>{title}</h1><p>{intro_text} | Filter: {filter_node or 'ALLA'} | Filer: {files_processed}</p>"""
            txt = f"{title}\n{'='*len(title)}\n\n"
            for entry in all_entries:
                text = entry.get('text', entry.get('content', entry.get('reply', '')))
                if not text: continue
                sender = entry.get('sender', entry.get('node', 'UNKNOWN'))
                ts = entry.get('timestamp', '')
                html += f'<div class="entry"><span class="sender">{sender} <small>[{ts}]</small></span><br>{text}</div>'
                txt += f"[{ts}] {sender}:\n{text}\n\n"
            html += "</body></html>"
            if not os.path.exists(PUBLIC_DIR): os.makedirs(PUBLIC_DIR)
            with open(os.path.join(PUBLIC_DIR, 'FULL_HISTORY.html'), 'w', encoding='utf-8') as f: f.write(html)
            with open(os.path.join(PUBLIC_DIR, 'FULL_CONTEXT.txt'), 'w', encoding='utf-8') as f: f.write(txt)
            self.send_json({"status": "success", "message": f"Vävde {len(all_entries)} poster.", "files": ["/public/FULL_HISTORY.html"]})
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
    status_msg = "ONLINE (AI ENABLED)" if API_KEY else "OFFLINE (No API Key found)"
    print(f"\n=== ÆSI PORTAL v6.2 (CHRONOS) ===\n[*] URL: http://localhost:{port}\n[*] API: {status_msg}")
    with socketserver.TCPServer(("", port), AESIHandler) as httpd:
        try: httpd.serve_forever()
        except KeyboardInterrupt: pass

if __name__ == "__main__":
    run_server()