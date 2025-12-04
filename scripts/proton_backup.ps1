# 🚀 AESI Proton Backup v1.0
\ = \"C:\Users\jaenr\Min enhet (jaenrobert@gmail.com)\AEPORT_LOCAL\data\uploads\"
\ = \"C:\Users\jaenr\Proton Drive\AEPORT_BACKUP\"
Write-Host \"[Backup] Synkroniserar filer...\" -ForegroundColor Cyan
if (!(Test-Path \)) { New-Item -ItemType Directory -Path \ | Out-Null }
Copy-Item -Path \\* -Destination \ -Recurse -Force
Write-Host \"[Backup] ✅ Klart: Filer säkrade till Proton Drive.\" -ForegroundColor Green
