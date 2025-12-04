[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "=== 🚀 AESI Deploy v1.3 (NIMB AutoVerify Engine) ===" -ForegroundColor Cyan

# ====== 1. UPPDATERA & EXPORTERA ======
if (Test-Path ".\update_nimb.py") {
    Write-Host "🔧 Kör update_nimb.py..." -ForegroundColor Yellow
    python .\update_nimb.py
} else {
    Write-Host "⚠️  Ingen update_nimb.py hittad – hoppar över uppdatering." -ForegroundColor DarkYellow
}

# ====== 2. UPPDATERA DATUM ======
$indexPath = ".\index.html"
if (Test-Path $indexPath) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "🕒 Uppdaterar datum i banner: $timestamp" -ForegroundColor Yellow
    $content = Get-Content $indexPath -Raw
    $updated = $content -replace '(?<=<span id="status-time">).*?(?=</span>)', $timestamp
    $updated | Set-Content -Path $indexPath -Encoding UTF8
    Write-Host "✅ index.html uppdaterad" -ForegroundColor Green
}

# ====== 3. GIT OPERATIONS ======
Write-Host "📦 Lägger till filer..." -ForegroundColor Yellow
git add .

$date = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMsg = "AutoDeploy v1.3 – $date"
Write-Host "📝 Commit: $commitMsg" -ForegroundColor Yellow
git commit -m "$commitMsg"

Write-Host "🌐 Pushar till GitHub..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Något gick fel vid push." -ForegroundColor Red
    exit
}

# ====== 4. NETLIFY AUTO VERIFY ======
Write-Host "🛰  Väntar på att Netlify ska bygga klart..." -ForegroundColor DarkGray
Start-Sleep -Seconds 5

$siteUrl = "https://aesi-portal.netlify.app"
$timeout = 180   # 3 minuter
$interval = 10
$elapsed = 0
$success = $false

while ($elapsed -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200 -and $response.Content -match "ÆSI Portal|AESI") {
            Write-Host "✅ Netlify build klar! Portalen svarar korrekt." -ForegroundColor Green
            $success = $true
            break
        }
    } catch {
        # Ignorera fel tills sidan svarar
    }
    Write-Host "⌛ Väntar... ($elapsed s)" -ForegroundColor DarkGray
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

if (-not $success) {
    Write-Host "⚠️  Timeout – kunde inte verifiera portalen inom $timeout sekunder." -ForegroundColor DarkYellow
} else {
    Write-Host "🌍 Öppnar portalen i webbläsaren..." -ForegroundColor Cyan
    Start-Process $siteUrl
}

# ====== 5. PIPELINE STATUS ======
Write-Host ""
Write-Host "------------------------------------------" -ForegroundColor DarkGray
Write-Host " AESI PIPELINE v1.3 – NIMB AutoVerify " -ForegroundColor Magenta
Write-Host " [Local Update] → [GitHub Push] → [Netlify Build] → [Portal Ready]" -ForegroundColor Gray
Write-Host "------------------------------------------" -ForegroundColor DarkGray
Write-Host " ✅ AESI Deploy v1.3 – NIMB Live Engine Synced" -ForegroundColor Green
Write-Host "------------------------------------------" -ForegroundColor DarkGray
