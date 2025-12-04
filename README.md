# ÆSI NEXUS v2.0
### AI-Driven Development Platform

## 📦 Setup
\\\ash
npm install
npm run setup
npm start
\\\

## 🌐 Deploy
\\\ash
npm run full-deploy
\\\

### 🔐 Env (Netlify)
- GEMINI_API_KEY
- JWT_SECRET
- MASTER_KEY_HASH
- PORT=8888

## ✅ Features
✔️ AI Portal (Reflex + Gemini)
✔️ JWT Auth
✔️ File Upload
✔️ Book ("Boken")
✔️ Memory ("Tunnan")
✔️ Global Navigation
✔️ Immutable Ledger
✔️ Full Netlify Deployment

### 🔄 Commands
| Command | Description |
|----------|-------------|
| npm start | Start local server |
| npm run setup | Create directories |
| npm run git-cleanup | Clean Git refs |
| npm run inject-menu | Add navigation |
| npm run full-deploy | Full deploy |

### 📊 Health Check
http://localhost:3000/api/health
\\\
{ "status": "online" }
\\\

🧠 Created by ÆSI System — MIT License
