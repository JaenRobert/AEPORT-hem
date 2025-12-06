# ÆSI PORTAL v6.2 — CHRONOS STATUS

---

## 🟢 SYSTEM ACTIVE & READY

- Backend: **Running on port 8000** (auto-failover to 8010)
- Frontend: **Chronos Portal** with AI chat, memory viewer, upload, and weaving engine
- Memory: **Omni-Scanner** scanning json/txt/gdoc folders
- Weaver: **Active** — weaves selected JSON logs into master files with filtering/templates
- Upload: **File upload** to memory/logs/json, txt, gdoc via portal UI

---

## 🌐 ACCESS PORTAL

**Correct URL:** http://localhost:8000

**Do NOT use:** http://127.0.0.1:5500 (VS Code Live Server)

---

## 🚀 HOW TO ACCESS

1. Double-click `start_portal.bat`
2. Wait for console to show: "ÆSI PORTAL v6.2 (CHRONOS)"
3. Open **http://localhost:8000** in browser
4. Use the drop-down menu (top-left) to switch between:
    - Archivarius (AI chat)
    - Chronos Editor (Weaver)
    - Minnet (Memory list)
    - Uppladdning (Upload files)
5. Status should show "🟢 Online"
6. Memory list should show your files
7. Click "VÄV HISTORIA" to weave selected files
8. Use upload panel to add new files to memory/logs

---

## ✅ TROUBLESHOOTING

- If "Offline": Ensure backend is running on port 8000 and .env is configured
- If port conflict: Script auto-kills old processes
- If no files: Place logs in memory/logs/json/, txt/, or gdoc/ or use upload panel
- If AI chat fails: Check API key in .env and restart server
- If upload fails: Ensure backend supports /upload endpoint

---

## 🔑 CONFIGURATION

- Edit `.env` in root folder:
    ```
    AESI_API_KEY=sk-xxxxxxx
    AESI_API_URL=https://api.openai.com/v1/chat/completions
    AESI_API_MODEL=gpt-4o-mini
    ```
- Restart server after changing .env

---

## 🧩 FEATURES

- AI chat (Archivarius) with context from memory
- Chronos Editor: Select files, filter by node, choose template, weave history
- Memory Bank: View all files, select for weaving
- Upload: Add files to memory/logs folders directly from portal
- Responsive UI, dark mode, status indicators

---

**Portal is live at http://localhost:8000 — All features enabled**
