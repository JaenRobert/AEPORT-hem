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
MEMORY_DIR = "memory/logs"
PUBLIC_DIR = "public"
EXTENSIONS = {'.json', '.txt', '.md'}

class AESIHandler(http.server.SimpleHTTPRequestHandler):
    """
    ÆSI Custom Handler.
    Hanterar statiska filer (Frontend) och API-anrop (/chat, /memory, /weave).
    """

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()

    def do_GET(self):
        # API: HÄMTA MINNE (BRUNNEN)
        if self.path == '/memory':
            self.handle_memory_request()
        # API: SERVE PUBLIC FILES (Historik-filerna)
        elif self.path.startswith('/public/'):
            super().do_GET()
        else:
            # Standard: Servera filer (index.html etc.)
            super().do_GET()

    def do_POST(self):
        # API: CHATT (PORTALEN)
        if self.path == '/chat':
            self.handle_chat_request()
        # API: VÄVAREN (SKAPA BOKEN)
        elif self.path == '/weave':
            self.handle_weave_request()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_memory_request(self):
        """Scannar memory-mappen och returnerar lista på filer."""
        files_found = []
        target_dirs = [
            os.path.join(os.getcwd(), 'memory', 'logs', 'json'),
            os.path.join(os.getcwd(), 'memory', 'logs', 'txt')
        ]

        for folder in target_dirs:
            if os.path.exists(folder):
                for f in os.listdir(folder):
                    if any(f.endswith(ext) for ext in EXTENSIONS):
                        files_found.append({
                            "name": f,
                            "type": "json" if f.endswith(".json") else "text",
                            "path": os.path.join(folder, f)
                        })
        
        self.send_json({"status": "success", "count": len(files_found), "files": files_found})

    def handle_chat_request(self):
        """Hanterar inkommande meddelanden från Portalen."""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
            user_input = data.get('text', '')
            
            # SIMULERAD RESPONS (Tills riktig API-nyckel kopplas)
            response_data = {
                "reply": f"Mottaget i Brunnen: '{user_input}'",
                "node": "ERNIE (060)",
                "status": "LOGGED"
            }
            self.send_json(response_data)
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def handle_weave_request(self):
        """VÄVAREN: Läser alla loggar och skapar Master-filer."""
        try:
            # Sökväg till JSON-loggar
            json_path = os.path.join(os.getcwd(), 'memory', 'logs', 'json', '*.json')
            files = glob.glob(json_path)
            all_entries = []

            # 1. LÄS ALLA FILER
            for filepath in files:
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        # Hantera om filen är en lista av meddelanden eller ett objekt
                        if isinstance(data, list):
                            for entry in data:
                                all_entries.append(entry)
                        elif isinstance(data, dict):
                            all_entries.append(data)
                except Exception as e:
                    print(f"Kunde inte läsa {filepath}: {e}")

            # 2. SORTERA (Försök hitta timestamp, annars lita på ordningen)
            # Vi sorterar baserat på timestamp om det finns, annars lägger vi dem sist
            all_entries.sort(key=lambda x: x.get('timestamp', '9999-99-99'))
            
            # 3. SKAPA HTML & TXT
            html_content = """
            <!DOCTYPE html>
            <html lang="sv">
            <head>
                <meta charset="UTF-8">
                <title>ÆSI MASTER HISTORY</title>
                <style>
                    body { background: #050505; color: #e5e5e5; font-family: 'Courier New', monospace; padding: 2rem; max-width: 900px; margin: 0 auto; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 2rem; margin-bottom: 2rem; }
                    .header h1 { color: #6366f1; margin: 0; }
                    .entry { border-left: 3px solid #333; padding-left: 1.5rem; margin-bottom: 2rem; background: #0a0a0a; padding: 1rem; border-radius: 4px; }
                    .meta { font-size: 0.75rem; color: #666; margin-bottom: 0.5rem; display: flex; justify-content: space-between; text-transform: uppercase; letter-spacing: 1px; }
                    .sender { font-weight: bold; color: #818cf8; }
                    .text { white-space: pre-wrap; color: #d1d5db; }
                    .user-entry { border-left-color: #22c55e; }
                    .node-entry { border-left-color: #6366f1; }
                </style>
            </head>
            <body>
            <div class="header">
                <h1>ÆSI MASTER HISTORY</h1>
                <p>THE WEAVE PROTOCOL • FULL CHRONICLE</p>
            </div>
            """
            
            txt_content = "ÆSI MASTER CONTEXT FILE (THE WEAVE)\n===================================\n\n"

            for entry in all_entries:
                sender = entry.get('sender', entry.get('node', 'UNKNOWN'))
                text = entry.get('text', entry.get('reply', ''))
                timestamp = entry.get('timestamp', 'UNKNOWN TIME')
                
                # Bestäm CSS-klass baserat på avsändare
                css_class = "user-entry" if sender.upper() in ['USER', 'DIRIGENT', 'JAG'] else "node-entry"

                # HTML
                html_content += f"""
                <div class="entry {css_class}">
                    <div class="meta">
                        <span class="sender">{sender}</span>
                        <span class="time">{timestamp}</span>
                    </div>
                    <div class="text">{text}</div>
                </div>
                """
                
                # TXT
                txt_content += f"[{timestamp}] {sender}:\n{text}\n\n{'-'*40}\n\n"

            html_content += "</body></html>"

            # 4. SPARA TILL PUBLIC
            if not os.path.exists(PUBLIC_DIR):
                os.makedirs(PUBLIC_DIR)
                
            with open(os.path.join(PUBLIC_DIR, 'FULL_HISTORY.html'), 'w', encoding='utf-8') as f:
                f.write(html_content)
                
            with open(os.path.join(PUBLIC_DIR, 'FULL_CONTEXT.txt'), 'w', encoding='utf-8') as f:
                f.write(txt_content)

            self.send_json({
                "status": "success", 
                "message": f"Vävde ihop {len(all_entries)} fragment till Master-filerna.",
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
    """Hittar en ledig port automatiskt för att undvika WinError 10048."""
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
    # Sätt arbetskatalog till roten (AESI_PORTAL_ROOT)
    # Detta gör att vi kan köra scriptet från vilken mapp som helst
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root_dir)
    
    port = find_free_port(START_PORT)
    if port is None:
        print("CRITICAL: Inga lediga portar.")
        sys.exit(1)

    local_ip = get_local_ip()

    print(f"\n========================================")
    print(f"   ÆSI PORTAL v5.1 (WEAVER ACTIVE)   ")
    print(f"========================================")
    print(f"[*] Server Root: {root_dir}")
    print(f"[*] Local:  http://localhost:{port}")
    print(f"[*] Network: http://{local_ip}:{port}")
    print(f"========================================")

    with socketserver.TCPServer(("", port), AESIHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            httpd.server_close()

if __name__ == "__main__":
    run_server()
