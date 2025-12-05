# =====================================================
# ÆSI Menu Injection Script v3.0
# Automatically injects menu.js into all HTML files
# =====================================================

chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    🧭 ÆSI MENU INJECTION v3.0" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$path = "c:\Users\jaenr\Min enhet (jaenrobert@gmail.com)\AEPORT_LOCAL\public"
$menuScript = '<script src="/js/menu.js"></script>'

Write-Host "📂 Scanning: $path" -ForegroundColor Yellow
Write-Host ""

$files = Get-ChildItem -Path $path -Filter *.html -Recurse -ErrorAction SilentlyContinue
$injected = 0
$skipped = 0
$errors = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        
        # Check if menu.js already exists
        if ($content -match "menu\.js") {
            Write-Host "  ⏭️  Skipping: $($file.Name) (already has menu)" -ForegroundColor Gray
            $skipped++
            continue
        }
        
        # Find </head> tag and inject before it
        if ($content -match "(?i)</head>") {
            $updated = $content -replace "(?i)</head>", "$menuScript`n</head>"
            Set-Content -Path $file.FullName -Value $updated -Encoding UTF8 -NoNewline
            Write-Host "  ✅ Injected: $($file.Name)" -ForegroundColor Green
            $injected++
        } else {
            Write-Host "  ⚠️  No </head> tag found: $($file.Name)" -ForegroundColor Yellow
            $skipped++
        }
        
    } catch {
        Write-Host "  ❌ Error processing: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "    ✅ MENU INJECTION COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Results:" -ForegroundColor Cyan
Write-Host "  • Injected: $injected files" -ForegroundColor Green
Write-Host "  • Skipped: $skipped files" -ForegroundColor Yellow
Write-Host "  • Errors: $errors files" -ForegroundColor Red
Write-Host ""

if ($injected -gt 0) {
    Write-Host "🎉 Menu successfully injected into $injected HTML files!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run: npm start" -ForegroundColor White
    Write-Host "  2. Open: http://localhost:3000" -ForegroundColor White
    Write-Host "  3. Navigate between pages to see the menu" -ForegroundColor White
} else {
    Write-Host "ℹ️  No files needed menu injection" -ForegroundColor Cyan
}

Write-Host ""
pause
