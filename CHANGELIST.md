# ÆSI PORTAL v5.3 — OMNI-SCANNER STATUS

---

## 🟢 SYSTEM ACTIVE & READY

- Backend: **Running on port 8000** (auto-failover to 8001/8002)
- Frontend: **Portal dashboard** with chat & memory viewer
- Memory: **Omni-Scanner** scanning json/txt/gdoc folders
- Weaver: **Active** — weaves all JSON logs into master files

---

## 🌐 ACCESS PORTAL

**Correct URL:** http://localhost:8000

**Do NOT use:** http://127.0.0.1:5500 (VS Code Live Server)

---

## 🚀 HOW TO ACCESS

1. Double-click `start_portal.bat`
2. Wait for console to show: "ÆSI PORTAL v5.3 (OMNI-SCANNER)"
3. Open **http://localhost:8000** in browser
4. Status should show "🟢 Online"
5. Memory list should show your files
6. Click "🧶 VÄV HISTORIA" to weave

---

## ✅ TROUBLESHOOTING

- If "Offline": Ensure backend is running on port 8000
- If port conflict: Script auto-kills old processes
- If no files: Place logs in memory/logs/json/ or txt/

---

**Portal is live at http://localhost:8000**
