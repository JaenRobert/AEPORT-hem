# =====================================================
# 🚀 ÆSI Quick Deploy (No Prompts)
# Fast deployment without user interaction
# =====================================================

chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location "$PSScriptRoot\.."

Write-Host "🚀 Quick deploying to Netlify..." -ForegroundColor Cyan

# Clean
git gc --prune=now 2>$null

# Build (if exists)
if (Test-Path "package.json") {
    npm install 2>&1 | Out-Null
    if ((Get-Content package.json -Raw) -match '"build"') {
        npm run build 2>&1 | Out-Null
    }
}

# Deploy
netlify deploy --prod --dir=public

Write-Host "✅ Done!" -ForegroundColor Green
