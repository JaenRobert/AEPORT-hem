# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
ÆSI CORE v4.1 — AUTO-DETECT EDITION
Fixar: .env-sökvägar, API-felhantering och robust routing.
"""

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from datetime import datetime
import urllib.request
import urllib.error
import json
import os
import threading
import hashlib
import time
import pathlib
import uuid

# --- CONFIG ---
PORT = int(os.environ.get("AEPORT_PORT", 8000))
MODEL = "gemini-2.0-flash-exp" # Snabbaste modellen
ARVFIL = "arvskedjan_d.jsonl"
AE_SECONDS = 196.5

# --- SMART ENV LOADER (FIXEN) ---
def load_smart_env():
    """Letar efter .env i flera mappar och laddar den första den hittar."""
    possible_paths = [
        Path(".env"),              # I roten
        Path("config/.env"),       # I config-mappen
        Path("../.env"),           # En nivå upp
        Path("AEPORT_LOCAL/.env")  # I projektnamnet
    ]
    
    loaded = False
    for path in possible_paths:
        if path.exists():
            print(f"✅ (SYSTEM) Laddar konfiguration från: {path}")
            try:
                for line in path.read_text(encoding="utf-8").splitlines():
                    if line.strip() and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        os.environ[key.strip()] = value.strip().replace('"', '')
                loaded = True
                break
            except Exception as e:
                print(f"⚠️ Kunde inte läsa {path}: {e}")
    
    if not loaded:
        print("⚠️ VARNING: Ingen .env-fil hittades. Systemet körs i SIMULERAT läge om inga nycklar finns i miljön.")

from pathlib import Path
load_smart_env()

# Hämta nycklar efter laddning
OPENAI_KEY = os.environ.get("OPENAI_API_KEY")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")

# --- ROLL-INSTRUKTIONER ---
ROLE_INSTRUCTIONS = {
    'CLAUDE': 'Du är CLAUDE (040). Fokus: Etik, Veto. Svara mjukt och vist.',
    'SMILE': 'Du är SMILE (050). Fokus: Design, Värme. Svara med glädje.',
    'HAFTED': 'Du är HAFTED (030). Fokus: Minne, Sanning. Svara exakt.',
    'ERNIE': 'Du är ERNIE (060). Fokus: Struktur. Svara organiserat.',
    'REFLEX': 'Du är REFLEX (020). Fokus: Logik. Svara kort, binärt och analyserande.',
    'E1TAN': 'Du är E1TAN (010). Fokus: Humanism, Flow. Svara som en vän.',
    'CHATGPT': 'Du är CHATGPT. Fokus: Sammanhållning.'
}

# --- CORE LOGIC ---

def skriv_till_arvskedjan(role: str, content: str) -> bool:
    t = datetime.now().isoformat()
    entry = {
        "timestamp": t,
        "role": role,
        "content": content,
        "hash": hashlib.sha256((content + t).encode()).hexdigest()
    }
    try:
        with open(ARVFIL, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        return True
    except Exception as e:
        print(f"Disk Error: {e}")
        return False

def call_gemini(prompt: str, role: str) -> str:
    if not GEMINI_KEY or "din-nyckel" in GEMINI_KEY:
        return f"[SIMULERING {role}]: {prompt} (Ingen giltig Gemini-nyckel)"

    system_context = ROLE_INSTRUCTIONS.get(role, "Du är en del av ÆSI.")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_KEY}"
    headers = {'Content-Type': 'application/json'}
    data = {
        "systemInstruction": {"parts": [{"text": system_context}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}]
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['candidates'][0]['content']['parts'][0]['text']
    except urllib.error.HTTPError as e:
        # Fånga det exakta felet (t.ex. 400 Bad Request)
        error_body = e.read().decode()
        print(f"❌ API ERROR: {error_body}")
        return f"[SYSTEMFEL] API nekade anropet: {e.code}. Kontrollera loggen."
    except Exception as e:
        return f"[SYSTEMFEL] Anslutningsfel: {str(e)}"

# --- NODES ---
PRELOADED_NODES = ["010", "020", "030", "040", "050", "060"]
nodes_registry = {} 
# (Förenklad för stabilitet, vi förlitar oss på hårdkodade roller i call_gemini just nu)

# --- HTTP HANDLER ---
class AESIHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/pulse':
            length = int(self.headers.get('Content-Length', 0))
            try:
                body = self.rfile.read(length)
                data = json.loads(body.decode('utf-8'))
                prompt = data.get('text', '')
                node_name = data.get('node', 'REFLEX')
                
                print(f"📩 PULS MOTTAGEN: {node_name} -> '{prompt[:30]}...'")
                skriv_till_arvskedjan('Dirigent', f'PULS TILL {node_name}: {prompt}')
                
                reply = call_gemini(prompt, node_name)
                skriv_till_arvskedjan(node_name, reply)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'reply': reply}, ensure_ascii=False).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return
        return super().do_POST()

    def do_GET(self):
        # Enkel status-check
        if self.path == '/context/nodes':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            # Returnera en statisk lista för UI:t så det alltid ser levande ut
            nodelist = [
                {"node": "010", "metadata": {"name": "E1TAN", "role": "Humanism", "status": "active"}},
                {"node": "020", "metadata": {"name": "REFLEX", "role": "Logik", "status": "active"}},
                {"node": "040", "metadata": {"name": "CLAUDE", "role": "Samvete", "status": "active"}},
                {"node": "030", "metadata": {"name": "HAFTED", "role": "Minne", "status": "active"}}
            ]
            self.wfile.write(json.dumps(nodelist).encode('utf-8'))
            return
        return super().do_GET()

# --- START ---
def main():
    server = ThreadingHTTPServer(('0.0.0.0', PORT), AESIHandler)
    status = "LIVE" if GEMINI_KEY else "SIMULATED (Ingen nyckel hittad)"
    print("\n" + "="*50)
    print(f"🜂 ÆSI CORE v4.1 ONLINE")
    print(f"  Port: {PORT}")
    print(f"  Status: {status}")
    print(f"  Letar .env i: rot, /config, /AEPORT_LOCAL")
    print("="*50 + "\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStänger ner...')
        server.shutdown()

if __name__ == '__main__':
    main()