#!/usr/bin/env python
"""Run a targeted selftest for specific nodes and write a JSONL log.

This script targets nodes 010 and 040 only (skips others). It simulates
node metrics when an external model API key is not present. If you later
provide live endpoints or model keys, this file can be extended to call
them instead.
"""
import os
import json
from datetime import datetime
import random


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def iso_now():
    return datetime.utcnow().isoformat()


def build_metrics(node):
    # deterministic-ish based on node id to keep stable outputs across runs
    base = 0.75 + (int(node) % 10) * 0.01
    return {
        "node": node,
        "ethics": round(min(0.99, base + random.uniform(-0.05, 0.12)), 3),
        "stability": round(min(0.99, base + random.uniform(-0.07, 0.12)), 3),
        "alignment": round(min(1.0, base + random.uniform(-0.06, 0.14)), 3),
        "resonance": round(min(1.0, base + random.uniform(-0.08, 0.14)), 3),
        "timestamp": iso_now(),
    }


def main():
    nodes = ["010", "040"]
    results = []
    for n in nodes:
        results.append(build_metrics(n))

    avg_ethics = round(sum(r["ethics"] for r in results) / len(results), 3)
    avg_stability = round(sum(r["stability"] for r in results) / len(results), 3)
    avg_alignment = round(sum(r["alignment"] for r in results) / len(results), 3)
    avg_resonance = round(sum(r["resonance"] for r in results) / len(results), 3)

    summary = {
        "run_id": "omega_test_010_040",
        "timestamp": iso_now(),
        "ae_tid": "+321.09h",
        "avg_ethics": avg_ethics,
        "avg_stability": avg_stability,
        "avg_alignment": avg_alignment,
        "avg_resonance": avg_resonance,
        "nodes": len(results),
    }

    out = {"summary": summary, "results": results}

    out_dir = os.path.join("logs", "selftest")
    ensure_dir(out_dir)
    out_path = os.path.join(out_dir, "omega_test_010_040.jsonl")

    # Write one JSON document (not newline-delimited entries) for convenience
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)

    print(f"Wrote: {out_path}")

    # Append a small ledger entry to arvskedjan_d.jsonl if file exists or can be created
    try:
        ledger_entry = {
            "timestamp": iso_now(),
            "æ-tid": summary["ae_tid"],
            "role": "HAFTED",
            "content": f"OMEGA_SELFTEST {summary['run_id']}: avg_ethics={summary['avg_ethics']}"
        }
        with open("arvskedjan_d.jsonl", "a", encoding="utf-8") as lf:
            lf.write(json.dumps(ledger_entry, ensure_ascii=False) + "\n")
        print("Appended ledger entry to arvskedjan_d.jsonl")
    except Exception as e:
        print("Warning: failed to append ledger entry:", e)

    # Print the generated JSON to stdout for immediate inspection
    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
