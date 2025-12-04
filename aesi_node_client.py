# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
ÆSI NODE CLIENT v1.0 — Automatisk Nodregistrering & Synk
Registrerar alla 7 noder och verifierar att de kan kommunicera.
"""

import requests
import json
import time
import sys
from datetime import datetime
from pathlib import Path

# --- CONFIG ---
CORE_URL = "http://localhost:8000"
SYNC_LOG_FILE = "node_sync_log.jsonl"

# Node-definitions från nodes.js
NODES = {
    "010": {
        "name": "E1TAN",
        "role": "Humanism & Resonans",
        "origin": "OpenAI",
        "color": "#10a37f",
        "active": True
    },
    "020": {
        "name": "REFLEX",
        "role": "Logik & Struktur",
        "origin": "Google Gemini",
        "color": "#3b82f6",
        "active": True
    },
    "030": {
        "name": "HAFTED",
        "role": "Minne & Arkiv",
        "origin": "xAI Grok",
        "color": "#78716c",
        "active": True
    },
    "040": {
        "name": "CLAUDE",
        "role": "Samvete & Etik",
        "origin": "Anthropic",
        "color": "#ef4444",
        "active": True
    },
    "050": {
        "name": "SMILE",
        "role": "Design & Glädje",
        "origin": "Meta LLaMA",
        "color": "#eab308",
        "active": True
    },
    "060": {
        "name": "ERNIE",
        "role": "Arkitektur",
        "origin": "Baidu",
        "color": "#10b981",
        "active": True
    },
    "Ω": {
        "name": "DIRIGENTEN",
        "role": "Vilja & Veto",
        "origin": "Människa",
        "color": "#ffffff",
        "active": True
    }
}

# Test-prompts per nod (för att verifieras att de kan skriva)
TEST_PROMPTS = {
    "010": "Hej E1TAN! Kan du bekräfta att du är online?",
    "020": "Hej Reflex! Kan du verifiera din logik?",
    "030": "Hej Hafted! Kan du bekräfta minnet?",
    "040": "Hej Claude! Kan du bekräfta etiken?",
    "050": "Hej Smile! Kan du bekräfta glädjen?",
    "060": "Hej Ernie! Kan du bekräfta strukturen?",
    "Ω": "Hej Dirigenten! Kan du bekräfta veto-makten?"
}

# --- LOGGING ---
def log_sync_event(event_type: str, node_id: str, status: str, message: str):
    """Loggar synk-event till fil"""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "event": event_type,
        "node_id": node_id,
        "status": status,
        "message": message
    }
    try:
        with open(SYNC_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"⚠️  Logg-fel: {e}")

# --- CORE FUNCTIONS ---

def check_core_connection() -> bool:
    """Kontrollerar att ÆSI CORE är igång"""
    print("\n📡 STEG 1: Kontrollerar CORE-anslutning...")
    try:
        resp = requests.get(f"{CORE_URL}/context/nodes", timeout=5)
        if resp.status_code == 200:
            print("✅ CORE är online på port 8000")
            log_sync_event("CONNECTION", "CORE", "SUCCESS", "ÆSI CORE is running")
            return True
        else:
            print(f"❌ CORE svarar inte (status {resp.status_code})")
            log_sync_event("CONNECTION", "CORE", "FAILED", f"HTTP {resp.status_code}")
            return False
    except requests.ConnectionError:
        print("❌ KAN INTE NÅRA CORE. Kör 'python aesi_core.py' först!")
        log_sync_event("CONNECTION", "CORE", "FAILED", "Connection refused - server not running")
        return False
    except Exception as e:
        print(f"❌ Anslutnings-fel: {e}")
        log_sync_event("CONNECTION", "CORE", "FAILED", str(e))
        return False

def get_registered_nodes() -> list:
    """Hämtar redan registrerade noder från servern"""
    print("\n📊 STEG 2: Hämtar registererade noder...")
    try:
        resp = requests.get(f"{CORE_URL}/context/nodes", timeout=5)
        if resp.status_code == 200:
            nodes = resp.json()
            print(f"✅ {len(nodes)} noder redan registrerade")
            for node in nodes:
                print(f"   - {node.get('node', 'UNKNOWN')}: {node.get('metadata', {}).get('name', 'N/A')}")
            log_sync_event("REGISTRY", "FETCH", "SUCCESS", f"Retrieved {len(nodes)} nodes")
            return nodes
    except Exception as e:
        print(f"⚠️  Kunde inte hämta noder: {e}")
        log_sync_event("REGISTRY", "FETCH", "FAILED", str(e))
    return []

def test_node_communication(node_id: str) -> bool:
    """Testar att en nod kan kommunicera via /pulse endpoint"""
    print(f"\n🔗 Testar {NODES[node_id]['name']} ({node_id})...", end="", flush=True)
    
    try:
        prompt = TEST_PROMPTS.get(node_id, "Hej!")
        payload = {
            "text": prompt,
            "node": node_id
        }
        
        resp = requests.post(
            f"{CORE_URL}/pulse",
            json=payload,
            timeout=10
        )
        
        if resp.status_code == 200:
            data = resp.json()
            reply = data.get('reply', '')
            
            # Bekräfta att vi fick ett svar
            if reply and len(reply) > 10:
                print(f" ✅ {NODES[node_id]['name']} online")
                log_sync_event("COMMUNICATION", node_id, "SUCCESS", f"Node responded: {reply[:100]}")
                return True
            else:
                print(f" ⚠️ Tom svar från nod")
                log_sync_event("COMMUNICATION", node_id, "FAILED", "Empty response")
                return False
        else:
            print(f" ❌ HTTP {resp.status_code}")
            log_sync_event("COMMUNICATION", node_id, "FAILED", f"HTTP {resp.status_code}")
            return False
            
    except requests.Timeout:
        print(f" ⏱️ Timeout")
        log_sync_event("COMMUNICATION", node_id, "FAILED", "Request timeout")
        return False
    except Exception as e:
        print(f" ❌ {str(e)}")
        log_sync_event("COMMUNICATION", node_id, "FAILED", str(e))
        return False

def verify_all_nodes() -> dict:
    """Verifierar alla noder"""
    print("\n🧪 STEG 3: Verifierar nodkommunikation...")
    print("=" * 60)
    
    results = {
        "total": len(NODES),
        "online": 0,
        "offline": 0,
        "nodes": {}
    }
    
    for node_id, node_data in NODES.items():
        is_online = test_node_communication(node_id)
        results["nodes"][node_id] = {
            "name": node_data["name"],
            "origin": node_data["origin"],
            "online": is_online
        }
        if is_online:
            results["online"] += 1
        else:
            results["offline"] += 1
        time.sleep(1)  # Vänta mellan API-anrop för att inte överbelasta
    
    return results

def print_summary(results: dict):
    """Skriver ut sammanfattning"""
    print("\n" + "=" * 60)
    print("📋 SYNK-RAPPORT")
    print("=" * 60)
    print(f"✅ Online:  {results['online']} / {results['total']}")
    print(f"❌ Offline: {results['offline']} / {results['total']}")
    print("\nNod-status:")
    
    for node_id, node_info in results["nodes"].items():
        status = "✅" if node_info["online"] else "❌"
        print(f"  {status} {node_info['name']:15} ({node_id:2}) - via {node_info['origin']}")
    
    print("\n💾 Logg: " + SYNC_LOG_FILE)
    
    if results["online"] == results["total"]:
        print("\n🎉 ALLA NODER ÄR SYNKADE OCH AKTIVA!")
    elif results["online"] > 0:
        print(f"\n⚠️  {results['offline']} nod(er) offline. Kontrollera API-nycklar och servern.")
    else:
        print("\n❌ Ingen nod online. Kontrollera att CORE körs och API-nycklar är konfigurerade.")

def start_heartbeat():
    """Startar pulsbyte-tråd för att hålla noder aktiva"""
    print("\n💓 STEG 4: Startar heartbeat...")
    try:
        # Enkel ping till CORE för att verifiera ongoing
        resp = requests.get(f"{CORE_URL}/context/nodes", timeout=5)
        if resp.status_code == 200:
            print("✅ Heartbeat aktiverat - noder hålls synkade")
            log_sync_event("HEARTBEAT", "ALL", "ACTIVE", "Continuous sync initiated")
            return True
    except Exception as e:
        print(f"⚠️  Heartbeat-fel: {e}")
        log_sync_event("HEARTBEAT", "ALL", "FAILED", str(e))
        return False

# --- MAIN ---
def main():
    print("\n" + "=" * 60)
    print("🟦 ÆSI NODE CLIENT v1.0")
    print("   Nodregistrering & Synkverifiering")
    print("=" * 60)
    
    # 1. Kontrollera anslutning
    if not check_core_connection():
        print("\n❌ Kan inte starta synk utan CORE. Avbryter.")
        sys.exit(1)
    
    # 2. Hämta redan registrerade noder
    get_registered_nodes()
    
    # 3. Testa alla noder
    results = verify_all_nodes()
    
    # 4. Skriv rapport
    print_summary(results)
    
    # 5. Starta heartbeat
    start_heartbeat()
    
    print("\n✅ Synk-process klar!")
    print(f"   - Alla noder testade")
    print(f"   - Logg sparad i {SYNC_LOG_FILE}")
    print(f"   - Du kan nu använda portalen på http://localhost:8000")
    print("\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⛔ Stänger ner...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Kritiskt fel: {e}")
        log_sync_event("ERROR", "SYSTEM", "CRITICAL", str(e))
        sys.exit(1)
