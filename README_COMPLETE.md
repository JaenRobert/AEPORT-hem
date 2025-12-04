# 🚀 ÆSI NEXUS V5.0 - Complete Setup Guide

**Version:** 5.0.0  
**Status:** PRODUCTION READY ✅  
**Auto-Deploy:** Enabled  

---

## 🎯 ONE-TIME SETUP

### Step 1: Run Complete Setup

```powershell
powershell -ExecutionPolicy Bypass -File SETUP_COMPLETE.ps1
```

This will:
- ✅ Install all dependencies
- ✅ Create directory structure
- ✅ Configure environment
- ✅ Setup auto-start (optional)
- ✅ Verify configuration

### Step 2: Configure API Key

Edit `aesi_core.py` line 12:
```python
ÆSI_MASTER_API_KEY = "your_actual_gemini_key"
```

### Step 3: Get Netlify Build Hook

1. Go to Netlify Dashboard
2. Select your site
3. Build & Deploy > Build Hooks
4. Create hook named "ÆSI Auto Deploy"
5. Copy URL
6. Edit `.env` and paste URL

---

## 🚀 DAILY USAGE

### Start System

**Option 1: Auto-start (if enabled)**
- Just boot your computer
- System starts automatically
- Browser opens to IDE

**Option 2: Manual start**
```powershell
npm run console
```

**Option 3: Backend only**
```powershell
npm start
```

---

## 🌐 AUTO-DEPLOYMENT

### How It Works

1. **On System Start:**
   - Backend starts
   - Netlify build triggered automatically
   - Browser opens to IDE

2. **On Code Save:**
   - Changes saved locally
   - WebSocket syncs to all clients
   - Deploy triggered if enabled

3. **On Manual Deploy:**
   - Click 🚀 Deploy button
   - Instant deployment to Netlify
   - Live in 10-30 seconds

### Configuration

Edit `.env`:
```env
AUTO_DEPLOY_ON_START=true   # Deploy on server start
AUTO_DEPLOY_ON_SAVE=true    # Deploy on code save
AUTO_OPEN_BROWSER=true      # Open browser automatically
```

---

## 📁 WHAT YOU GET

### Frontend
- 🖥️ AI Console with Monaco editor
- 🧩 Visual drag & drop builder
- 💬 Real-time AI chat (7 nodes)
- 👁️ Live code preview
- 💾 Project save/load

### Backend
- ⚡ Express server (port 3000)
- 🐍 Python AI core (port 8000)
- 🔗 WebSocket collaboration
- 📦 Project management
- 🚀 Auto-deployment

### Features
- ✅ Multi-user collaboration
- ✅ Immutable ledger
- ✅ Auto-save
- ✅ Live sync
- ✅ One-click deploy

---

## 🔧 COMMANDS

| Command | Description |
|---------|-------------|
| `npm run console` | Start complete system |
| `npm start` | Backend only |
| `npm run deploy` | Manual deployment |
| `npm run setup` | Re-run setup |
| `python aesi_core.py` | Python core only |

---

## 🐛 TROUBLESHOOTING

### System Won't Start

```powershell
# Re-run setup
powershell -ExecutionPolicy Bypass -File SETUP_COMPLETE.ps1

# Check Node.js
node --version

# Check Python
python --version
```

### Auto-Deploy Not Working

1. Check `.env` has valid `NETLIFY_BUILD_HOOK`
2. Verify Netlify login: `netlify status`
3. Test webhook manually: `curl -X POST <your_webhook_url>`

### WebSocket Connection Failed

1. Both servers must be running (8000 & 3000)
2. Check firewall settings
3. Verify browser console for errors

---

## ✅ SUCCESS CHECKLIST

Your system is ready when:
- ✅ `npm run console` starts without errors
- ✅ Browser opens to ai_console.html
- ✅ Can chat with AI
- ✅ Monaco editor loads
- ✅ Live preview works
- ✅ Builder drag & drop functions
- ✅ WebSocket shows "connected"
- ✅ Projects save and load
- ✅ Deploy button triggers Netlify build

---

## 🎉 YOU'RE DONE!

Your ÆSI NEXUS is now:
- ✅ Fully autonomous
- ✅ Auto-deploying
- ✅ Collaborative
- ✅ Production ready

**Just run:**
```powershell
npm run console
```

**And start building!** 🚀

---

**Made with ❤️ by ÆSI System**  
**Version 5.0.0 - Autonomous Core**
