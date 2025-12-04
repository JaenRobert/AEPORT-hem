# =====================================================
# 🔧 ÆSI NEXUS V5.0 - Complete Setup Script
# One-time configuration for autonomous operation
# =====================================================

chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    🔧 ÆSI NEXUS V5.0 - COMPLETE SETUP" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "[1/6] 📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

# Step 2: Create directories
Write-Host "[2/6] 📁 Creating directories..." -ForegroundColor Yellow
$dirs = @(
    "data", "data/memory", "data/book", "data/uploads", "data/ledger", "data/projects",
    "public", "public/js", "public/css",
    "server", "server/routes"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}
Write-Host "✅ Directories created" -ForegroundColor Green
Write-Host ""

# Step 3: Configure .env
Write-Host "[3/6] 🔐 Configuring environment..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating..." -ForegroundColor Yellow
    
    $netlifyHook = Read-Host "Enter your Netlify Build Hook URL (or press Enter to skip)"
    
    $envContent = @"
NETLIFY_BUILD_HOOK=$netlifyHook
PORT=3000
NODE_ENV=production
AUTO_DEPLOY_ON_START=true
AUTO_DEPLOY_ON_SAVE=true
AUTO_OPEN_BROWSER=true
WS_PORT=3000
"@
    
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}
Write-Host ""

# Step 4: Configure Python core
Write-Host "[4/6] 🐍 Checking Python configuration..." -ForegroundColor Yellow

if (Test-Path "aesi_core.py") {
    $pythonContent = Get-Content "aesi_core.py" -Raw
    
    if ($pythonContent -match 'ÆSI_MASTER_API_KEY = "DIN_GEMINI_API_NYCKEL_HÄR"') {
        Write-Host "⚠️  Gemini API key not configured in aesi_core.py" -ForegroundColor Yellow
        Write-Host "   Please edit line 12 in aesi_core.py and add your Gemini API key" -ForegroundColor Cyan
    } else {
        Write-Host "✅ Gemini API key configured" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  aesi_core.py not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Setup auto-start
Write-Host "[5/6] 🚀 Setting up auto-start..." -ForegroundColor Yellow

$startupFolder = [Environment]::GetFolderPath("Startup")
$startupScript = Join-Path $startupFolder "ÆSI_Start.bat"

$answer = Read-Host "Enable auto-start on Windows boot? (y/n)"

if ($answer -eq "y" -or $answer -eq "Y") {
    $batchContent = @"
@echo off
cd /d "$PSScriptRoot"
powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "DEPLOY_NOW.ps1"
"@
    
    Set-Content -Path $startupScript -Value $batchContent
    Write-Host "✅ Auto-start enabled" -ForegroundColor Green
    Write-Host "   Script: $startupScript" -ForegroundColor Gray
} else {
    Write-Host "⏭️  Auto-start skipped" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Test configuration
Write-Host "[6/6] 🧪 Testing configuration..." -ForegroundColor Yellow

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "✅ Node.js: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
}

# Check Python
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "✅ Python: $(python --version)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Python not found (optional)" -ForegroundColor Yellow
}

# Check Netlify CLI
if (Get-Command netlify -ErrorAction SilentlyContinue) {
    Write-Host "✅ Netlify CLI: Installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Netlify CLI not found" -ForegroundColor Yellow
    Write-Host "   Install: npm install -g netlify-cli" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "    ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit aesi_core.py and add your Gemini API key (line 12)" -ForegroundColor White
Write-Host "  2. Run: npm run console" -ForegroundColor White
Write-Host "  3. Start building!" -ForegroundColor White
Write-Host ""
Write-Host "Quick start commands:" -ForegroundColor Cyan
Write-Host "  • npm run console    - Start system + open IDE" -ForegroundColor White
Write-Host "  • npm run deploy     - Deploy to Netlify" -ForegroundColor White
Write-Host "  • npm start          - Backend only" -ForegroundColor White
Write-Host ""

pause
