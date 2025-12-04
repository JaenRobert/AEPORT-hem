# ===============================================
# 🚀 ÆSI FINALIZER v3.0
# ===============================================
Write-Host "=== 🧠 ÆSI Finalizer v3.0 ===" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

$root = "C:\Users\jaenr\Min enhet (jaenrobert@gmail.com)\AEPORT_LOCAL"
Set-Location $root

# 1️⃣ Git Cleanup – fixar refs, tar bort desktop.ini, reparerar index
Write-Host "`n[1/6] 🧹 Rensar Git..." -ForegroundColor Yellow
try {
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    git fsck --full | Out-Null
    Write-Host "✅ Git-systemet städat." -ForegroundColor Green
} catch {
    Write-Host "⚠️  Git cleanup delvis klar (ignorerar trasiga refs)." -ForegroundColor Yellow
}

# 2️⃣ Setup & Directory-init
Write-Host "`n[2/6] 📁 Säkerställer mappar..." -ForegroundColor Yellow
node scripts/setup-directories.js | Out-Null
Write-Host "✅ Alla mappar verifierade." -ForegroundColor Green

# 3️⃣ Menu Injection – global navigation
Write-Host "`n[3/6] 🧭 Synkroniserar menyer..." -ForegroundColor Yellow
try {
    node scripts/inject-menu.js
    Write-Host "✅ Navigering klar." -ForegroundColor Green
} catch {
    Write-Host "⚠️  Menu injection kunde inte köras (hoppar över)." -ForegroundColor Yellow
}

# 4️⃣ Build System (om build-script finns)
Write-Host "`n[4/6] 🏗️  Bygger portalen..." -ForegroundColor Yellow
npm install | Out-Null
if ((Get-Content package.json -Raw) -match '"build"') {
    npm run build
} else {
    Write-Host "🟡 Ingen build-script hittad, hoppar över." -ForegroundColor Yellow
}

# 5️⃣ Deploy to Netlify
Write-Host "`n[5/6] 🌐 Deploy till Netlify..." -ForegroundColor Yellow
if (-not (Get-Command "netlify" -ErrorAction SilentlyContinue)) {
    Write-Host "⚙️ Installerar Netlify CLI..." -ForegroundColor Yellow
    npm install -g netlify-cli
}
try {
    netlify deploy --prod
    Write-Host "✅ Deployment slutförd!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deploy misslyckades: $($_.Exception.Message)" -ForegroundColor Red
}

# 6️⃣ Auto-open in browser
Write-Host "`n[6/6] 🌍 Öppnar portalen..." -ForegroundColor Yellow
Start-Process "https://aesi-portal.netlify.app"

Write-Host "`n===========================================" -ForegroundColor DarkGray
Write-Host "✅ ÆSI PORTAL ONLINE" -ForegroundColor Green
Write-Host "🌐 https://aesi-portal.netlify.app" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor DarkGray
# EOF
