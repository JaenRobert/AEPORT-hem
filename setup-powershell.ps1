# ÆSI PowerShell Profile Setup (Enhanced v2.0)

Write-Host "🔧 Setting up ÆSI PowerShell environment..." -ForegroundColor Cyan

# Get profile path
$profilePath = $PROFILE

# Create profile directory if it doesn't exist
$profileDir = Split-Path -Parent $profilePath
if (!(Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    Write-Host "✓ Created profile directory: $profileDir" -ForegroundColor Green
}

# Enhanced run-aesi function with auto-browser
$functionCode = @'

# ÆSI Quick Start Function (v2.0)
function run-aesi {
    param(
        [switch]$NoBrowser,
        [string]$Port = "3000"
    )
    
    Write-Host "⚡ Starting ÆSI Backend..." -ForegroundColor Cyan
    
    # Check if already running
    $existing = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
                Where-Object { $_.CommandLine -like "*aesi_backend.js*" }
    
    if ($existing) {
        Write-Host "⚠️  Backend already running (PID: $($existing.Id))" -ForegroundColor Yellow
        Write-Host "   Kill it with: Stop-Process -Id $($existing.Id)" -ForegroundColor Gray
        return
    }
    
    # Start backend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; node aesi_backend.js"
    
    Write-Host "✓ Backend started on port $Port" -ForegroundColor Green
    Write-Host "⏳ Waiting for server to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
    
    # Open browser unless disabled
    if (-not $NoBrowser) {
        $url = "http://localhost:$Port/index.html"
        Write-Host "🌐 Opening $url..." -ForegroundColor Cyan
        Start-Process $url
        Write-Host "✓ Browser opened!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📊 ÆSI Backend Ready!" -ForegroundColor Green
    Write-Host "   • Build: http://localhost:$Port/api/build" -ForegroundColor Gray
    Write-Host "   • Vision: http://localhost:$Port/api/vision-update" -ForegroundColor Gray
    Write-Host "   • Exec: http://localhost:$Port/api/exec" -ForegroundColor Gray
    Write-Host ""
}

# Quick aliases
function aesi-stop {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like "*aesi_backend.js*" } | 
    Stop-Process -Force
    Write-Host "✓ ÆSI Backend stopped" -ForegroundColor Green
}

function aesi-status {
    $proc = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
            Where-Object { $_.CommandLine -like "*aesi_backend.js*" }
    
    if ($proc) {
        Write-Host "✓ ÆSI Backend RUNNING (PID: $($proc.Id))" -ForegroundColor Green
        Write-Host "   Memory: $([math]::Round($proc.WorkingSet64/1MB, 2)) MB" -ForegroundColor Gray
        Write-Host "   Started: $($proc.StartTime)" -ForegroundColor Gray
    } else {
        Write-Host "✗ ÆSI Backend NOT RUNNING" -ForegroundColor Red
    }
}

function aesi-restart {
    Write-Host "🔄 Restarting ÆSI Backend..." -ForegroundColor Cyan
    aesi-stop
    Start-Sleep -Seconds 1
    run-aesi
}

Write-Host "⚡ ÆSI PowerShell environment loaded!" -ForegroundColor Cyan
Write-Host "   Commands: run-aesi, aesi-stop, aesi-status, aesi-restart" -ForegroundColor Gray

'@

# Check if profile exists
if (!(Test-Path $profilePath)) {
    # Create new profile
    $functionCode | Out-File -FilePath $profilePath -Encoding UTF8
    Write-Host "✓ Created new PowerShell profile: $profilePath" -ForegroundColor Green
} else {
    # Update existing profile
    $currentContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
    
    if ($currentContent -notlike "*function run-aesi*") {
        # Append to existing profile
        "`n# ÆSI Functions" | Out-File -FilePath $profilePath -Append -Encoding UTF8
        $functionCode | Out-File -FilePath $profilePath -Append -Encoding UTF8
        Write-Host "✓ Added ÆSI functions to existing profile" -ForegroundColor Green
    } else {
        # Replace existing function
        $pattern = "(?s)# ÆSI Quick Start Function.*?(?=\n(?:function|#|\z))"
        $updatedContent = $currentContent -replace $pattern, $functionCode.Trim()
        $updatedContent | Out-File -FilePath $profilePath -Encoding UTF8
        Write-Host "✓ Updated existing ÆSI functions" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Close this PowerShell window" -ForegroundColor White
Write-Host "   2. Open a NEW PowerShell window" -ForegroundColor White
Write-Host "   3. Type: run-aesi" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Or reload profile now with: . `$PROFILE" -ForegroundColor Gray
Write-Host ""
