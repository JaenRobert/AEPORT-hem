#!/usr/bin/env python3
# Silent Zone Protocol (TZP)
# Toggles QUIET MODE for portal operations
from pathlib import Path
import json

STATE_FILE = Path('state/silent_zone.json')
STATE_FILE.parent.mkdir(parents=True, exist_ok=True)

class SilentZone:
    def __init__(self):
        self.state = {'quiet': False}
        if STATE_FILE.exists():
            try:
                self.state = json.loads(STATE_FILE.read_text(encoding='utf-8'))
            except Exception:
                pass

    def toggle(self):
        self.state['quiet'] = not self.state.get('quiet', False)
        STATE_FILE.write_text(json.dumps(self.state, ensure_ascii=False))
        return self.state

    def is_quiet(self):
        return bool(self.state.get('quiet', False))

if __name__ == '__main__':
    sz = SilentZone()
    print('Silent zone state ->', sz.toggle())
