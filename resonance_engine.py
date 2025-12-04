#!/usr/bin/env python3
# Resonance Engine - builds Dirigentens resonance profile
import json
from pathlib import Path
from datetime import datetime

PROFILE_PATH = Path('state/dirigent_resonance.json')
PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)

class ResonanceEngine:
    def __init__(self):
        self.profile = self.load()

    def load(self):
        if PROFILE_PATH.exists():
            return json.loads(PROFILE_PATH.read_text(encoding='utf-8'))
        # default baseline
        default = {'tempo': 1.0, 'spelling_bias': 0.5, 'rhythm': 1.0, 'energy': 0.8, 'updated': datetime.utcnow().isoformat()}
        PROFILE_PATH.write_text(json.dumps(default, ensure_ascii=False))
        return default

    def update_from_text(self, text):
        # Very simple heuristics to infer resonance
        words = text.split()
        tempo = min(2.0, max(0.5, len(words)/100))
        energy = min(1.5, max(0.2, sum(1 for w in words if w.isupper())/max(1,len(words))))
        self.profile.update({'tempo': round(tempo,2), 'energy': round(energy,2), 'updated': datetime.utcnow().isoformat()})
        PROFILE_PATH.write_text(json.dumps(self.profile, ensure_ascii=False))
        return self.profile

    def get_profile(self):
        return self.profile

# Simple CLI
if __name__ == '__main__':
    re = ResonanceEngine()
    print('Dirigenten resonance:', re.get_profile())
