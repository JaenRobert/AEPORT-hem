# =====================================================
# 🚀 ÆSI ULTIMATE DEPLOY v3.0
# Complete deployment with full visibility and auto-open
# =====================================================

# UTF-8 encoding
chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot

# Error handling
$ErrorActionPreference = "Continue"
$global:deploySuccess = $false
$global:siteUrl = ""

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    🚀 ÆSI NEXUS - ULTIMATE DEPLOY v3.0" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting deployment at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Function to log with timestamp
function Write-Log {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format 'HH:mm:ss'
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Function to check command exists
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Step 0: Pre-flight checks
Write-Host "[0/10] 🔍 Pre-flight checks..." -ForegroundColor Yellow
Write-Log "Checking Node.js..." -Color Gray

if (-not (Test-Command "node")) {
    Write-Log "❌ Node.js not found! Please install from https://nodejs.org" -Color Red
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeVersion = node --version
Write-Log "✅ Node.js $nodeVersion installed" -Color Green

Write-Log "Checking npm..." -Color Gray
$npmVersion = npm --version
Write-Log "✅ npm $npmVersion installed" -Color Green

Write-Log "Checking Netlify CLI..." -Color Gray
if (-not (Test-Command "netlify")) {
    Write-Log "⚠️  Netlify CLI not found. Installing..." -Color Yellow
    npm install -g netlify-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Failed to install Netlify CLI" -Color Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Log "✅ Netlify CLI ready" -Color Green
Write-Host ""

# Check if first time
$isFirstTime = -not (Test-Path ".netlify")
if ($isFirstTime) {
    Write-Host "🎯 FIRST-TIME DEPLOYMENT DETECTED" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You will need to:" -ForegroundColor Cyan
    Write-Host "  1. Choose 'Create & configure a new site'" -ForegroundColor White
    Write-Host "  2. Select your team" -ForegroundColor White
    Write-Host "  3. Enter site name (e.g., aesi-nexus)" -ForegroundColor White
    Write-Host "  4. Build command: npm run build" -ForegroundColor White
    Write-Host "  5. Publish directory: public" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to continue"
    Write-Host ""
}

# Step 1: Install dependencies
Write-Host "[1/10] 📦 Installing dependencies..." -ForegroundColor Yellow
Write-Log "Running npm install..." -Color Gray
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Log "✅ Dependencies installed" -Color Green
} else {
    Write-Log "❌ npm install failed" -Color Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Step 2: Setup directories
Write-Host "[2/10] 📁 Setting up directory structure..." -ForegroundColor Yellow
$dirs = @(
    "data",
    "data/memory",
    "data/book",
    "data/uploads",
    "data/ledger",
    "public",
    "public/js",
    "public/css",
    "server",
    "server/routes",
    "server/middleware"
)

$created = 0
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Log "  Created: $dir" -Color Gray
        $created++
    }
}

# Create .gitkeep files
$gitkeeps = @(
    "data/.gitkeep",
    "data/memory/.gitkeep",
    "data/book/.gitkeep",
    "data/uploads/.gitkeep",
    "data/ledger/.gitkeep"
)

foreach ($gitkeep in $gitkeeps) {
    if (-not (Test-Path $gitkeep)) {
        New-Item -ItemType File -Path $gitkeep -Force | Out-Null
    }
}

# Create empty ledger
$ledgerFile = "data/ledger/arvskedjan_d.jsonl"
if (-not (Test-Path $ledgerFile)) {
    New-Item -ItemType File -Path $ledgerFile -Force | Out-Null
    Write-Log "  Created: $ledgerFile" -Color Gray
}

Write-Log "✅ Directory structure ready ($created new directories)" -Color Green
Write-Host ""

# Step 3: Git cleanup
Write-Host "[3/10] 🧹 Cleaning Git repository..." -ForegroundColor Yellow
Write-Log "Removing desktop.ini files..." -Color Gray
$desktopFiles = Get-ChildItem -Path . -Recurse -Filter "desktop.ini" -Force -ErrorAction SilentlyContinue
$desktopFiles | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Log "  Removed $($desktopFiles.Count) desktop.ini files" -Color Gray

Write-Log "Running Git garbage collection..." -Color Gray
git gc --prune=now 2>$null
git reflog expire --expire=now --all 2>$null
Write-Log "✅ Git repository cleaned" -Color Green
Write-Host ""

# Step 4: Inject navigation menus
Write-Host "[4/10] 🧭 Injecting navigation menus..." -ForegroundColor Yellow
if (Test-Path "scripts/inject-menu.js") {
    Write-Log "Running menu injection..." -Color Gray
    node scripts/inject-menu.js 2>&1 | Out-Null
    Write-Log "✅ Navigation menus injected" -Color Green
} else {
    Write-Log "⚠️  Menu injection script not found, skipping" -Color Yellow
}
Write-Host ""

# Step 5: Migrate data
Write-Host "[5/10] 📦 Migrating data..." -ForegroundColor Yellow
if (Test-Path "scripts/migrate-local.js") {
    Write-Log "Running data migration..." -Color Gray
    node scripts/migrate-local.js 2>&1 | Out-Null
    Write-Log "✅ Data migrated" -Color Green
} else {
    Write-Log "⚠️  Migration script not found, skipping" -Color Yellow
}
Write-Host ""

# Step 6: Build project
Write-Host "[6/10] 🔨 Building project..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.scripts.build) {
    Write-Log "Running build command..." -Color Gray
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Build completed successfully" -Color Green
    } else {
        Write-Log "❌ Build failed!" -Color Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Log "ℹ️  No build script found, skipping" -Color Cyan
}
Write-Host ""

# Step 7: Verify build output
Write-Host "[7/10] 🔍 Verifying build output..." -ForegroundColor Yellow
$requiredFiles = @("public/index.html", "public/js/menu.js")
$allFound = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Log "  ✓ Found: $file" -Color Gray
    } else {
        Write-Log "  ✗ Missing: $file" -Color Red
        $allFound = $false
    }
}

if ($allFound) {
    Write-Log "✅ All required files present" -Color Green
} else {
    Write-Log "⚠️  Some files missing, but continuing..." -Color Yellow
}
Write-Host ""

# Step 8: Netlify authentication
Write-Host "[8/10] 🔐 Checking Netlify authentication..." -ForegroundColor Yellow
Write-Log "Verifying login status..." -Color Gray
$statusOutput = netlify status 2>&1
if ($statusOutput -match "Not logged in" -or $statusOutput -match "No site configured") {
    Write-Log "⚠️  Not authenticated. Opening login..." -Color Yellow
    netlify login
    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Authentication failed" -Color Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Log "✅ Authenticated with Netlify" -Color Green
Write-Host ""

# Step 9: Deploy to Netlify
Write-Host "[9/10] 🚀 Deploying to Netlify..." -ForegroundColor Yellow
Write-Host ""

if ($isFirstTime) {
    Write-Log "🎯 Initializing new site..." -Color Cyan
    Write-Log "Follow the interactive prompts..." -Color Yellow
    Write-Host ""
    
    netlify init
    $initSuccess = ($LASTEXITCODE -eq 0)
    
    if ($initSuccess) {
        Write-Host ""
        Write-Log "✅ Site initialized" -Color Green
        Write-Log "Now deploying..." -Color Cyan
        Write-Host ""
        
        netlify deploy --prod --dir=public
        $global:deploySuccess = ($LASTEXITCODE -eq 0)
    } else {
        Write-Log "❌ Initialization failed" -Color Red
        $global:deploySuccess = $false
    }
} else {
    Write-Log "Deploying to production..." -Color Cyan
    netlify deploy --prod --dir=public
    $global:deploySuccess = ($LASTEXITCODE -eq 0)
}

Write-Host ""

if ($global:deploySuccess) {
    Write-Log "✅ Deployment successful!" -Color Green
} else {
    Write-Log "❌ Deployment failed!" -Color Red
    Write-Log "Check the logs above for details" -Color Yellow
}
Write-Host ""

# Step 10: Get site URL and status
Write-Host "[10/10] 📊 Fetching deployment info..." -ForegroundColor Yellow
$statusInfo = netlify status 2>&1 | Out-String

if ($statusInfo -match "Site URL:\s+(https?://[^\s]+)") {
    $global:siteUrl = $matches[1]
    Write-Log "Site URL: $global:siteUrl" -Color Cyan
}

if ($statusInfo -match "Admin URL:\s+(https?://[^\s]+)") {
    $adminUrl = $matches[1]
    Write-Log "Admin URL: $adminUrl" -Color Cyan
}

Write-Host ""
Write-Host "Full Status:" -ForegroundColor Gray
Write-Host $statusInfo -ForegroundColor White
Write-Host ""

# Final summary
Write-Host "========================================================" -ForegroundColor Green
Write-Host "    ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

if ($global:deploySuccess) {
    Write-Host "🎉 Your ÆSI NEXUS is now LIVE!" -ForegroundColor Cyan
    Write-Host ""
    
    if ($global:siteUrl) {
        Write-Host "🌍 Site URL:" -ForegroundColor Yellow
        Write-Host "   $global:siteUrl" -ForegroundColor White
        Write-Host ""
        
        Write-Host "📱 Available pages:" -ForegroundColor Yellow
        Write-Host "   • Home:    $global:siteUrl/index.html" -ForegroundColor White
        Write-Host "   • Login:   $global:siteUrl/login.html" -ForegroundColor White
        Write-Host "   • Portal:  $global:siteUrl/portal.html" -ForegroundColor White
        Write-Host "   • Upload:  $global:siteUrl/uploads.html" -ForegroundColor White
        Write-Host "   • Book:    $global:siteUrl/book.html" -ForegroundColor White
        Write-Host "   • Memory:  $global:siteUrl/memory.html" -ForegroundColor White
        Write-Host ""
    }
    
    if ($isFirstTime) {
        Write-Host "⚠️  IMPORTANT - First-time setup:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Set environment variables in Netlify UI:" -ForegroundColor Cyan
        Write-Host "  1. Go to: Site settings > Environment variables" -ForegroundColor White
        Write-Host "  2. Add these variables:" -ForegroundColor White
        Write-Host "     • GEMINI_API_KEY     = your_gemini_api_key" -ForegroundColor Gray
        Write-Host "     • JWT_SECRET         = $(New-Guid)" -ForegroundColor Gray
        Write-Host "     • MASTER_KEY_HASH    = sha256_of_your_key" -ForegroundColor Gray
        Write-Host "     • PORT               = 8888" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "🛠️  Useful commands:" -ForegroundColor Yellow
    Write-Host "   netlify open:site   - Open your live site" -ForegroundColor White
    Write-Host "   netlify open        - Open Netlify dashboard" -ForegroundColor White
    Write-Host "   netlify logs        - View deployment logs" -ForegroundColor White
    Write-Host ""
    
    # Auto-open browser
    if ($global:siteUrl) {
        Write-Host "🌐 Opening site in browser..." -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        Start-Process $global:siteUrl
        Write-Host "✅ Browser launched!" -ForegroundColor Green
        Write-Host ""
    }
    
} else {
    Write-Host "❌ Deployment encountered errors" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "  1. Check your internet connection" -ForegroundColor White
    Write-Host "  2. Verify Netlify authentication: netlify status" -ForegroundColor White
    Write-Host "  3. Try manual deploy: netlify deploy --prod --dir=public" -ForegroundColor White
    Write-Host "  4. Check build logs above for specific errors" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Deployment finished at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Keep window open
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
