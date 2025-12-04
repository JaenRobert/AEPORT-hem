# 🚀 ÆSI DEPLOYMENT GUIDE

## Snabbstart: Deploy to Netlify in 5 minutes

### 1. Förberedelser

```bash
# Installera Netlify CLI
npm install -g netlify-cli

# Logga in på Netlify
netlify login
```

### 2. Skapa `.env` fil

```bash
# Kopiera template
cp .env.example .env

# Redigera .env med dina credentials:
# - NETLIFY_AUTH_TOKEN (från Netlify Dashboard)
# - NETLIFY_SITE_ID (ditt site ID)
# - PROTON_EMAIL och PROTON_PASSWORD
# - GEMINI_API_KEY
```

### 3. One-Click Deploy

**Alternativ A: Med Netlify CLI**
```bash
./deploy-netlify.sh
```

**Alternativ B: Via Netlify Dashboard**
1. Gå till https://app.netlify.com
2. Connect Git repo eller drag-drop mapp
3. Deploy

**Alternativ C: Med GitHub Actions** (Recommended)
Skapa `.github/workflows/deploy.yml`:

```yaml
name: Deploy ÆSI to Netlify
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g netlify-cli
      - run: netlify deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### 4. Realtime Sync till Proton Drive

```bash
# Starta sync-servern (monitoring & auto-deploy)
python realtime_sync.py
```

Detta gör att:
- Alla ändringar sparas till Proton Drive (encrypted)
- Automatisk deploy till Netlify vid ändringar
- Version history i Proton

### 5. Layout Editing (Realtime)

1. Öppna http://localhost:8000
2. Klicka **✏️ Edit Layout**
3. Dra och släpp widgets
4. Klicka **💾 Save**
5. Klicka **☁️ Proton Sync** (sparar till Proton)
6. Klicka **🚀 Deploy** (pushar till Netlify)

---

## Proton Drive Integration

### Setup

```python
# realtime_sync.py automatically:
# 1. Watches för file changes
# 2. Uploads to Proton Drive (encrypted)
# 3. Triggers Netlify deploy
# 4. Maintains version history
```

**Filer som synkas:**
- `index.html` – Huvudsida
- `layout_config.json` – Layout configuration
- `arvskedjan_d.jsonl` – Append-only ledger
- `context_events.jsonl` – Event log
- `modules_catalog.json` – Module definitions

### Environment Variables

```bash
export PROTON_EMAIL="your@proton.com"
export PROTON_PASSWORD="your-password"
python realtime_sync.py
```

---

## Netlify Configuration

### netlify.toml

```toml
[build]
  command = "echo 'No build required'"
  publish = "."

[dev]
  port = 8000
  command = "python aesi_core.py"

[[redirects]]
  from = "/api/*"
  to = "http://localhost:8000/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Build Settings (i Netlify Dashboard)

- **Base directory:** `.`
- **Build command:** (leave empty)
- **Publish directory:** `.`
- **Functions directory:** (leave empty)

---

## Monitorering & Maintenance

### Se deploy status
```bash
netlify status
```

### Se logs
```bash
netlify logs
```

### Manuell rollback
```bash
netlify deploy --alias=rollback
```

### Local testing före deploy
```bash
python aesi_core.py
# Öppna http://localhost:8000
# Testa ändringar
# Klicka Deploy när ready
```

---

## Architecture

```
┌─────────────────────┐
│   Local Machine     │
│  (edit + preview)   │
└──────────┬──────────┘
           │
           ├─→ realtime_sync.py
           │   (watches files)
           │
           ├─→ Proton Drive 🔐
           │   (encrypted backup)
           │
           └─→ Netlify 🌐
               (production site)

Your changes → Auto-sync → Live deployment
```

---

## Troubleshooting

### Deploy fails: "NETLIFY_AUTH_TOKEN not set"
```bash
export NETLIFY_AUTH_TOKEN="your_token_here"
./deploy-netlify.sh
```

### Changes not appearing
```bash
# Force redeploy
netlify deploy --prod --trigger
```

### Proton sync not working
```bash
# Check auth
python realtime_sync.py
# (Will show auth errors if credentials wrong)
```

### Rollback to previous version
```bash
netlify deploy --prod --alias=previous
```

---

## Security Notes

⚠️ **Never commit `.env` to Git!**
- Add `.env` to `.gitignore`
- Use GitHub Secrets for CI/CD instead
- Proton Drive handles encryption

✅ **Best Practice:**
```bash
# Create .env locally ONLY
cp .env.example .env
# Edit with your secrets
# Add to .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .gitignore"
```

---

## Next Steps

1. ✅ Deploy to Netlify
2. ✅ Set up Proton Drive sync
3. ✅ Test realtime editing
4. ✅ Configure auto-deploy

**Your site is now live and synced!** 🜂
