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
        if self.path == '/memory':
            self.handle_memory_request()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/chat':
            self.handle_chat_request()
        elif self.path == '/weave':
            self.handle_weave()
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

    def handle_weave(self):
        """Väver alla JSON-loggar till HTML och TXT."""
        try:
            messages = self.weave_logs()
            html_content = self.generate_html_history(messages)
            txt_content = self.generate_txt_context(messages)
            
            # Skriv HTML
            html_path = os.path.join(os.getcwd(), 'public', 'FULL_HISTORY.html')
            os.makedirs(os.path.dirname(html_path), exist_ok=True)
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # Skriv TXT
            txt_path = os.path.join(os.getcwd(), 'public', 'FULL_CONTEXT.txt')
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(txt_content)
            
            self.send_json({
                "status": "woven",
                "files_created": ["FULL_HISTORY.html", "FULL_CONTEXT.txt"],
                "message_count": len(messages)
            })
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def weave_logs(self):
        """Läser alla JSON-loggar och extraherar meddelanden."""
        messages = []
        json_files = glob.glob(os.path.join(os.getcwd(), 'memory', 'logs', 'json', '*.json'))
        
        for filepath in sorted(json_files):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        messages.extend(data)
                    elif isinstance(data, dict):
                        messages.append(data)
            except Exception as e:
                print(f"Fel vid läsning av {filepath}: {e}")
        
        return messages

    def generate_html_history(self, messages):
        """Skapar vacker HTML för alla meddelanden."""
        html = """<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <title>ÆSI Väv Historia</title>
  <style>
    body { background: #080808; color: #00ffe0; font-family: monospace; padding: 20px; margin: 0; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { color: #00ffe0; border-bottom: 2px solid #00ffe0; padding-bottom: 10px; }
    .meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
    .message { background: #181818; padding: 12px; margin: 10px 0; border-left: 3px solid #00ffe0; border-radius: 4px; }
    .sender { color: #00bfa0; font-weight: bold; }
    .timestamp { color: #666; font-size: 0.85em; margin-top: 4px; }
    .text { margin-top: 8px; color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧶 ÆSI Väv Historia</h1>
    <div class="meta">Genererad: """ + datetime.now().isoformat() + """</div>
"""
        for msg in messages:
            sender = msg.get('sender') or msg.get('node') or 'OKÄND'
            text = msg.get('text') or msg.get('reply') or msg.get('message') or ''
            timestamp = msg.get('timestamp') or msg.get('date') or ''
            html += f"""    <div class="message">
      <div class="sender">{sender}</div>
      <div class="text">{text}</div>
      <div class="timestamp">{timestamp}</div>
    </div>
"""
        html += """  </div>
</body>
</html>"""
        return html

    def generate_txt_context(self, messages):
        """Skapar plaintext för AI-läsning."""
        lines = ["ÆSI VÄV HISTORIA - KONTEXT", "=" * 50, ""]
        for msg in messages:
            sender = msg.get('sender') or msg.get('node') or 'OKÄND'
            text = msg.get('text') or msg.get('reply') or msg.get('message') or ''
            timestamp = msg.get('timestamp') or msg.get('date') or ''
            lines.append(f"[{sender}] {timestamp}")
            lines.append(text)
            lines.append("")
        return "\n".join(lines)

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
