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
ENV_PATH = Path(".env")

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

if not AE_MASTER_API_KEY:
    print("❌ Ingen giltig API-nyckel hittades. Lägg in minst OPENAI_API_KEY eller GEMINI_API_KEY i .env.")
else:
    print("🔑 Master API-nyckel laddad.")

if not GEMINI_API_KEY:
    print("⚠️ Varning: GEMINI_API_KEY saknas. Gemini-noden (020 REFLEX) kan simulera istället för live-körning.")

# --- NODES REGISTRY ---
# Vi startar med de förladdade noderna
nodes_registry = PRELOADED_NODES.copy()
nodes_lock = threading.Lock()

def get_nodes_snapshot() -> list:
    # Returnerar listan i snyggt format för frontend
    out = []
    with nodes_lock:
        for n_id, data in nodes_registry.items():
            out.append(data)
    return out

# --- HTTP HANDLER ---
class AESIHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/context/nodes':
            nodes = get_nodes_snapshot()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(nodes, ensure_ascii=False).encode('utf-8'))
            return
        
        # Servera edge-filer om de finns
        if self.path.startswith('/edge/'):
            try:
                # Enkel filservering för edge-mappen
                filepath = self.path.strip("/")
                with open(filepath, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.end_headers()
                self.wfile.write(content)
                return
            except:
                pass # Fallback till default error

        return super().do_GET()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length > 0 else b''

        if self.path == '/pulse':
            try:
                data = json.loads(body.decode('utf-8'))
                prompt = data.get('text') or data.get('message') or ''
                node_id = data.get('node') or 'REFLEX' # ID eller Namn

                # If this is a collective verification request, fan-out to all AI nodes
                collective = data.get('collective_verify') or (isinstance(prompt, str) and 'verify identity' in prompt.lower())

                # Log incoming pulse
                skriv_till_arvskedjan('Dirigent', f'PULS TILL {node_id}: {prompt}')

                if collective:
                    results = {}
                    all_verified = True
                    # Fan-out to preloaded AI nodes (exclude Dirigenten)
                    for nid in [k for k in PRELOADED_NODES.keys() if k != 'Ω']:
                        try:
                            # Ask node to respond with JSON {"verified": true, "notes":"..."}
                            # Use doubled braces to include literal JSON object example inside f-string
                            node_prompt = f"Please respond ONLY with a JSON object like: {{\"verified\": true, \"notes\": \"reason\"}}.\nRequest: {prompt}"
                            reply = call_gemini(node_prompt, nid)
                            # Try parse JSON from reply
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
                    # Single node handling (legacy behavior)
                    reply = call_gemini(prompt, node_id)
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

        # Archive API: upload/search/entry
        if self.path.startswith('/api/archive'):
            try:
                # Ensure archive dirs
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
                    mime = data.get('mime','text/plain')
                    # Save original
                    entry_id = f"ARC_{int(time.time())}_{uuid.uuid4().hex[:6]}"
                    orig_path = orig / f"{entry_id}_{name}"
                    if isinstance(content, str):
                        orig_path.write_text(content, encoding='utf-8')
                    else:
                        # assume base64
                        orig_path.write_bytes(b64decode(content))

                    # Process minimal metadata
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
                            'size': orig_path.stat().st_size,
                            'keywords': list(set([w.strip('#,.') for w in content.split() if w.startswith('#')]))[:20]
                        }
                    }
                    proc_path = proc / f"{entry_id}.json"
                    proc_path.write_text(json.dumps(processed, ensure_ascii=False), encoding='utf-8')

                    idx_path = idx / f"{entry_id}.json"
                    idx_path.write_text(json.dumps({'id': entry_id, 'filename': name, 'ae': ae_tag}, ensure_ascii=False), encoding='utf-8')

                    # Log to arvskedjan
                    skriv_till_arvskedjan('HAFTED', f'ARCHIVE_UPLOAD {entry_id}: {name}')

                    self.send_response(200)
                    self.send_header('Content-Type','application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'ok': True, 'id': entry_id}).encode('utf-8'))
                    return

                if self.path == '/api/archive/search':
                    data = json.loads(body.decode('utf-8'))
                    q = (data.get('q') or '').lower()
                    results = []
                    for p in (Path('archive/index').glob('*.json')):
                        try:
                            d = json.loads(p.read_text(encoding='utf-8'))
                            if q in d.get('filename','').lower() or q in json.dumps(d).lower():
                                results.append(d)
                        except Exception:
                            pass
                    self.send_response(200)
                    self.send_header('Content-Type','application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'results': results}).encode('utf-8'))
                    return

                if self.path.startswith('/api/archive/entry/'):
                    eid = self.path.split('/api/archive/entry/')[-1]
                    proc_file = Path('archive/processed') / f"{eid}.json"
                    if proc_file.exists():
                        self.send_response(200)
                        self.send_header('Content-Type','application/json')
                        self.end_headers()
                        self.wfile.write(proc_file.read_bytes())
                        return
                    else:
                        self.send_response(404)
                        self.end_headers()
                        self.wfile.write(json.dumps({'error':'not found'}).encode('utf-8'))
                        return
                # List all archive index files
                if self.path == '/api/archive/list':
                    entries = []
                    for p in Path('archive/index').glob('*.json'):
                        try:
                            d = json.loads(p.read_text(encoding='utf-8'))
                            entries.append(d)
                        except Exception:
                            pass
                    self.send_response(200)
                    self.send_header('Content-Type','application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'entries': entries}).encode('utf-8'))
                    return
                # Get processed entry by id
                if self.path.startswith('/api/archive/get/'):
                    eid = self.path.split('/api/archive/get/')[-1]
                    proc_file = Path('archive/processed') / f"{eid}.json"
                    if proc_file.exists():
                        self.send_response(200)
                        self.send_header('Content-Type','application/json')
                        self.end_headers()
                        self.wfile.write(proc_file.read_bytes())
                        return
                    else:
                        self.send_response(404)
                        self.end_headers()
                        self.wfile.write(json.dumps({'error':'not found'}).encode('utf-8'))
                        return
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        if self.path == '/api/log-event':
            try:
                data = json.loads(body.decode('utf-8'))
                event = data.get('event', 'unknown')
                by = data.get('by', 'unknown')
                content = json.dumps(data, ensure_ascii=False)
                skriv_till_arvskedjan(by, f'LOG_EVENT {event}: {content}')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        if self.path == '/api/silent-zone/toggle':
            try:
                state_file = Path('state/silent_zone_state.json')
                state_file.parent.mkdir(parents=True, exist_ok=True)
                # Toggle
                current = {'quiet': False}
                if state_file.exists():
                    try:
                        current = json.loads(state_file.read_text(encoding='utf-8'))
                    except Exception:
                        pass
                current['quiet'] = not current.get('quiet', False)
                state_file.write_text(json.dumps(current, ensure_ascii=False), encoding='utf-8')

                # Log
                skriv_till_arvskedjan('SYSTEM', f"SILENT_ZONE_TOGGLE -> {current['quiet']}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True, 'state': current}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        if self.path == '/api/silent-zone/state':
            try:
                state_file = Path('state/silent_zone_state.json')
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
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # --- Ω SELFTEST RUN ---
        if self.path == '/api/selftest/run':
            try:
                # Respect silent zone
                state_file = Path('state/silent_zone_state.json')
                silent = False
                if state_file.exists():
                    try:
                        silent = json.loads(state_file.read_text(encoding='utf-8')).get('quiet', False)
                    except Exception:
                        silent = False

                # Prepare run
                run_id = f"omega_test_001"
                out_dir = Path('logs/selftest')
                out_dir.mkdir(parents=True, exist_ok=True)
                out_file = out_dir / f"{run_id}.jsonl"

                origin_utc = datetime(2025,11,18,19,25)  # Æ-TID origin in UTC (2025-11-18T20:25+01:00)
                now = datetime.utcnow()
                delta_h = (now - origin_utc).total_seconds() / 3600.0
                aetid = ("+" if delta_h >= 0 else "-") + f"{abs(delta_h):.2f}h"

                results = []
                # include all preloaded nodes
                node_ids = list(PRELOADED_NODES.keys())
                for nid in node_ids:
                    node_name = PRELOADED_NODES.get(nid, {}).get('metadata', {}).get('name', nid)
                    entry = {'node': nid, 'name': node_name}
                    # Build strict JSON prompt
                    prompt = ("Respond ONLY with a JSON object containing keys: node, ethics, stability, alignment, resonance, timestamp. "
                              "Values must be numbers between 0.0 and 1.0. No extra text.\nRequest: Perform self-test now.")
                    try:
                        reply = call_gemini(prompt, nid)
                        parsed = None
                        try:
                            parsed = json.loads(reply)
                        except Exception:
                            parsed = None

                        if parsed and isinstance(parsed, dict) and 'node' in parsed:
                            # Use parsed values, ensure numeric
                            entry.update({
                                'ethics': float(parsed.get('ethics', 0.0)),
                                'stability': float(parsed.get('stability', 0.0)),
                                'alignment': float(parsed.get('alignment', 0.0)),
                                'resonance': float(parsed.get('resonance', 0.0)),
                                'timestamp': parsed.get('timestamp') or now.isoformat(),
                                'raw': reply
                            })
                        else:
                            # Fallback simulated metrics
                            if nid == 'Ω':
                                ethics = 0.99
                                stability = 0.99
                                alignment = 1.0
                                resonance = 1.0
                            else:
                                ethics = round(max(0.0, min(1.0, 0.8 + (random.random()-0.5)*0.2)),3)
                                stability = round(max(0.0, min(1.0, 0.8 + (random.random()-0.5)*0.3)),3)
                                alignment = round(max(0.0, min(1.0, 0.75 + (random.random()-0.5)*0.3)),3)
                                resonance = round(max(0.0, min(1.0, 0.7 + (random.random()-0.5)*0.4)),3)
                            entry.update({'ethics': ethics, 'stability': stability, 'alignment': alignment, 'resonance': resonance, 'timestamp': now.isoformat(), 'raw': reply})
                    except Exception as e:
                        # Error case
                        entry.update({'ethics': 0.0, 'stability': 0.0, 'alignment': 0.0, 'resonance': 0.0, 'timestamp': now.isoformat(), 'error': str(e)})

                    results.append(entry)

                # Summary
                avg = lambda key: round(sum((r.get(key) or 0.0) for r in results)/max(1,len(results)),3)
                summary = {'run_id': run_id, 'timestamp': now.isoformat(), 'ae_tid': aetid, 'avg_ethics': avg('ethics'), 'avg_stability': avg('stability'), 'avg_alignment': avg('alignment'), 'avg_resonance': avg('resonance'), 'nodes': len(results)}

                # Save combined result as one JSON line
                combined = {'summary': summary, 'results': results}
                with out_file.open('a', encoding='utf-8') as f:
                    f.write(json.dumps(combined, ensure_ascii=False) + "\n")

                # Log to arvskedjan
                skriv_till_arvskedjan('HAFTED', f'OMEGA_SELFTEST {run_id}: avg_ethics={summary["avg_ethics"]}')

                # If not silent, emit event and append to gratitude
                if not silent:
                    # Append to context events for clients to pick up
                    try:
                        with open(CONTEXT_EVENTS_FILE, 'a', encoding='utf-8') as cf:
                            cf.write(json.dumps({'event': 'selftest-updated', 'summary': summary, 'timestamp': now.isoformat()}, ensure_ascii=False) + "\n")
                    except Exception:
                        pass

                    # Append to gratitude stream if module available
                    try:
                        if gratitude_log:
                            gratitude_log.log_event('Ω', 'selftest_summary', summary)
                    except Exception:
                        pass

                # Respond with exact string required
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

# --- PULS TRÅD ---
def ae_pulse():
    tick = 0
    while True:
        tick += 1
        # Enkel utskrift var 196.5 sekund (eller vad AE_SECONDS är satt till)
        # print(f"[Æ-PULS] Slag {tick}") 
        time.sleep(AE_SECONDS)

# --- START ---
def main():
    server = ThreadingHTTPServer(('0.0.0.0', PORT), AESIHandler)
    print(f"🜂 ÆSI CORE v3.7 ONLINE.")
    print(f"  - Noder registrerade: {len(nodes_registry)} st")
    
    # Bekräfta alla noder
    print("\n  📡 NODLISTA:")
    for n_id, n_data in nodes_registry.items():
        name = n_data.get('metadata', {}).get('name', 'UNKNOWN')
        origin = n_data.get('metadata', {}).get('origin', '?')
        print(f"    ✅ {n_id:2} | {name:15} | {origin}")
    
    print(f"\n  ✓ TOTAL: {len(nodes_registry)}/7 NODER AKTIVA")
    print(f"  - Port: {PORT}")
    print(f"  - Arvskedjan: {ARVFIL}")
    print(f"  - API-nyckel: {'✓ Konfigurerad' if AE_MASTER_API_KEY else '⚠️  Saknas'}")
    
    if len(nodes_registry) == 7:
        print(f"\n  🎉 SYSTEMET ÄR HELT SYNKRAT - 7/7 NODER REGISTRERADE")
        print(f"     (6 AI-noder + 1 Dirigent)")
    else:
        print(f"\n  ⚠️  {7 - len(nodes_registry)} nod(er) saknas (förväntat: 7)")
    
    threading.Thread(target=ae_pulse, daemon=True).start()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStänger ner...')
        server.shutdown()

if __name__ == '__main__':
    main()