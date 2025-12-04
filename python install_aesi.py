import os

# Namnet på rotmappen
ROOT_DIR = "ÆSI_PORTSYNC_v1.0"

# Alla filer och deras innehåll
files = {
    "package.json": """{
  "name": "aesi-port-book",
  "version": "1.0.0",
  "description": "ÆSI Port-Boken v1.0 — autosave, export och Netlify-sync",
  "scripts": {
    "build": "mkdir -p dist && cp index.html dist/ && cp -r js dist/ && cp -r chapters dist/"
  },
  "devDependencies": {
    "cpy-cli": "^5.0.0"
  },
  "author": "Æ00.K01 — E1tan",
  "license": "MIT"
}""",

    "index.html": """<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ÆSI Port-Boken</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.4/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 text-gray-800">
  <header class="text-center py-8">
    <h1 class="text-3xl font-bold">ÆSI Port-Boken</h1>
    <p class="text-sm text-gray-600">Saga · Dirigent · Maskin</p>
  </header>

  <section data-mbk-id="MBK-1.1" class="chapter px-8 py-6">
    <h2 class="text-xl font-semibold mb-4">Kapitel 1 – Människans Sida av Myntet</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div data-role="saga" class="p-4 bg-white rounded-2xl shadow" contenteditable="true">[Sagan - Skriv här...]</div>
      <div data-role="dirigent" class="p-4 bg-white rounded-2xl shadow" contenteditable="true">[Min Samling - Skriv här...]</div>
      <div data-role="maskin" class="p-4 bg-white rounded-2xl shadow" contenteditable="true">[Maskinsamling - Skriv här...]</div>
    </div>
  </section>

  <footer class="text-center py-6 text-sm text-gray-500">
    Æ-system v1.0 · autosave aktiv · export redo (Ctrl+E)
  </footer>

  <script type="module" src="./js/autosave.js"></script>
  <script type="module" src="./js/export.js"></script>
</body>
</html>""",

    "js/autosave.js": """const SAVE_INTERVAL_MS = 10000;

function collectBookData() {
  const sections = document.querySelectorAll(".chapter");
  const data = {};
  sections.forEach(sec => {
    const id = sec.dataset.mbkId;
    data[id] = {};
    sec.querySelectorAll("[data-role]").forEach(el => {
      data[id][el.dataset.role] = el.innerText.trim();
    });
  });
  return data;
}

function autosave() {
  const data = collectBookData();
  localStorage.setItem("aesi_autosave", JSON.stringify(data));
  console.info("ÆSI autosave:", new Date().toLocaleTimeString());
}

// Ladda in sparad data vid start
window.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("aesi_autosave");
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(chapterId => {
            const section = document.querySelector(`[data-mbk-id='${chapterId}']`);
            if (section) {
                Object.keys(parsed[chapterId]).forEach(role => {
                    const el = section.querySelector(`[data-role='${role}']`);
                    if (el) el.innerText = parsed[chapterId][role];
                });
            }
        });
        console.log("ÆSI: Historik återställd.");
    }
});

setInterval(autosave, SAVE_INTERVAL_MS);
window.addEventListener("beforeunload", autosave);""",

    "js/export.js": """export function exportAll() {
  const data = localStorage.getItem("aesi_autosave") || "{}";
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MASTERBOOK_EXPORT_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  console.info("ÆSI export triggered");
}

window.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "e") {
      e.preventDefault(); 
      exportAll();
  }
});""",

    "js/edge_server.py": """#!/usr/bin/env python3
\"\"\"
ÆSI Edge Server Stub v1.0
Simulerar lokal backup till Proton Drive (placeholder).
\"\"\"
import json, os, datetime

def sync(target="proton"):
    # Gå upp ett steg från /js/ mappen om scriptet körs därifrån
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    export_file = os.path.join(base, "MASTERBOOK_EXPORT.json") # Letar efter en manuell export om den finns
    
    print(f"[ÆSI SYNC] Checking {base}...")
    timestamp = datetime.datetime.now().isoformat()
    print(f"[ÆSI SYNC] {timestamp} → {target.upper()} (Simulation Complete)")

if __name__ == "__main__":
    sync()""",

    "chapters/MBK_1_1.json": """{
  "MBK-1.1": {
    "saga": "Placeholder Saga",
    "dirigent": "Placeholder Dirigent",
    "maskin": "Placeholder Maskin"
  }
}""",
    
    "chapters/MBK_1_2.json": "{}",
    "chapters/MBK_1_3.json": "{}",

    ".github/workflows/aesi_sync.yml": """name: ÆSI Port-Sync v1.0
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install dependencies
        run: npm ci
      - name: Build Port-Book
        run: npm run build
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: "./dist"
          github-token: ${{ secrets.GITHUB_TOKEN }}
          netlify-site-id: ${{ secrets.NETLIFY_SITE_ID }}
          netlify-auth-token: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      - name: Backup to Proton Drive
        run: python3 ./js/edge_server.py --sync --target proton"""
}

def create_structure():
    print(f"🚀 Initierar ÆSI Konstruktör för: {ROOT_DIR}")
    
    if not os.path.exists(ROOT_DIR):
        os.makedirs(ROOT_DIR)
        print(f"📁 Skapade rotmapp: {ROOT_DIR}")

    for filepath, content in files.items():
        full_path = os.path.join(ROOT_DIR, filepath)
        
        # Skapa undermappar om de inte finns (t.ex. js/ eller .github/workflows/)
        directory = os.path.dirname(full_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
            print(f"📂 Skapade mapp: {directory}")
            
        # Skriv filen
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ Skapade fil: {filepath}")

    print("\n✨ ÆSI_PORTSYNC_v1.0 är färdigbyggd.")
    print(f"👉 Gå in i mappen: cd {ROOT_DIR}")
    print("👉 Initiera Git: git init")

if __name__ == "__main__":
    create_structure()