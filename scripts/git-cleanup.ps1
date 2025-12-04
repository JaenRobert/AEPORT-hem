Get-ChildItem -Path . -Recurse -Filter 'desktop.ini' | Remove-Item -Force -ErrorAction SilentlyContinue
git gc --prune=now
git reflog expire --expire=now --all
git repack -ad
Write-Host '✅ Git cleanup klar.' -ForegroundColor Green
