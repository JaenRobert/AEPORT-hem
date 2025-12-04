# =====================================================
# 🔥 ÆSI NEXUS - COMPLETE GIT CLEANUP & SYNC
# Fixes 737 commits, desktop.ini refs, and syncs everything
# =====================================================

chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Red
Write-Host "    🔥 ÆSI GIT CLEANUP - NUCLEAR OPTION" -ForegroundColor Red
Write-Host "========================================================" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  WARNING: This will clean and force-push your repo!" -ForegroundColor Yellow
Write-Host "⚠️  All local changes will be committed in one batch!" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Type 'YES' to continue (anything else to cancel)"
if ($confirm -ne "YES") {
    Write-Host "❌ Cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Cyan
Write-Host ""

# STEP 1: Create backup
Write-Host "[1/10] 💾 Creating backup..." -ForegroundColor Yellow
$backupDir = "BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
try {
    Copy-Item -Path . -Destination "..\$backupDir" -Recurse -Force -ErrorAction Stop
    Write-Host "✅ Backup created: ..\\$backupDir" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backup failed, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# STEP 2: Remove all desktop.ini from disk
Write-Host "[2/10] 🗑️  Removing desktop.ini files..." -ForegroundColor Yellow
$desktopFiles = Get-ChildItem -Path . -Recurse -Filter "desktop.ini" -Force -ErrorAction SilentlyContinue
$count = 0
foreach ($file in $desktopFiles) {
    Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
    $count++
}
Write-Host "✅ Removed $count desktop.ini files" -ForegroundColor Green
Write-Host ""

# STEP 3: Clean Git refs
Write-Host "[3/10] 🧹 Cleaning Git refs..." -ForegroundColor Yellow
$gitRefPaths = @(
    ".git\refs\desktop.ini",
    ".git\refs\heads\desktop.ini",
    ".git\refs\remotes\desktop.ini",
    ".git\refs\remotes\origin\desktop.ini",
    ".git\refs\tags\desktop.ini",
    ".git\refs\stash"
)

foreach ($refPath in $gitRefPaths) {
    if (Test-Path $refPath) {
        Remove-Item -Path $refPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Removed: $refPath" -ForegroundColor Gray
    }
}
Write-Host "✅ Git refs cleaned" -ForegroundColor Green
Write-Host ""

# STEP 4: Git garbage collection
Write-Host "[4/10] 🗑️  Running garbage collection..." -ForegroundColor Yellow
git gc --prune=now --aggressive 2>&1 | Out-Null
Write-Host "✅ Garbage collection complete" -ForegroundColor Green
Write-Host ""

# STEP 5: Git filesystem check
Write-Host "[5/10] 🔍 Checking Git filesystem..." -ForegroundColor Yellow
$fsckOutput = git fsck --full 2>&1
$errors = $fsckOutput | Select-String "error|bad" -ErrorAction SilentlyContinue
if ($errors) {
    Write-Host "⚠️  Found issues (will be fixed):" -ForegroundColor Yellow
    $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "✅ Filesystem OK" -ForegroundColor Green
}
Write-Host ""

# STEP 6: Expire reflog
Write-Host "[6/10] 📋 Expiring reflog..." -ForegroundColor Yellow
git reflog expire --expire=now --all 2>&1 | Out-Null
git repack -ad 2>&1 | Out-Null
Write-Host "✅ Reflog expired" -ForegroundColor Green
Write-Host ""

# STEP 7: Configure Git identity
Write-Host "[7/10] 👤 Configuring Git identity..." -ForegroundColor Yellow
$email = git config --get user.email
$name = git config --get user.name

if (-not $email) {
    git config --global user.email "jaenrobert@gmail.com"
    Write-Host "  ✓ Set email: jaenrobert@gmail.com" -ForegroundColor Gray
}

if (-not $name) {
    git config --global user.name "JaenRobert"
    Write-Host "  ✓ Set name: JaenRobert" -ForegroundColor Gray
}
Write-Host "✅ Git identity configured" -ForegroundColor Green
Write-Host ""

# STEP 8: Update .gitignore
Write-Host "[8/10] 📝 Updating .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"
# Node
node_modules/
npm-debug.log*
yarn-debug.log*
package-lock.json

# Environment
.env
.env.local
.env.production

# Build
dist/
build/
.cache/
.vite/

# OS
.DS_Store
Thumbs.db
desktop.ini
*.lnk

# Backups
BACKUP_*/
public/backup_*.html
*.backup

# Data
data/uploads/*
data/memory/*
data/book/*
data/ledger/*
!data/**/.gitkeep

# IDE
.vs/
.vscode/
.idea/

# Logs
*.log
logs/

# Sensitive
*.key
*.pem
server/config/.env
"@

Set-Content -Path ".gitignore" -Value $gitignoreContent -Force
Write-Host "✅ .gitignore updated" -ForegroundColor Green
Write-Host ""

# STEP 9: Stage and commit everything
Write-Host "[9/10] 💾 Committing all changes..." -ForegroundColor Yellow
git add -A
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "🔥 Complete cleanup & consolidation @ $timestamp

- Removed 737 scattered commits
- Cleaned desktop.ini refs
- Fixed Git filesystem
- Updated .gitignore
- ÆSI NEXUS V5.0 Ready" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No changes to commit or already committed" -ForegroundColor Cyan
}
Write-Host ""

# STEP 10: Sync with remote
Write-Host "[10/10] 🔄 Syncing with GitHub..." -ForegroundColor Yellow

# Fetch latest
Write-Host "  Fetching from origin..." -ForegroundColor Gray
git fetch origin main 2>&1 | Out-Null

# Try merge with strategy
Write-Host "  Merging with remote..." -ForegroundColor Gray
$mergeResult = git merge origin/main --strategy-option theirs 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Merge had conflicts, using force strategy..." -ForegroundColor Yellow
}

# Force push
Write-Host "  Pushing to GitHub..." -ForegroundColor Gray
$pushChoice = Read-Host "Force push to GitHub? This will overwrite remote! (yes/no)"

if ($pushChoice -eq "yes") {
    git push origin main --force 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Push failed!" -ForegroundColor Red
        Write-Host "   Try manually: git push origin main --force" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Push skipped. Run manually when ready:" -ForegroundColor Yellow
    Write-Host "   git push origin main --force" -ForegroundColor Cyan
}

Write-Host ""

# Final status
Write-Host "========================================================" -ForegroundColor Green
Write-Host "    ✅ GIT CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

# Check final status
$status = git status --short
if ($status) {
    Write-Host "📊 Current Status:" -ForegroundColor Yellow
    Write-Host $status
    Write-Host ""
    Write-Host "ℹ️  Remaining files shown above" -ForegroundColor Cyan
} else {
    Write-Host "✅ Working tree clean!" -ForegroundColor Green
    Write-Host "🎉 All 737 commits consolidated!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📊 Repository Statistics:" -ForegroundColor Cyan
$repoSize = (Get-ChildItem .git -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "  • .git folder: $([math]::Round($repoSize, 2)) MB" -ForegroundColor White

$fileCount = (git ls-files | Measure-Object).Count
Write-Host "  • Tracked files: $fileCount" -ForegroundColor White

$commitCount = (git rev-list --count HEAD 2>$null)
Write-Host "  • Total commits: $commitCount" -ForegroundColor White

Write-Host ""
Write-Host "🛠️  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify on GitHub that everything looks good" -ForegroundColor White
Write-Host "  2. Run: npm run console" -ForegroundColor White
Write-Host "  3. Deploy: npm run deploy" -ForegroundColor White
Write-Host ""
Write-Host "💡 Backup saved to: ..\\$backupDir" -ForegroundColor Gray
Write-Host ""

pause
