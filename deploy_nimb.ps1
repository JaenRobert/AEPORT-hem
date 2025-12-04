[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "=== AESI Deploy v1.6 (AutoRollback Edition) ===" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"

$indexPath = ".\index.html"
$timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$logPath = ".\deploy_log.txt"
$backupPath = ".\backup_index_$((Get-Date).ToString('yyyyMMdd_HHmmss')).html"
$netlifyURL = "https://aesi-portal.netlify.app"

Add-Content $logPath "`n[$timestamp] --- START DEPLOY v1.6 ---"

try {
    if (Test-Path ".\update_nimb.py") {
        Write-Host "[1/6] Kör update_nimb.py..." -ForegroundColor Yellow
        python .\update_nimb.py
    } else {
        Write-Host "[1/6] Ingen update_nimb.py hittad – hoppar över." -ForegroundColor DarkYellow
    }

    if (Test-Path $indexPath) {
        Copy-Item $indexPath $backupPath -Force
        Write-Host "[2/6] Backup skapad: $backupPath" -ForegroundColor DarkGray

        $content = Get-Content $indexPath -Raw
        $pattern = '(?<=<span id=""status-time"">).*?(?=</span>)'
        $updated = [regex]::Replace($content, $pattern, $timestamp)
        $updated | Set-Content -Path $indexPath -Encoding UTF8

        Write-Host "[2/6] index.html uppdaterad med nytt datum." -ForegroundColor Green
    } else {
        throw "index.html saknas – deploy avbruten."
    }

    Write-Host "[3/6] Kontrollerar ändringar..." -ForegroundColor Yellow
    $status = git status --porcelain
    if (-not [string]::IsNullOrWhiteSpace($status)) {
        git add .
        $date = Get-Date -Format "yyyy-MM-dd HH:mm"
        $commitMsg = "Auto-deploy v1.6 @ $date"
        git commit -m "$commitMsg"
        Write-Host "[3/6] Commit skapad: $commitMsg" -ForegroundColor Green
    } else {
        Write-Host "[3/6] Inga ändringar att committa – hoppar över." -ForegroundColor DarkYellow
    }

    Write-Host "[4/6] Pushar till GitHub..." -ForegroundColor Yellow
    git push
    Write-Host "[4/6] Push klar." -ForegroundColor Green

    Write-Host "[5/6] Kontrollerar Netlify-status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    $response = Invoke-WebRequest -Uri $netlifyURL -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "[5/6] Netlify-bygget svarar korrekt (200 OK)." -ForegroundColor Green
    } else {
        Write-Host "[5/6] Netlify svarade med kod $($response.StatusCode)" -ForegroundColor DarkYellow
    }

    Add-Content $logPath "[$(Get-Date)] Deploy OK ($netlifyURL)"
}
catch {
    Write-Host "[⚠️] Fel: $($_.Exception.Message)" -ForegroundColor Red
    if (Test-Path $backupPath) {
        Copy-Item $backupPath $indexPath -Force
        Write-Host "[Rollback] Återställde index.html från backup." -ForegroundColor Red
        Add-Content $logPath "Rollback aktiverad: $backupPath"
    }
}
finally {
    Write-Host ""
    Write-Host "------------------------------------------" -ForegroundColor DarkGray
    Write-Host " AESI PIPELINE v1.6" -ForegroundColor Magenta
    Write-Host " [Backup] -> [Smart Commit] -> [Push] -> [Netlify Verify] -> [Rollback Safe]" -ForegroundColor Gray
    Write-Host "------------------------------------------" -ForegroundColor DarkGray
    Write-Host " AESI Deploy v1.6 - NIMB LiveSync Engine" -ForegroundColor Green
    Write-Host "------------------------------------------" -ForegroundColor DarkGray
    Add-Content $logPath "[$(Get-Date -Format 'HH:mm:ss')] --- DEPLOY KLAR ---`n"
}
