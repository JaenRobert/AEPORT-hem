# ⚡ ÆSI NEXUS - Quick Start Guide

## 🎯 Goal
Get ÆSI Backend running in **under 30 seconds** with automatic browser opening.

---

## 🚀 Method 1: PowerShell (Recommended)

### First-Time Setup (Once Only)

1. Open PowerShell as **yourself** (not admin needed)
2. Navigate to project:
   ```powershell
   cd "C:\Users\jaenr\Min enhet (jaenrobert@gmail.com)\AEPORT_LOCAL"
   ```
3. Run setup:
   ```powershell
   .\setup-powershell.ps1
   ```
4. **Close PowerShell window**
5. **Open NEW PowerShell window**

### Everyday Use

Just type:
```powershell
run-aesi
```

That's it! ✨

**What happens:**
- ✅ Backend starts on port 3000
- ✅ Browser opens automatically to http://localhost:3000/index.html
- ✅ All API endpoints ready (build, vision, exec)

---

## 🎮 PowerShell Commands

| Command | What it does |
|---------|--------------|
| `run-aesi` | Start backend + open browser |
| `run-aesi -NoBrowser` | Start backend without opening browser |
| `aesi-stop` | Stop backend server |
| `aesi-status` | Check if backend is running |
| `aesi-restart` | Restart backend server |

---

## 🖱️ Method 2: Double-Click (Windows)

1. Find file: `quick-start.bat`
2. **Double-click it**
3. Done! Browser opens automatically

---

## 🔧 Method 3: Manual (Any OS)

```bash
node aesi_backend.js
```

Then open browser to: http://localhost:3000/index.html

---

## ✅ Verify It's Working

You should see in terminal:
