import http.server
import socketserver
import json
import os
import sys
import socket

# --- KONFIGURATION ---
START_PORT = 8000
MAX_PORT_RETRIES = 10
MEMORY_DIR = "memory/logs"
EXTENSIONS = {'.json', '.txt', '.md'}

class AESIHandler(http.server.SimpleHTTPRequestHandler):
    """
    ÆSI Custom Handler.
    Hanterar statiska filer (Frontend) och API-anrop (/chat, /memory).
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
        else:
            # Standard: Servera filer (index.html etc.)
            super().do_GET()

    def do_POST(self):
        # API: CHATT (PORTALEN)
        if self.path == '/chat':
            self.handle_chat_request()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_memory_request(self):
        """Scannar memory-mappen och returnerar lista på filer."""
        files_found = []
        
        # Sök i memory/logs/json och memory/logs/txt
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
            
            # SIMULERAD NOD-RESPONS (Här kopplar vi senare in riktigt API)
            # Detta säkerställer att UI fungerar direkt utan API-nyckel.
            response_data = {
                "reply": f"Mottaget i Brunnen: '{user_input}'",
                "node": "ERNIE (060)",
                "status": "LOGGED"
            }
            
            self.send_json(response_data)
            
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
            print(f"Port {port} upptagen. Försöker nästa...")
            port += 1
    return None

def run_server():
    # Sätt arbetskatalog till roten (AESI_PORTAL_ROOT)
    # Detta gör att vi kan köra scriptet från vilken mapp som helst
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root_dir)
    
    port = find_free_port(START_PORT)
    if port is None:
        print("CRITICAL: Inga lediga portar hittades. Döda gamla Python-processer!")
        sys.exit(1)

    print(f"\n========================================")
    print(f"   ÆSI PORTAL v5.0 (CLEAN SLATE)   ")
    print(f"========================================")
    print(f"[*] Server startad i rot: {root_dir}")
    print(f"[*] Brunnen (Memory) sökväg: memory/logs/")
    print(f"[*] Backend aktiv på: http://localhost:{port}")
    print(f"========================================")
    print(f"--> ÖPPNA DENNA LÄNK I WEBBLÄSAREN: http://localhost:{port}")
    print(f"========================================")

    with socketserver.TCPServer(("", port), AESIHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStänger ner servern...")
            httpd.server_close()

if __name__ == "__main__":
    run_server()
