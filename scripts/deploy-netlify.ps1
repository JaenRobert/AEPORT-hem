# =====================================================
# 🚀 ÆSI Deploy Finalizer v2.0
# Bygger & publicerar projektet till Netlify
# Version: 2.0
# Date: 2024-12-28
# =====================================================

# Set UTF-8 encoding
chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

# Navigate to project root
Set-Location "$PSScriptRoot\.."

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "    🚀 ÆSI DEPLOY FINALIZER v2.0" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Netlify CLI
Write-Host "[1/6] 🔍 Checking Netlify CLI..." -ForegroundColor Yellow
if (-not (Get-Command "netlify" -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Netlify CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g netlify-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Netlify CLI!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Netlify CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Netlify CLI found" -ForegroundColor Green
}
Write-Host ""

# Step 2: Git Cleanup
Write-Host "[2/6] 🧹 Running Git Cleanup..." -ForegroundColor Yellow
try {
    # Remove desktop.ini files
    Get-ChildItem -Path . -Recurse -Filter "desktop.ini" -Force -ErrorAction SilentlyContinue | 
        Remove-Item -Force -ErrorAction SilentlyContinue
    
    # Clean Git
    git reflog expire --expire=now --all 2>$null
    git gc --prune=now --aggressive 2>$null
    git fsck --full 2>$null | Out-Null
    
    Write-Host "✅ Git cleanup complete" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some Git operations failed (non-critical)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Setup directories
Write-Host "[3/6] 📁 Setting up directories..." -ForegroundColor Yellow
try {
    if (Test-Path "scripts/setup-directories.js") {
        node scripts/setup-directories.js
        Write-Host "✅ Directories ready" -ForegroundColor Green
    } else {
        # Create directories manually
        $dirs = @("data", "data/memory", "data/book", "data/uploads", "data/ledger", "public", "public/js")
        foreach ($dir in $dirs) {
            if (-not (Test-Path $dir)) {
                New-Item -ItemType Directory -Path $dir -Force | Out-Null
            }
        }
        Write-Host "✅ Directories created" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Directory setup warning: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Install & Build
Write-Host "[4/6] 🏗️  Building project..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    # Install dependencies
    Write-Host "  Installing dependencies..." -ForegroundColor Gray
    npm install 2>&1 | Out-Null
    
    # Check if build script exists
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.scripts.build) {
        Write-Host "  Running build..." -ForegroundColor Gray
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Build complete" -ForegroundColor Green
    } else {
        Write-Host "🟡 No build script found, skipping" -ForegroundColor Yellow
    }
} else {
    Write-Host "🟡 No package.json found, skipping build" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Deploy to Netlify
Write-Host "[5/6] 🌐 Deploying to Netlify..." -ForegroundColor Yellow
try {
    # Check if logged in
    $loginCheck = netlify status 2>&1
    if ($loginCheck -match "Not logged in") {
        Write-Host "⚠️  Not logged in to Netlify. Running login..." -ForegroundColor Yellow
        netlify login
    }
    
    # Deploy
    Write-Host "  Uploading to Netlify..." -ForegroundColor Gray
    netlify deploy --prod --dir=public
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Deploy error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Try: netlify login" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 6: Show Status
Write-Host "[6/6] 📊 Checking deployment status..." -ForegroundColor Cyan
try {
    netlify status
} catch {
    Write-Host "⚠️  Could not fetch status" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "    ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌍 Your ÆSI Portal is now live!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Gray
Write-Host "  1. Open your Netlify dashboard" -ForegroundColor White
Write-Host "  2. Set environment variables (if not done)" -ForegroundColor White
Write-Host "  3. Visit your site URL" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Gray
Write-Host "  netlify open       - Open Netlify dashboard" -ForegroundColor White
Write-Host "  netlify open:site  - Open deployed site" -ForegroundColor White
Write-Host "  netlify logs       - View deployment logs" -ForegroundColor White
Write-Host ""

pause
