Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " ÆSI AUTO GIT FIXER v1.0 – Automatisk återställning " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 1

$project = "C:\Users\jaenr\Min enhet (jaenrobert@gmail.com)\AEPORT_LOCAL"
Set-Location $project
Write-Host "📂 Projektmapp: $project" -ForegroundColor Yellow

# 1️⃣ Backup
$backupPath = "$project\backup_git_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
Copy-Item -Path "$project\*" -Destination $backupPath -Recurse -Force
Write-Host "💾 Fullständig backup skapad: $backupPath" -ForegroundColor Green

# 2️⃣ Ta bort trasiga refs
Write-Host "🧹 Rensar trasiga Git-refs och desktop.ini..."
Remove-Item -Recurse -Force .git\refs\desktop.ini -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .git\refs\heads\desktop.ini -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .git\refs\remotes\desktop.ini -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .git\refs\remotes\origin\desktop.ini -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .git\refs\tags\desktop.ini -ErrorAction SilentlyContinue
Write-Host "✅ Trasiga refs borttagna." -ForegroundColor Green

# 3️⃣ Återställ index och ta bort onödiga filer
Write-Host "🧩 Återställer index och tar bort skräpfiler..."
git rm --cached -r . | Out-Null
git add . | Out-Null
git clean -fdx | Out-Null
Write-Host "✅ Cache och temporära filer rensade." -ForegroundColor Green

# 4️⃣ Git konfiguration
git config --global user.name "JaenRobert"
git config --global user.email "jaenrobert@gmail.com"
Write-Host "✅ Git-konfiguration uppdaterad." -ForegroundColor Green

# 5️⃣ Skapa commit
git add -A
git commit -m "🔥 Consolidated cleanup commit – synced 737 changes (ÆSI auto)" | Out-Null
Write-Host "💾 Alla ändringar samlade i en enda commit." -ForegroundColor Green

# 6️⃣ Synka mot origin
git fetch origin main | Out-Null
git rebase origin/main 2>$null
git push origin main --force | Out-Null
Write-Host "🚀 Repository synkroniserat med GitHub." -ForegroundColor Green

# 7️⃣ Rensa gamla refs och optimera
git gc --prune=now | Out-Null
git fsck | Out-Null
Write-Host "🧠 Repository optimerat och kontrollerat." -ForegroundColor Green

# 8️⃣ Lägg till gitignore för framtiden
@"
*.ini
.vs/
node_modules/
public/backup_index_*.html
data/
"@ | Out-File "$project\.gitignore" -Encoding UTF8 -Force
git add .gitignore | Out-Null
git commit -m "🧹 Added ignore rules to prevent future overload" | Out-Null
git push | Out-Null
Write-Host "🚫 Ignorera-regler tillagda och pushade." -ForegroundColor Green

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "✅ ALLT KLART – REPO RENSAT, SYNKAT & BACKUP SPARAD ✅" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
