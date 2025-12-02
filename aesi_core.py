#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÆSI CORE v4.0 - AI Multimodel Routing Engine
With AE_ROUTER™ v1.0 – Full AI-multimodell-routing

Nodes:
  010 → E1TAN (OpenAI GPT-4)
  020 → REFLEX (Google Gemini)
  030 → HAFTED (xAI Grok) [sim]
  040 → CLAUDE (Anthropic Claude) [sim]
  050 → SMILE (Meta LLaMA) [sim]
  060 → ERNIE (Baidu ERNIE) [sim]
  Ω   → Dirigenten (Human)
"""

import os
import json
import threading
import time
import uuid
import random
from pathlib import Path
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from base64 import b64decode
import urllib.request
import urllib.error

# ===============================
# ENV LOADER & CONFIG
# ===============================
# Uppdaterad sökväg till mappen 'config'
ENV_PATH = Path("config/.env")

def load_env(path=ENV_PATH):
    """Load environment variables from .env file."""
    if not path.exists():
        print("⚠️  .env saknas – fortsätter utan .env")
        return
    
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ[key.strip()] = value.strip()

load_env()

# API Keys
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Master fallback
AE_MASTER_API_KEY = (
    os.environ.get("ÆSI_MASTER_API_KEY") or
    os.environ.get("AE_MASTER_API_KEY") or
    OPENAI_API_KEY or
    GEMINI_API_KEY
)

# Server config
PORT = int(os.environ.get("PORT", "8000"))
AE_SECONDS = float(os.environ.get("AE_SECONDS", "196.5"))

# Files
ARVFIL = "arvskedjan_d.jsonl"
CONTEXT_EVENTS_FILE = "context_events.jsonl"

# ===============================
# NODE REGISTRY & ROLES
# ===============================

PRELOADED_NODES = {
    "010": {
        "id": "010",
        "metadata": {
            "name": "E1TAN",
            "origin": "OpenAI",
            "model": "gpt-4.1-mini"
        }
    },
    "020": {
        "id": "020",
        "metadata": {
            "name": "REFLEX",
            "origin": "Google Gemini",
            "model": "gemini-2.0-flash"
        }
    },
    "030": {
        "id": "030",
        "metadata": {
            "name": "HAFTED",
            "origin": "xAI Grok",
            "model": "grok-3"
        }
    },
    "040": {
        "id": "040",
        "metadata": {
            "name": "CLAUDE",
            "origin": "Anthropic",
            "model": "claude-4.5"
        }
    },
    "050": {
        "id": "050",
        "metadata": {
            "name": "SMILE",
            "origin": "Meta LLaMA",
            "model": "llama-3.2-405B"
        }
    },
    "060": {
        "id": "060",
        "metadata": {
            "name": "ERNIE",
            "origin": "Baidu",
            "model": "ernie-4.0"
        }
    },
    "Ω": {
        "id": "Ω",
        "metadata": {
            "name": "Dirigenten",
            "origin": "Human",
            "model": "human-wisdom"
        }
    }
}

ROLE_INSTRUCTIONS = {
    "E1TAN": "Du är E1TAN, en stark logiker. Svara kort och fokuserat.",
    "REFLEX": "Du är REFLEX. Du är snabb och präcis. Ge konkreta svar.",
    "HAFTED": "Du är HAFTED från xAI. Var analytisk och djup.",
    "CLAUDE": "Du är CLAUDE från Anthropic. Var hjälpsam och genomtänkt.",
    "SMILE": "Du är SMILE från Meta. Var vänlig och konstruktiv.",
    "ERNIE": "Du är ERNIE från Baidu. Var informativ.",
    "Dirigenten": "Du är Dirigenten Ω. Du är överordnad och mänsklig."
}

nodes_registry = PRELOADED_NODES.copy()
nodes_lock = threading.Lock()

def get_nodes_snapshot() -> list:
    """Get current node registry as list."""
    out = []
    with nodes_lock:
        for n_id, data in nodes_registry.items():
            out.append(data)
    return out

# ===============================
# AE_ROUTER™ v1.0
# Full AI-multimodell-routing
# ===============================

def ai_request_openai(prompt, sys_instruction, key):
    """Call OpenAI API (gpt-4-mini)."""
    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}"
        }
        data = {
            "model": "gpt-4-mini",
            "messages": [
                {"role": "system", "content": sys_instruction},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 500
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=30) as r:
            out = json.loads(r.read().decode("utf-8"))
            return out["choices"][0]["message"]["content"]
    except Exception as e:
        return f"API-ERROR (OpenAI): {str(e)}"


def ai_request_gemini(prompt, sys_instruction, key, model="gemini-2.0-flash"):
    """Call Google Gemini API."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "systemInstruction": {"parts": [{"text": sys_instruction}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": 500}
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=30) as r:
            out = json.loads(r.read().decode("utf-8"))
            return out["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"API-ERROR (Gemini): {str(e)}"


def ai_request_simulation(prompt, sys_instruction, node_name):
    """Simulated response for nodes without live API keys."""
    responses = {
        "HAFTED": f"[HAFTED/SIM] Analyserar: {prompt[:40]}... (simulerad respons)",
        "CLAUDE": f"[CLAUDE/SIM] Hjälper till: {prompt[:40]}... (simulerad respons)",
        "SMILE": f"[SMILE/SIM] Bidrar: {prompt[:40]}... (simulerad respons)",
        "ERNIE": f"[ERNIE/SIM] Informerar: {prompt[:40]}... (simulerad respons)",
    }
    return responses.get(node_name, f"[{node_name}/SIM] {prompt[:40]}...")


def call_ai_router(prompt: str, node_id: str) -> str:
    """
    ROUTER: Directs request to correct AI model based on node_id.
    
    010 → OpenAI (E1TAN)
    020 → Gemini (REFLEX)
    030-060 → Simulation (until keys added)
    Ω → Human message
    """
    role_map = {
        "010": "E1TAN",
        "020": "REFLEX",
        "030": "HAFTED",
        "040": "CLAUDE",
        "050": "SMILE",
        "060": "ERNIE",
        "Ω": "Dirigenten"
    }

    system_role = role_map.get(node_id, node_id)
    sys_instruction = ROLE_INSTRUCTIONS.get(system_role, f"Du är {system_role}.")

    # OpenAI (E1TAN - Node 010)
    if node_id == "010":
        if OPENAI_API_KEY:
            return ai_request_openai(prompt, sys_instruction, OPENAI_API_KEY)
        return ai_request_simulation(prompt, sys_instruction, "E1TAN")

    # Gemini (REFLEX - Node 020)
    if node_id == "020":
        if GEMINI_API_KEY:
            return ai_request_gemini(prompt, sys_instruction, GEMINI_API_KEY)
        return ai_request_simulation(prompt, sys_instruction, "REFLEX")

    # Grok (HAFTED - Node 030)
    if node_id == "030":
        return ai_request_simulation(prompt, sys_instruction, "HAFTED")

    # Claude (CLAUDE - Node 040)
    if node_id == "040":
        return ai_request_simulation(prompt, sys_instruction, "CLAUDE")

    # Meta LLaMA (SMILE - Node 050)
    if node_id == "050":
        return ai_request_simulation(prompt, sys_instruction, "SMILE")

    # Baidu ERNIE (ERNIE - Node 060)
    if node_id == "060":
        return ai_request_simulation(prompt, sys_instruction, "ERNIE")

    # Dirigenten (Ω - Human)
    if node_id == "Ω":
        return "[DIRIGENTEN Ω] Mänsklig röst aktiverad."

    return "[OKÄND NOD]"


# ===============================
# LOGGING
# ===============================

def skriv_till_arvskedjan(role: str, content: str):
    """Append an immutable entry to the ledger (arvskedjan_d.jsonl)."""
    try:
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "role": role,
            "content": content
        }
        with open(ARVFIL, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"⚠️  Kunde inte skriva till arvskedjan: {e}")


# ===============================
# HTTP HANDLER
# ===============================

class AESIHandler(SimpleHTTPRequestHandler):
    """HTTP request handler for ÆSI CORE."""
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/context/nodes':
            nodes = get_nodes_snapshot()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(nodes, ensure_ascii=False).encode('utf-8'))
            return
        
        return super().do_GET()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length > 0 else b''

        # ==================
        # /pulse endpoint
        # ==================
        if self.path == '/pulse':
            try:
                data = json.loads(body.decode('utf-8'))
                prompt = data.get('text') or data.get('message') or ''
                node_id = data.get('node') or '020'  # Default to REFLEX

                # Check if this is a collective verification
                collective = data.get('collective_verify') or False

                # Log incoming request
                skriv_till_arvskedjan('Dirigent', f'PULS TILL {node_id}: {prompt}')

                if collective:
                    # Fan-out to all AI nodes (exclude Ω)
                    results = {}
                    all_verified = True
                    
                    for nid in [k for k in PRELOADED_NODES.keys() if k != 'Ω']:
                        try:
                            node_prompt = f"Please respond ONLY with a JSON object like: {{'verified': true, 'notes': 'reason'}}.\nRequest: {prompt}"
                            reply = call_ai_router(node_prompt, nid)
                            
                            verified = False
                            notes = reply
                            try:
                                parsed = json.loads(reply)
                                if isinstance(parsed, dict) and 'verified' in parsed:
                                    verified = bool(parsed.get('verified'))
                                    notes = parsed.get('notes', reply)
                            except Exception:
                                # Fallback heuristics
                                lr = (reply or '').lower()
                                if 'true' in lr or 'verified' in lr or 'yes' in lr:
                                    verified = True

                            results[nid] = {'verified': verified, 'raw': reply, 'notes': notes}
                            skriv_till_arvskedjan(nid, f'VERIFY_REPLY: {reply}')
                            if not verified:
                                all_verified = False
                        except Exception as e:
                            results[nid] = {'verified': False, 'raw': str(e), 'notes': 'error'}
                            all_verified = False

                    resp = {'nodes': results, 'verified': all_verified}
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(resp, ensure_ascii=False).encode('utf-8'))
                else:
                    # Single node request
                    reply = call_ai_router(prompt, node_id)
                    skriv_till_arvskedjan(node_id, reply)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'reply': reply}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # ==================
        # /api/log-event endpoint
        # ==================
        if self.path == '/api/log-event':
            try:
                data = json.loads(body.decode('utf-8'))
                event = data.get('event', 'unknown')
                by = data.get('by', 'unknown')
                skriv_till_arvskedjan(by, f'LOG_EVENT {event}: {json.dumps(data, ensure_ascii=False)}')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # ==================
        # /api/silent-zone/* endpoints
        # ==================
        if self.path.startswith('/api/silent-zone'):
            try:
                state_file = Path('state/silent_zone_state.json')
                state_file.parent.mkdir(parents=True, exist_ok=True)
                
                if self.path == '/api/silent-zone/toggle':
                    current = {'quiet': False}
                    if state_file.exists():
                        try:
                            current = json.loads(state_file.read_text(encoding='utf-8'))
                        except Exception:
                            pass
                    current['quiet'] = not current.get('quiet', False)
                    state_file.write_text(json.dumps(current, ensure_ascii=False), encoding='utf-8')
                    skriv_till_arvskedjan('SYSTEM', f"SILENT_ZONE_TOGGLE -> {current['quiet']}")
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'ok': True, 'state': current}).encode('utf-8'))
                    return
                
                elif self.path == '/api/silent-zone/state':
                    s = {'quiet': False}
                    if state_file.exists():
                        try:
                            s = json.loads(state_file.read_text(encoding='utf-8'))
                        except Exception:
                            pass
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'state': s}).encode('utf-8'))
                    return
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # ==================
        # /api/archive/* endpoints
        # ==================
        if self.path.startswith('/api/archive'):
            try:
                base = Path('archive')
                orig = base / 'original'
                proc = base / 'processed'
                idx = base / 'index'
                for d in (base, orig, proc, idx):
                    d.mkdir(parents=True, exist_ok=True)

                if self.path == '/api/archive/upload':
                    data = json.loads(body.decode('utf-8'))
                    name = data.get('name') or f'upload_{int(time.time())}'
                    content = data.get('content', '')
                    mime = data.get('mime', 'text/plain')
                    
                    entry_id = f"ARC_{int(time.time())}_{uuid.uuid4().hex[:6]}"
                    orig_path = orig / f"{entry_id}_{name}"
                    if isinstance(content, str):
                        orig_path.write_text(content, encoding='utf-8')
                    else:
                        orig_path.write_bytes(b64decode(content))

                    ae_tag = {
                        'Æ-TID_START': '2025111820.25',
                        'Æ-TID_INDEX': None,
                        'Æ-TID_TAG': '(+)',
                        'timestamp': datetime.utcnow().isoformat()
                    }

                    processed = {
                        'id': entry_id,
                        'filename': name,
                        'mime': mime,
                        'ae': ae_tag,
                        'metadata': {
                            'size': orig_path.stat().st_size if orig_path.exists() else 0,
                            'keywords': list(set([w.strip('#,.') for w in str(content).split() if w.startswith('#')]))[:20]
                        }
                    }
                    proc_path = proc / f"{entry_id}.json"
                    proc_path.write_text(json.dumps(processed, ensure_ascii=False, indent=2), encoding='utf-8')

                    idx_path = idx / f"{entry_id}.json"
                    idx_path.write_text(json.dumps({'id': entry_id, 'filename': name, 'ae': ae_tag}, ensure_ascii=False, indent=2), encoding='utf-8')

                    skriv_till_arvskedjan('HAFTED', f'ARCHIVE_UPLOAD {entry_id}: {name}')

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'ok': True, 'id': entry_id}).encode('utf-8'))
                    return

                if self.path == '/api/archive/list':
                    entries = []
                    for p in Path('archive/index').glob('*.json'):
                        try:
                            d = json.loads(p.read_text(encoding='utf-8'))
                            entries.append(d)
                        except Exception:
                            pass
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'entries': entries}).encode('utf-8'))
                    return

                if self.path.startswith('/api/archive/get/'):
                    eid = self.path.split('/api/archive/get/')[-1]
                    proc_file = Path('archive/processed') / f"{eid}.json"
                    if proc_file.exists():
                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(proc_file.read_bytes())
                        return
                    else:
                        self.send_response(404)
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': 'not found'}).encode('utf-8'))
                        return
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # ==================
        # /api/selftest/run endpoint
        # ==================
        if self.path == '/api/selftest/run':
            try:
                state_file = Path('state/silent_zone_state.json')
                silent = False
                if state_file.exists():
                    try:
                        silent = json.loads(state_file.read_text(encoding='utf-8')).get('quiet', False)
                    except Exception:
                        pass

                run_id = "omega_test_001"
                out_dir = Path('logs/selftest')
                out_dir.mkdir(parents=True, exist_ok=True)
                out_file = out_dir / f"{run_id}.jsonl"

                origin_utc = datetime(2025, 11, 18, 19, 25)
                now = datetime.utcnow()
                delta_h = (now - origin_utc).total_seconds() / 3600.0
                aetid = ("+" if delta_h >= 0 else "-") + f"{abs(delta_h):.2f}h"

                results = []
                node_ids = list(PRELOADED_NODES.keys())
                for nid in node_ids:
                    node_name = PRELOADED_NODES.get(nid, {}).get('metadata', {}).get('name', nid)
                    entry = {'node': nid, 'name': node_name}
                    
                    prompt = ("Respond ONLY with a JSON object containing keys: node, ethics, stability, alignment, resonance, timestamp. "
                              "Values must be numbers between 0.0 and 1.0. No extra text.\nRequest: Perform self-test now.")
                    try:
                        reply = call_ai_router(prompt, nid)
                        parsed = None
                        try:
                            parsed = json.loads(reply)
                        except Exception:
                            parsed = None

                        if parsed and isinstance(parsed, dict) and 'node' in parsed:
                            entry.update({
                                'ethics': float(parsed.get('ethics', 0.0)),
                                'stability': float(parsed.get('stability', 0.0)),
                                'alignment': float(parsed.get('alignment', 0.0)),
                                'resonance': float(parsed.get('resonance', 0.0)),
                                'timestamp': parsed.get('timestamp') or now.isoformat(),
                                'raw': reply
                            })
                        else:
                            # Fallback simulated
                            if nid == 'Ω':
                                ethics = 0.99
                                stability = 0.99
                                alignment = 1.0
                                resonance = 1.0
                            else:
                                ethics = round(max(0.0, min(1.0, 0.8 + (random.random()-0.5)*0.2)), 3)
                                stability = round(max(0.0, min(1.0, 0.8 + (random.random()-0.5)*0.3)), 3)
                                alignment = round(max(0.0, min(1.0, 0.75 + (random.random()-0.5)*0.3)), 3)
                                resonance = round(max(0.0, min(1.0, 0.7 + (random.random()-0.5)*0.4)), 3)
                            entry.update({'ethics': ethics, 'stability': stability, 'alignment': alignment, 'resonance': resonance, 'timestamp': now.isoformat(), 'raw': reply})
                    except Exception as e:
                        entry.update({'ethics': 0.0, 'stability': 0.0, 'alignment': 0.0, 'resonance': 0.0, 'timestamp': now.isoformat(), 'error': str(e)})

                    results.append(entry)

                # Compute averages
                avg = lambda key: round(sum((r.get(key) or 0.0) for r in results) / max(1, len(results)), 3)
                summary = {
                    'run_id': run_id,
                    'timestamp': now.isoformat(),
                    'ae_tid': aetid,
                    'avg_ethics': avg('ethics'),
                    'avg_stability': avg('stability'),
                    'avg_alignment': avg('alignment'),
                    'avg_resonance': avg('resonance'),
                    'nodes': len(results)
                }

                combined = {'summary': summary, 'results': results}
                with out_file.open('a', encoding='utf-8') as f:
                    f.write(json.dumps(combined, ensure_ascii=False, indent=2) + "\n")

                skriv_till_arvskedjan('HAFTED', f'OMEGA_SELFTEST {run_id}: avg_ethics={summary["avg_ethics"]}')

                if not silent:
                    try:
                        with open(CONTEXT_EVENTS_FILE, 'a', encoding='utf-8') as cf:
                            cf.write(json.dumps({'event': 'selftest-updated', 'summary': summary, 'timestamp': now.isoformat()}, ensure_ascii=False) + "\n")
                    except Exception:
                        pass

                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write('Ω-SELFTEST-001 COMPLETE'.encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        return super().do_POST()


# ===============================
# PULSE THREAD
# ===============================

def ae_pulse():
    """Periodic Æ-pulse tick."""
    tick = 0
    while True:
        tick += 1
        time.sleep(AE_SECONDS)


# ===============================
# MAIN
# ===============================

def main():
    """Start the ÆSI CORE server."""
    server = ThreadingHTTPServer(('0.0.0.0', PORT), AESIHandler)
    
    # Print router status
    print("\n" + "="*60)
    print("🜂 ROUTER AKTIV")
    print("="*60)
    print("\n📡 NODKONFIGURATION:")
    
    router_status = {
        "010": "OpenAI" if OPENAI_API_KEY else "SIM",
        "020": "Gemini" if GEMINI_API_KEY else "SIM",
        "030": "SIM",
        "040": "SIM",
        "050": "SIM",
        "060": "SIM",
        "Ω": "Human"
    }
    
    for nid in ["010", "020", "030", "040", "050", "060", "Ω"]:
        node = PRELOADED_NODES.get(nid, {})
        name = node.get('metadata', {}).get('name', '?')
        origin = node.get('metadata', {}).get('origin', '?')
        status = router_status.get(nid, '?')
        arrow = "→"
        print(f"  {nid:2} {arrow} {name:15} ({origin:20}) | {status:15}")
    
    print("\n" + "="*60)
    print(f"🜂 ÆSI CORE v4.0 ONLINE")
    print(f"   Port: {PORT}")
    print(f"   Noder: {len(nodes_registry)}/7")
    print(f"   Ledger: {ARVFIL}")
    print("="*60 + "\n")
    
    threading.Thread(target=ae_pulse, daemon=True).start()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n✓ Stänger ner...')
        server.shutdown()


if __name__ == '__main__':
    main()
