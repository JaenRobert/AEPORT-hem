# 🚀 ÆSI NEXUS - Complete Deployment Guide

**Version:** 2.0.0  
**Date:** 2024-12-28  
**Status:** Production Ready

---

## 📋 Pre-Deployment Checklist

- [ ] Node.js installed (v18+)
- [ ] Git configured with user.name and user.email
- [ ] Netlify CLI installed: `npm install -g netlify-cli`
- [ ] Netlify account created and logged in: `netlify login`
- [ ] Environment variables prepared (.env file)

---

## 🔧 Local Development

### Start Backend
```powershell
npm start
```
Server runs on: http://localhost:3000

### Test Navigation
```powershell
# Inject menu into all HTML files
npm run inject-menu

# Open portal
start http://localhost:3000/portal.html
```

### Test All Systems
1. Login: http://localhost:3000/login.html
2. Portal: http://localhost:3000/portal.html
3. Upload: http://localhost:3000/uploads.html
4. Book: http://localhost:3000/book.html
5. Memory: http://localhost:3000/memory.html

---

## 🧹 Pre-Deployment Cleanup

### Option 1: Automatic (Recommended)
```powershell
npm run predeploy
```

This runs:
1. Git cleanup (removes desktop.ini, repairs refs)
2. Menu injection (adds navigation to all pages)
3. Data migration (moves local files to data/)

### Option 2: Manual Steps
```powershell
# 1. Clean Git
npm run git-cleanup

# 2. Inject menus
npm run inject-menu

# 3. Migrate data
npm run migrate
```

---

## 🌐 Netlify Deployment

### First-Time Setup
```powershell
# Initialize Netlify project
netlify init

# Follow prompts:
# - Create new site or link existing
# - Choose build command: npm run build
# - Choose publish directory: public
```

### Set Environment Variables
In Netlify UI (Site Settings > Environment Variables):
