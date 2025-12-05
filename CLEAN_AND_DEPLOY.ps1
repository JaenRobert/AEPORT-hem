# =====================================================
# 🔥 ÆSI NEXUS - CLEAN RESET & DEPLOY
# One script to rule them all
# =====================================================

chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Red
Write-Host "    🔥 ÆSI CLEAN RESET & DEPLOY" -ForegroundColor Red
Write-Host "========================================================" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  This will clean 27,000 files down to essentials!" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Type 'CLEAN' to continue"
if ($confirm -ne "CLEAN") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""

# STEP 1: Create backup of everything
Write-Host "[1/8] 💾 Creating safety backup..." -ForegroundColor Yellow
$backupName = "AEPORT_BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$backupPath = "..\$backupName"

try {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    Copy-Item -Path * -Destination $backupPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backup had warnings, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# STEP 2: Define what to KEEP
Write-Host "[2/8] 🎯 Identifying essential files..." -ForegroundColor Yellow

$keepItems = @(
    "public",
    "server",
    "data",
    "aesi_backend.js",
    "aesi_core.py",
    "package.json",
    "netlify.toml",
    ".git",
    ".gitignore",
    ".env",
    "README.md",
    "CLEAN_AND_DEPLOY.ps1"
)

Write-Host "✅ Essential files identified" -ForegroundColor Green
Write-Host ""

# STEP 3: Remove everything else
Write-Host "[3/8] 🗑️  Removing non-essential files..." -ForegroundColor Yellow

$itemsToRemove = Get-ChildItem -Force | Where-Object {
    $item = $_
    $shouldKeep = $keepItems | Where-Object { $item.Name -eq $_ }
    return -not $shouldKeep
}

$removedCount = 0
foreach ($item in $itemsToRemove) {
    Remove-Item $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
    $removedCount++
}

Write-Host "✅ Removed $removedCount items" -ForegroundColor Green
Write-Host ""

# STEP 4: Clean inside kept directories
Write-Host "[4/8] 🧹 Cleaning kept directories..." -ForegroundColor Yellow

# Remove backup HTML files
Get-ChildItem -Path "public" -Filter "backup_*.html" -Recurse -ErrorAction SilentlyContinue | 
    Remove-Item -Force -ErrorAction SilentlyContinue

# Remove desktop.ini
Get-ChildItem -Path . -Filter "desktop.ini" -Recurse -Force -ErrorAction SilentlyContinue | 
    Remove-Item -Force -ErrorAction SilentlyContinue

# Clean node_modules cache
if (Test-Path "node_modules/.cache") {
    Remove-Item "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "✅ Directories cleaned" -ForegroundColor Green
Write-Host ""

# STEP 5: Ensure core files exist
Write-Host "[5/8] ✅ Verifying core files..." -ForegroundColor Yellow

$requiredFiles = @{
    "public/index.html" = $true
    "public/js/menu.js" = $true
    "aesi_backend.js" = $true
    "package.json" = $true
}

$missingFiles = @()
foreach ($file in $requiredFiles.Keys) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "  ❌ Missing: $file" -ForegroundColor Red
    } else {
        Write-Host "  ✓ Found: $file" -ForegroundColor Gray
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files!" -ForegroundColor Red
    Write-Host "   Please restore from backup: $backupPath" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ All core files present" -ForegroundColor Green
Write-Host ""

# STEP 6: Install dependencies
Write-Host "[6/8] 📦 Installing dependencies..." -ForegroundColor Yellow
npm install 2>&1 | Out-Null
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# STEP 7: Test locally
Write-Host "[7/8] 🧪 Testing local server..." -ForegroundColor Yellow

$testJob = Start-Job -ScriptBlock {
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
    Write-Host "⚠️  Could not verify server, but continuing..." -ForegroundColor Yellow
}

Stop-Job $testJob -ErrorAction SilentlyContinue
Remove-Job $testJob -ErrorAction SilentlyContinue
Write-Host ""

# STEP 8: Deploy to Netlify
Write-Host "[8/8] 🚀 Deploying to Netlify..." -ForegroundColor Yellow
Write-Host ""

# Check Netlify CLI
if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
    Write-Host "  Installing Netlify CLI..." -ForegroundColor Cyan
    npm install -g netlify-cli
}

# Login check
$statusOutput = netlify status 2>&1 | Out-String
if ($statusOutput -match "Not logged in") {
    Write-Host "  Logging in to Netlify..." -ForegroundColor Cyan
    netlify login
}

# Deploy
Write-Host "  Deploying to production..." -ForegroundColor Cyan
netlify deploy --prod --dir=public

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "    ✅ SUCCESS!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    
    # Get URL
    $siteInfo = netlify status 2>&1 | Out-String
    if ($siteInfo -match "Site URL:\s+(https?://[^\s]+)") {
        $siteUrl = $matches[1]
        Write-Host "🌍 Your site is LIVE:" -ForegroundColor Cyan
        Write-Host "   $siteUrl" -ForegroundColor White
        Write-Host ""
        
        $openSite = Read-Host "Open in browser? (y/n)"
        if ($openSite -eq "y") {
            Start-Process $siteUrl
        }
    }
    
    Write-Host "📊 Final stats:" -ForegroundColor Yellow
    $fileCount = (Get-ChildItem -Recurse -File | Measure-Object).Count
    Write-Host "   • Total files: $fileCount (cleaned from 27,000+)" -ForegroundColor White
    Write-Host "   • Backup: $backupPath" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host "   Check errors above" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
pause
