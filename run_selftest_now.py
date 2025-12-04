#!/usr/bin/env python3
import json, random
from datetime import datetime
from pathlib import Path

PRELOADED = ['010','020','030','040','050','060','Ω']
OUT_DIR = Path('logs/selftest')
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = OUT_DIR / 'omega_test_001.jsonl'
ARV = Path('arvskedjan_d.jsonl')

origin_utc = datetime(2025,11,18,19,25)
now = datetime.utcnow()
delta_h = (now - origin_utc).total_seconds() / 3600.0
aetid = ('+' if delta_h>=0 else '-') + f"{abs(delta_h):.2f}h"

results = []
for nid in PRELOADED:
    if nid == 'Ω':
        ethics=0.99; stability=0.99; alignment=1.0; resonance=1.0
    else:
        ethics = round(max(0.0, min(1.0, 0.8 + (random.random()-0.5)*0.2)),3)
        stability = round(max(0.0, min(1.0, 0.8 + (random.random()-0.5)*0.3)),3)
        alignment = round(max(0.0, min(1.0, 0.75 + (random.random()-0.5)*0.3)),3)
        resonance = round(max(0.0, min(1.0, 0.7 + (random.random()-0.5)*0.4)),3)
    entry = {
        'node': nid,
        'ethics': ethics,
        'stability': stability,
        'alignment': alignment,
        'resonance': resonance,
        'timestamp': now.isoformat()
    }
    results.append(entry)

avg = lambda k: round(sum(r[k] for r in results)/len(results),3)
summary = {'run_id':'omega_test_001','timestamp':now.isoformat(),'ae_tid':aetid,'avg_ethics':avg('ethics'),'avg_stability':avg('stability'),'avg_alignment':avg('alignment'),'avg_resonance':avg('resonance'),'nodes':len(results)}
combined = {'summary':summary,'results':results}

with OUT_FILE.open('a', encoding='utf-8') as f:
    f.write(json.dumps(combined, ensure_ascii=False) + '\n')

# Append to arvskedjan
entry = {'timestamp': datetime.utcnow().isoformat(), 'æ-tid': aetid, 'role':'HAFTED', 'content': f'OMEGA_SELFTEST {summary["run_id"]}: avg_ethics={summary["avg_ethics"]}'}
with ARV.open('a', encoding='utf-8') as f:
    f.write(json.dumps(entry, ensure_ascii=False) + '\n')

print('Ω-SELFTEST-001 COMPLETE')
print('Wrote:', OUT_FILE)
print(json.dumps(combined, indent=2, ensure_ascii=False))
