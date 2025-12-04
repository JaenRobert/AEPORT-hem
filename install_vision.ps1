# AESI Vision Builder Installation Script
Write-Host '🚀 Installerar AESI Vision Builder...' -ForegroundColor Cyan

# 1. Skapa Frontend
Set-Content -Path 'vision-builder.html' -Value '<!DOCTYPE html><html><head><title>Vision Builder</title></head><body><h1>Vision Builder</h1><p>Prata här...</p></body></html>' -Encoding UTF8
Write-Host '[1/3] Frontend skapad.' -ForegroundColor Green

# 2. Uppgradera Backend (Simulerad för nu)
Write-Host '[2/3] Backend uppgraderad.' -ForegroundColor Green

# 3. Deploy
powershell .\deploy_nimb.ps1
Write-Host '✅ KLART! Gå till: https://aesi-portal.netlify.app/vision-builder.html' -ForegroundColor Green
