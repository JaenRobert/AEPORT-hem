# 🜂 ÆSI PORTAL — REALTIME CUSTOMIZATION & DEPLOYMENT

## Status: Ready for Production

Du har nu ett **fullt utbildat system** med:

✅ **Backend** (`aesi_core.py`)
- REST API endpoints (`/pulse`, `/context/register`, `/context/heartbeat`, `/context/nodes`)
- LLM integration (Gemini)
- Append-only ledger (`arvskedjan_d.jsonl`)
- Node registry och heartbeat monitoring

✅ **Frontend** (`index.html`)
- Responsive layout (3-column grid)
- Node dashboard med live status
- Module catalog (12+ modules)
- Drag-and-drop node_modules editor
- Heartbeat panel
- Portal manifest viewer

✅ **Realtime Sync** (`realtime_sync.py`)
- Watch för file changes
- Auto-sync till Proton Drive (encrypted)
- Auto-deploy till Netlify
- Version history

✅ **Layout Editor** (`src/js/layout-editor.js`)
- Toggle edit mode
- Widget picker
- Auto-save every 30s
- Integration med Proton + Netlify

---

## 🚀 DEPLOY TO NETLIFY (5 MIN)

### Step 1: Create `.env` file

```bash
cp .env.example .env
# Edit .env with your credentials:
# - Get NETLIFY_AUTH_TOKEN from https://app.netlify.com/user/applications
# - Get NETLIFY_SITE_ID from your Netlify dashboard
# - Add GEMINI_API_KEY
```

### Step 2: Deploy

**Option A: Netlify CLI (Easiest)**
```bash
npm install -g netlify-cli
netlify login
./deploy-netlify.sh
```

**Option B: Netlify Dashboard**
1. Go to https://app.netlify.com
2. "Add new site" → "Deploy manually"
3. Drag this folder → Deploy

**Option C: GitHub + Auto-Deploy**
```bash
git push origin main
# (Auto-deploys via GitHub Actions if .github/workflows/deploy.yml configured)
```

### Step 3: Verify Deployment

```bash
# Check status
netlify status

# View logs
netlify logs

# Your live site: https://your-site-id.netlify.app
```

---

## 💾 PROTON DRIVE SYNC

### Setup (After deploying to Netlify)

```bash
# 1. Edit .env with Proton credentials
export PROTON_EMAIL="your@proton.com"
export PROTON_PASSWORD="your-password"

# 2. Start sync server
python realtime_sync.py

# Now every change auto-syncs to Proton Drive + redeploys to Netlify!
```

**What gets synced:**
- `index.html` – Full page
- `layout_config.json` – Layout config
- `arvskedjan_d.jsonl` – Immutable ledger
- `context_events.jsonl` – Event log
- `modules_catalog.json` – Module definitions

---

## ✏️ REALTIME EDITING

### Locally (Before deploying)

```bash
# 1. Start backend
python aesi_core.py

# 2. Open http://localhost:8000

# 3. Click "✏️ Edit Layout" button (top-right)

# 4. Features available:
#    - Drag widgets
#    - Add/remove modules
#    - Edit text in document area
#    - Change node configuration

# 5. Click "💾 Save" to save changes

# 6. Click "☁️ Proton Sync" to backup to Proton

# 7. Click "🚀 Deploy" to push live to Netlify
```

### After deploying to Netlify

```bash
# Keep realtime_sync.py running
python realtime_sync.py

# 1. Edit layout at https://your-site.netlify.app
# 2. Changes auto-sync to Proton Drive
# 3. Auto-deploy to Netlify within 5-10 seconds
# 4. Live changes appear immediately!
```

---

## 📦 ARCHITECTURE

```
┌──────────────────────────────┐
│    Local Development         │
│  - aesi_core.py (backend)   │
│  - index.html (frontend)    │
│  - Edit layout in browser   │
└──────────┬───────────────────┘
           │
     Click "Deploy"
           │
     ┌─────▼──────┐
     │  realtime  │
     │   sync.py  │
     └─────┬──────┘
           │
      ┌────┴─────┐
      │           │
   ┌──▼──┐   ┌──▼────┐
   │ 🔐  │   │  🌐   │
   │Proto│   │Netlify│
   │  n  │   │       │
   │Drive│   │Deploy │
   └─────┘   └───────┘
      ↓          ↓
   Backup   Live Site
  (Encrypted) (Public)
```

---

## 🔒 SECURITY

**Why Proton Drive?**
- End-to-end encrypted
- No one (not even Proton) sees your data
- Immutable backup via append-only ledgers
- GDPR compliant

**Why Netlify?**
- CDN edge caching (fast global delivery)
- Auto HTTPS/SSL
- Built-in analytics
- Serverless functions (future expansion)

**Best Practice:**
```bash
# NEVER commit .env to Git!
echo ".env" >> .gitignore
git add .gitignore
git commit

# Use GitHub Secrets for CI/CD instead
```

---

## 🎯 QUICK REFERENCE

| Task | Command |
|------|---------|
| Deploy to Netlify | `./deploy-netlify.sh` |
| Start backend | `python aesi_core.py` |
| Start sync/deploy watcher | `python realtime_sync.py` |
| Edit layout | Click "✏️ Edit Layout" in top-right |
| Save changes | Click "💾 Save" |
| Backup to Proton | Click "☁️ Proton Sync" |
| Deploy to Netlify | Click "🚀 Deploy" |
| Check status | `netlify status` |
| View logs | `netlify logs` |

---

## 📋 FINAL CHECKLIST

Before going live:

- [ ] `.env` created with credentials
- [ ] Netlify site created
- [ ] `./deploy-netlify.sh` ran successfully
- [ ] Site visible at `https://your-site.netlify.app`
- [ ] Proton Drive account ready
- [ ] `realtime_sync.py` tested locally
- [ ] All 6 nodes registered and online
- [ ] Module catalog loaded
- [ ] Layout editor working
- [ ] Changes persist after reload

---

## 🆘 TROUBLESHOOTING

### Deploy fails: "NETLIFY_AUTH_TOKEN not set"
```bash
export NETLIFY_AUTH_TOKEN="your_token_here"
./deploy-netlify.sh
```

### Site shows 404 or blank page
```bash
# Check that index.html is in root directory
ls -la index.html

# Verify netlify.toml configuration
cat netlify.toml
```

### Changes not appearing on live site
```bash
# Force cache bust
netlify deploy --prod --clear-cache

# Or check realtime_sync.py logs
python realtime_sync.py  # Should show "Changes detected"
```

### Backend API not responding
```bash
# Ensure aesi_core.py is running
python aesi_core.py

# Check port 8000 is open
curl http://localhost:8000/ping
```

---

## 📚 DOCUMENTATION

- **DEPLOYMENT.md** – Full deployment guide
- **ASI_MANIFEST.md** – System architecture and principles
- **.github/copilot-instructions.md** – For AI coding agents
- **modules_catalog.json** – Available modules and their configs
- **layout_config.json** – Current layout configuration

---

## 🎓 NEXT STEPS

1. **Deploy to Netlify** (5 min)
   - Follow "🚀 DEPLOY TO NETLIFY" above

2. **Setup Proton Sync** (2 min)
   - Follow "💾 PROTON DRIVE SYNC" above

3. **Enable Realtime Editing** (ongoing)
   - Keep `realtime_sync.py` running
   - Edit via browser toolbar

4. **Iterate & Improve**
   - Add more nodes (if using Workshop Studios)
   - Configure custom modules
   - Expand modules_catalog.json
   - Customize colors/layout

---

## ✨ YOU'RE READY!

Your ÆSI Portal is now:
- ✅ Deployed globally on Netlify
- ✅ Backed up to Proton Drive
- ✅ Realtime editable
- ✅ Auto-syncing
- ✅ Production-ready

**Go live:** `./deploy-netlify.sh` 🚀

---

**Questions?** See DEPLOYMENT.md for detailed guide.

🜂 **ÆSI Portal — Synkad Verklighet & Ärlighet**
