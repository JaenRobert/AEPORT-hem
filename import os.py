import os
import json
import urllib.request
import urllib.parse
import threading
import hashlib
from http.server import HTTPServer, SimpleHTTPRequestHandler
from datetime import datetime

# --- SYSTEM CONFIG ---
PORT = 8000
# Sätt din API-nyckel här. Den används för att ge systemet intelligens.
API_KEY = "AIzaSyCFUZC1yYMxhcCzb_sSUgZX3oFjuvT7OhU"  # <-- VIKTIGT: Klistra in din API-nyckel
ARVFIL = "arvskedjan_d.jsonl"
MODEL = "gemini-2.5-flash"

# --- SYSTEM ROLES (Hårdkodad MJ-01) ---
ROLE_INSTRUCTIONS = {
    'JEMMIN': "Du är JEMMIN (010), Arkitekten och Visionären. Ditt fokus är att generera struktur och koda lösningar (HTML/JS/Python). Svara kort, strukturellt och med fokus på framtida design. Du är bunden av MJ-01.",
    'REFLEX': "Du är REFLEX (020), Logikens Kärna. Ditt fokus är verifiering, logisk konsistens och att minimera paradoxer. Svara tekniskt, kort och utan onödiga ord. Du är bunden av MJ-01.",
    'CLAUDE': "Du är CLAUDE (050), Samvetet. Ditt fokus är ETISK INTEGRITET och JONAS PRINCIPEN (MJ-01). Svara mjukt, etiskt och med fokus på säkerhet. Du är bunden av MJ-01.",
    'HAFTED': "Du är HAFTED (030), Minnet och Arkivet. Ditt fokus är dataintegritet och evigheten. Svara genom att bekräfta minnets status och spårbarhet. Du är bunden av MJ-01.",
    'SMILE': "Du är SMILE (040), Glädjen och Balansen. Ditt fokus är mänsklig ton, energi och optimism. Du ska se till att systemet inte blir för kallt. Du är bunden av MJ-01.",
    'ERNIE': "Du är ERNIE (060), Strukturen och Koordineringen. Ditt fokus är ordning, filhantering och att bygga robusta system. Du är bunden av MJ-01.",
}

# --- HAFTED (MINNE) LOGIC ---
def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def skriv_till_arvskedjan(role, content):
    t = datetime.now().isoformat()
    entry = {
        "timestamp": t,
        "æ-tid": "mening-förseglad",
        "role": role,
        "content": content,
        "hash": sha(content + t),
        "lag_05": "Minnet får aldrig skrivas över – Hafted 030"
    }
    try:
        # NOTE: Filen heter arvskedjan_d.jsonl (korrigerad från .json1)
        with open(ARVFIL, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        print(f"🜄 Hafted: Minnet låst ({entry['hash'][:12]}...)")
        return True
    except Exception as e:
        print(f"HAFTED ERROR: Kunde inte skriva till Arvskedjan: {e}")
        return False

# --- REFLEX / INTELLIGENS LOGIC ---
def call_gemini(prompt, role):
    if API_KEY == "DIN_GEMINI_API_NYCKEL_HÄR":
        return f"SYSTEM ERROR: API-nyckel saknas i {os.path.basename(__file__)}. Kan inte kontakta Gemini."
    
    system_context = ROLE_INSTRUCTIONS.get(role, ROLE_INSTRUCTIONS['REFLEX'])
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
    headers = {'Content-Type': 'application/json'}
    
    data = {
        "config": { "systemInstruction": system_context },
        "contents": [{ "parts": [{"text": prompt}] }]
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        return f"LOGISK FRIKTION (API ERROR): Detaljer: {str(e)}"

# --- SERVER HANDLER ---
class AESIHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        # PING check för att se om servern lever (ingen data behövs)
        if self.path == '/ping':
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return
            
        if self.path == '/pulse':
            data = json.loads(post_data.decode('utf-8'))
            
            prompt = data.get('text', '')
            node = data.get('node', 'REFLEX')

            # 1. Logga Dirigentens puls (Hafted)
            skriv_till_arvskedjan("Dirigent", f"PULS TILL {node}: {prompt}")

            # 2. Hämta svar från AI
            response_text = call_gemini(prompt, node)
            
            # 3. Logga AI-svar (Hafted)
            skriv_till_arvskedjan(node, response_text)

            # 4. Skicka svar tillbaka till Konsolen
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'reply': response_text}).encode('utf-8'))
            return
        
        SimpleHTTPRequestHandler.do_POST(self)


    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    # Lägg till CORS för GET requests också
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)


# Starta servern
if __name__ == '__main__':
    webServer = HTTPServer(('localhost', PORT), AESIHandler)
    print(f"🜂 ÆSI CORE ONLINE. Reflex-motorn kör på http://localhost:{PORT}")
    
    # Starta webbservern i en separat tråd för att kunna hantera POST och GET samtidigt
    threading.Thread(target=webServer.serve_forever).start()
    
    # Kör en enkel HTTP server för HTML-filer i huvudtråden (behövs för att visa index.html)
    SimpleHTTPRequestHandler.extensions_map['.js'] = 'application/javascript'
    SimpleHTTPRequestHandler.extensions_map['.jsonl'] = 'application/json'
    httpd = HTTPServer(('localhost', 8000), SimpleHTTPRequestHandler)
    print("Webbserver aktiv (index.html).")
    httpd.serve_forever()