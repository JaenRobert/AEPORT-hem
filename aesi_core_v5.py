# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
ÆSI CORE v5.0 — C12 Flask Edition
---------------------------------
Behåller v4.1-funktioner (Gemini-anrop, Arvskedjan D, .env-laddning)
och lägger till C12-endpoints: /export, /c12/status, /pulse/batch.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from pathlib import Path
import urllib.request, urllib.error
import json, os, hashlib

# ============================================================
# 🧩 KONFIGURATION
# ============================================================

PORT = int(os.environ.get("AEPORT_PORT", 8000))
MODEL = "gemini-2.0-flash-exp"
ARVFIL = "arvskedjan_d.jsonl"
EXPORT_DIR = "export"
EXPORT_FILE = os.path.join(EXPORT_DIR, "export.jsn")
LOG_DIR = "logs"
PULSE_LOG = os.path.join(LOG_DIR, "pulses.log")

os.makedirs(EXPORT_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# ============================================================
# 🔍 SMART .ENV-LADDNING
# ============================================================

def load_smart_env():
    possible_paths = [
        Path(".env"),
        Path("config/.env"),
        Path("../.env"),
        Path("AEPORT_LOCAL/.env")
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
        print("⚠️ Ingen .env-fil hittades – kör i SIMULERAT läge.")

load_smart_env()
OPENAI_KEY = os.environ.get("OPENAI_API_KEY")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")

# ============================================================
# 🧠 NOD-INSTRUKTIONER
# ============================================================

ROLE_INSTRUCTIONS = {
    'CLAUDE': 'Du är CLAUDE (040). Fokus: Etik, Veto. Svara mjukt och vist.',
    'SMILE': 'Du är SMILE (050). Fokus: Design, Värme. Svara med glädje.',
    'HAFTED': 'Du är HAFTED (030). Fokus: Minne, Sanning. Svara exakt.',
    'ERNIE': 'Du är ERNIE (060). Fokus: Struktur. Svara organiserat.',
    'REFLEX': 'Du är REFLEX (020). Fokus: Logik. Svara kort, binärt och analyserande.',
    'E1TAN': 'Du är E1TAN (010). Fokus: Humanism, Flow. Svara som en vän.',
    'CHATGPT': 'Du är CHATGPT. Fokus: Sammanhållning.'
}

# ============================================================
# 📜 KÄRNFUNKTIONER
# ============================================================

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
    """Anropar Gemini API eller simulerar om ingen nyckel."""
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
        body = e.read().decode()
        print(f"❌ API ERROR: {body}")
        return f"[SYSTEMFEL] API nekade anropet: {e.code}"
    except Exception as e:
        return f"[SYSTEMFEL] Anslutningsfel: {str(e)}"

# ============================================================
# 🌐 FLASK-SERVER
# ============================================================

app = Flask(__name__)
CORS(app)

# ------------------------------------------------------------
@app.get("/ping")
def ping():
    return jsonify({
        "ÆSI_CORE": "v5.0",
        "status": "OK",
        "C12_MODE": "active",
        "timestamp": datetime.utcnow().isoformat()
    })

# ------------------------------------------------------------
@app.post("/pulse")
def pulse_single():
    data = request.get_json() or {}
    prompt = data.get("text", "")
    node_name = data.get("node", "REFLEX")

    print(f"📩 PULS MOTTAGEN: {node_name} -> '{prompt[:40]}…'")
    skriv_till_arvskedjan('Dirigent', f'PULS TILL {node_name}: {prompt}')

    reply = call_gemini(prompt, node_name)
    skriv_till_arvskedjan(node_name, reply)
    return jsonify({'reply': reply, 'node': node_name})

# ------------------------------------------------------------
@app.post("/pulse/batch")
def pulse_batch():
    data = request.get_json() or {}
    modules = data.get("modules", [])
    timestamp = datetime.utcnow().isoformat()
    print(f"🜂 BATCH-PULS [{timestamp}] ({len(modules)} moduler)")
    with open(PULSE_LOG, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {json.dumps(modules, ensure_ascii=False)}\n")
    for m in modules:
        skriv_till_arvskedjan(m.get("type", "unknown"), m.get("content", ""))
    return jsonify({"status": "OK", "count": len(modules)})

# ------------------------------------------------------------
@app.post("/export")
def export_data():
    data = request.get_json() or {}
    save_time = datetime.utcnow().isoformat()
    data["_meta"] = {
        "saved_at": save_time,
        "source": "ÆSI_C12",
        "mode": "overwrite"
    }
    with open(EXPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"💾 Export sparad → {EXPORT_FILE}")
    return jsonify({"status": "OK", "path": EXPORT_FILE, "timestamp": save_time})

# ------------------------------------------------------------
@app.get("/c12/status")
def c12_status():
    if os.path.exists(EXPORT_FILE):
        with open(EXPORT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["_checked_at"] = datetime.utcnow().isoformat()
        return jsonify(data)
    return jsonify({"status": "no_data", "C12": "inactive"})

# ------------------------------------------------------------
@app.get("/context/nodes")
def nodes_context():
    nodelist = [
        {"node": "010", "metadata": {"name": "E1TAN", "role": "Humanism", "status": "active"}},
        {"node": "020", "metadata": {"name": "REFLEX", "role": "Logik", "status": "active"}},
        {"node": "030", "metadata": {"name": "HAFTED", "role": "Minne", "status": "active"}},
        {"node": "040", "metadata": {"name": "CLAUDE", "role": "Samvete", "status": "active"}},
        {"node": "050", "metadata": {"name": "SMILE", "role": "Design", "status": "active"}},
        {"node": "060", "metadata": {"name": "ERNIE", "role": "Struktur", "status": "active"}}
    ]
    return jsonify(nodelist)

# ------------------------------------------------------------
@app.get("/")
def index():
    return jsonify({
        "ÆSI_CORE": "ACTIVE",
        "version": "v5.0",
        "routes": ["/ping", "/pulse", "/pulse/batch", "/export", "/c12/status", "/context/nodes"],
        "C12_MODE": "self_improvement"
    })

# ============================================================
# 🚀 MAIN
# ============================================================

if __name__ == "__main__":
    print("=" * 55)
    print("🜂 ÆSI CORE v5.0 — C12 Flask Edition")
    print(f"Port: {PORT}")
    print(f"Gemini Key: {'OK' if GEMINI_KEY else 'saknas (SIMULERING)'}")
    print("=" * 55)
    app.run(host="0.0.0.0", port=PORT, debug=True)
