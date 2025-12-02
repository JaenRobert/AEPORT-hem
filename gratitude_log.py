#!/usr/bin/env python3
# Gratitude Log (MTL) - records alignment and kindness events
import json
from pathlib import Path
from datetime import datetime

LOG_DIR = Path('logs/ethics')
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / 'mtl.jsonl'

def log_event(node, event_type, detail=None):
    entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'node': node,
        'type': event_type,
        'detail': detail
    }
    with LOG_FILE.open('a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    return entry

if __name__ == '__main__':
    print('MTL ready. Example log:')
    print(log_event('010','alignment_success', {'score':0.98}))
