# =====================================================
# 🚀 ÆSI NEXUS - Complete Online Deployment
# Takes your portal from local to live
# =====================================================

chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    🚀 ÆSI NEXUS - ONLINE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Verify local setup
Write-Host "[1/8] 🔍 Verifying local setup..." -ForegroundColor Yellow

if (-not (Test-Path "public")) {
    Write-Host "❌ public/ directory not found!" -ForegroundColor Red
    Write-Host "   Run: npm run setup" -ForegroundColor Yellow
    pause
    exit 1
}

if (-not (Test-Path "public/index.html")) {
    Write-Host "❌ public/index.html not found!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Local setup verified" -ForegroundColor Green
Write-Host ""

# STEP 2: Clean up redundant files
Write-Host "[2/8] 🧹 Cleaning redundant files..." -ForegroundColor Yellow

# Remove backup HTML files
Get-ChildItem -Path "public" -Filter "backup_index_*.html" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "  ✓ Removed backup HTML files" -ForegroundColor Gray

# Clean VS artifacts
Remove-Item -Path ".vs" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Removed .vs directory" -ForegroundColor Gray

# Clean node cache
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Cleaned node cache" -ForegroundColor Gray

Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# STEP 3: Install dependencies
Write-Host "[3/8] 📦 Installing dependencies..." -ForegroundColor Yellow
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  npm install had warnings, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# STEP 4: Inject navigation
Write-Host "[4/8] 🧭 Injecting navigation..." -ForegroundColor Yellow
if (Test-Path "scripts/inject_menu_simple.ps1") {
    powershell -ExecutionPolicy Bypass -File scripts/inject_menu_simple.ps1 | Out-Null
    Write-Host "✅ Navigation injected" -ForegroundColor Green
} else {
    Write-Host "⚠️  Menu injection script not found, skipping" -ForegroundColor Yellow
}
Write-Host ""

# STEP 5: Test local server
Write-Host "[5/8] 🧪 Testing local server..." -ForegroundColor Yellow
Write-Host "  Starting server for 5 seconds..." -ForegroundColor Gray

$job = Start-Job -ScriptBlock {
    Set-Location $args[0]
    npm start
} -ArgumentList $PWD

Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Local server works!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not verify local server, but continuing..." -ForegroundColor Yellow
}

Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue
Write-Host ""

# STEP 6: Check Netlify CLI
Write-Host "[6/8] 🌐 Checking Netlify CLI..." -ForegroundColor Yellow

if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
    Write-Host "  ⚠️  Netlify CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g netlify-cli
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Netlify CLI!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual installation:" -ForegroundColor Yellow
        Write-Host "  npm install -g netlify-cli" -ForegroundColor White
        pause
        exit 1
    }
}

Write-Host "✅ Netlify CLI ready" -ForegroundColor Green
Write-Host ""

# STEP 7: Netlify authentication
Write-Host "[7/8] 🔐 Netlify authentication..." -ForegroundColor Yellow

$statusOutput = netlify status 2>&1 | Out-String
if ($statusOutput -match "Not logged in") {
    Write-Host "  Opening browser for login..." -ForegroundColor Cyan
    netlify login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed!" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host "✅ Authenticated with Netlify" -ForegroundColor Green
Write-Host ""

# STEP 8: Deploy to Netlify
Write-Host "[8/8] 🚀 Deploying to Netlify..." -ForegroundColor Yellow
Write-Host ""

$isFirstTime = -not (Test-Path ".netlify")

if ($isFirstTime) {
    Write-Host "🎯 First-time deployment detected!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You will be asked to:" -ForegroundColor Yellow
    Write-Host "  1. Create new site or link existing" -ForegroundColor White
    Write-Host "  2. Choose team (your account)" -ForegroundColor White
    Write-Host "  3. Enter site name (e.g., aesi-nexus)" -ForegroundColor White
    Write-Host "  4. Build command: (leave empty)" -ForegroundColor White
    Write-Host "  5. Publish directory: public" -ForegroundColor White
    Write-Host ""
    
    netlify init
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Initialization failed!" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "Deploying to production..." -ForegroundColor Cyan
netlify deploy --prod --dir=public

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try manual deploy:" -ForegroundColor Yellow
    Write-Host "  netlify deploy --prod --dir=public" -ForegroundColor White
    pause
    exit 1
}

Write-Host ""

# Get site URL
$siteInfo = netlify status 2>&1 | Out-String
if ($siteInfo -match "Site URL:\s+(https?://[^\s]+)") {
    $siteUrl = $matches[1]
    
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "    ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌍 Your ÆSI NEXUS is now LIVE!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Site URL:" -ForegroundColor Yellow
    Write-Host "  $siteUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Available pages:" -ForegroundColor Yellow
    Write-Host "  • Home:      $siteUrl/index.html" -ForegroundColor White
    Write-Host "  • AI Console: $siteUrl/ai_console.html" -ForegroundColor White
    Write-Host "  • Portal:    $siteUrl/portal.html" -ForegroundColor White
    Write-Host "  • Upload:    $siteUrl/uploads.html" -ForegroundColor White
    Write-Host "  • Book:      $siteUrl/book.html" -ForegroundColor White
    Write-Host "  • Memory:    $siteUrl/memory.html" -ForegroundColor White
    Write-Host ""
    
    # Open in browser
    $openBrowser = Read-Host "Open site in browser? (y/n)"
    if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
        Start-Process $siteUrl
        Write-Host "✅ Browser opened!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🛠️  Useful commands:" -ForegroundColor Yellow
Write-Host "  netlify open:site   - Open your live site" -ForegroundColor White
Write-Host "  netlify open        - Open Netlify dashboard" -ForegroundColor White
Write-Host "  netlify logs        - View deployment logs" -ForegroundColor White
Write-Host ""

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
pause
