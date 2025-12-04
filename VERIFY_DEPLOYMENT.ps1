# =====================================================
# 🔍 ÆSI Deployment Verification
# Checks if everything deployed correctly
# =====================================================

chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "🔍 ÆSI Deployment Verification" -ForegroundColor Cyan
Write-Host ""

# Get site URL
$status = netlify status 2>&1 | Out-String
if ($status -match "Site URL:\s+(https?://[^\s]+)") {
    $siteUrl = $matches[1]
    Write-Host "✅ Found site: $siteUrl" -ForegroundColor Green
    Write-Host ""
    
    # Test pages
    $pages = @("index.html", "login.html", "portal.html", "uploads.html", "book.html", "memory.html")
    
    Write-Host "Testing pages..." -ForegroundColor Yellow
    foreach ($page in $pages) {
        $url = "$siteUrl/$page"
        try {
            $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✓ $page - OK" -ForegroundColor Green
            } else {
                Write-Host "  ✗ $page - Status $($response.StatusCode)" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ✗ $page - Failed to load" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "✅ Verification complete!" -ForegroundColor Green
    
} else {
    Write-Host "❌ Could not find site URL" -ForegroundColor Red
    Write-Host "Run: netlify status" -ForegroundColor Yellow
}

Write-Host ""
pause
