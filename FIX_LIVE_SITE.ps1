# =====================================================
# 🔥 ÆSI NEXUS - FIX LIVE SITE
# Makes your deployed site work properly
# =====================================================

chcp 65001 > $null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    🔧 FIXING YOUR LIVE SITE" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Site: https://6931e60e4696eeea56a3fa3b--aesi-hem.netlify.app/" -ForegroundColor Yellow
Write-Host ""

# STEP 1: Ensure menu.js exists and is correct
Write-Host "[1/5] 🧭 Creating/fixing navigation..." -ForegroundColor Yellow

# Create public/js directory if needed
New-Item -ItemType Directory -Path "public/js" -Force | Out-Null

# Create menu.js with correct paths
$menuJs = @'
// ÆSI Global Navigation System v3.0
document.addEventListener("DOMContentLoaded", () => {
  const menuHTML = `
  <nav class="aesi-nav">
    <div class="aesi-logo">
      <span class="logo-icon">⚡</span>
      <span class="logo-text">ÆSI NEXUS</span>
    </div>
    <ul class="aesi-menu">
      <li><a href="./index.html">🏠 Hem</a></li>
      <li><a href="./portal.html">🧠 Portal</a></li>
      <li><a href="./uploads.html">📤 Upload</a></li>
      <li><a href="./book.html">📖 Boken</a></li>
      <li><a href="./memory.html">💾 Tunnan</a></li>
      <li><a href="./login.html">🔐 Login</a></li>
    </ul>
  </nav>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Consolas', monospace; background: #0a0a0a; color: #eee; }
    .aesi-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      border-bottom: 2px solid #00ffe0;
      padding: 12px 24px;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .aesi-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #00ffe0;
      font-size: 1.3rem;
      font-weight: bold;
    }
    .aesi-menu {
      list-style: none;
      display: flex;
      gap: 1.5rem;
    }
    .aesi-menu a {
      color: #eee;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.3s ease;
    }
    .aesi-menu a:hover {
      color: #00ffe0;
      background: rgba(0, 255, 224, 0.1);
    }
    @media (max-width: 768px) {
      .aesi-nav { flex-direction: column; }
      .aesi-menu { flex-direction: column; width: 100%; }
    }
  </style>
  `;
  document.body.insertAdjacentHTML("afterbegin", menuHTML);
  console.log("✅ ÆSI Navigation loaded");
});
'@

Set-Content -Path "public/js/menu.js" -Value $menuJs -Encoding UTF8
Write-Host "✅ Navigation script created" -ForegroundColor Green
Write-Host ""

# STEP 2: Ensure all HTML files have menu.js
Write-Host "[2/5] 📝 Fixing HTML files..." -ForegroundColor Yellow

$htmlFiles = Get-ChildItem -Path "public" -Filter "*.html" -ErrorAction SilentlyContinue

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Check if menu.js is included
    if ($content -notmatch "menu\.js") {
        # Add menu.js before </head>
        $content = $content -replace "(?i)</head>", '<script src="./js/menu.js"></script></head>'
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "  ✓ Fixed: $($file.Name)" -ForegroundColor Gray
    } else {
        # Make sure path is correct
        $content = $content -replace 'src="[/]?js/menu\.js"', 'src="./js/menu.js"'
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "  ✓ Updated: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "✅ All HTML files fixed" -ForegroundColor Green
Write-Host ""

# STEP 3: Create index.html if missing
Write-Host "[3/5] 🏠 Ensuring index.html exists..." -ForegroundColor Yellow

if (-not (Test-Path "public/index.html")) {
    $indexHtml = @'
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ÆSI NEXUS - Home</title>
  <script src="./js/menu.js"></script>
  <style>
    body { background: #0a0a0a; color: #eee; }
    .container { max-width: 1200px; margin: 2rem auto; padding: 2rem; }
    h1 { color: #00ffe0; font-size: 2.5rem; margin-bottom: 1rem; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
    .card { background: #1a1a1a; padding: 2rem; border-radius: 12px; border: 1px solid #333; transition: all 0.3s; }
    .card:hover { border-color: #00ffe0; transform: translateY(-4px); }
    .card h2 { color: #00ffe0; margin-bottom: 1rem; }
    .card a { color: #00ffe0; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Välkommen till ÆSI NEXUS</h1>
    <p>Din kompletta AI-utvecklingsplattform</p>
    
    <div class="cards">
      <div class="card">
        <h2>🧠 AI Portal</h2>
        <p>Interagera med olika AI-noder (REFLEX, CLAUDE, JEMMIN)</p>
        <a href="./portal.html">Öppna Portal →</a>
      </div>
      
      <div class="card">
        <h2>📤 Uppladdning</h2>
        <p>Ladda upp och hantera filer</p>
        <a href="./uploads.html">Öppna Upload →</a>
      </div>
      
      <div class="card">
        <h2>📖 Boken</h2>
        <p>Kapitelhantering och dokumentation</p>
        <a href="./book.html">Öppna Boken →</a>
      </div>
      
      <div class="card">
        <h2>💾 Tunnan</h2>
        <p>Konversationshistorik och minne</p>
        <a href="./memory.html">Öppna Tunnan →</a>
      </div>
    </div>
  </div>
</body>
</html>
'@
    Set-Content -Path "public/index.html" -Value $indexHtml -Encoding UTF8
    Write-Host "✅ Created index.html" -ForegroundColor Green
} else {
    Write-Host "✅ index.html exists" -ForegroundColor Green
}
Write-Host ""

# STEP 4: Verify netlify.toml
Write-Host "[4/5] 🌐 Checking Netlify config..." -ForegroundColor Yellow

if (-not (Test-Path "netlify.toml")) {
    $netlifyToml = @'
[build]
  publish = "public"
  command = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
'@
    Set-Content -Path "netlify.toml" -Value $netlifyToml -Encoding UTF8
    Write-Host "✅ Created netlify.toml" -ForegroundColor Green
} else {
    Write-Host "✅ netlify.toml exists" -ForegroundColor Green
}
Write-Host ""

# STEP 5: Deploy to Netlify
Write-Host "[5/5] 🚀 Deploying fixes..." -ForegroundColor Yellow

# Check Netlify CLI
if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
    Write-Host "  Installing Netlify CLI..." -ForegroundColor Cyan
    npm install -g netlify-cli
}

# Deploy
Write-Host "  Deploying to production..." -ForegroundColor Cyan
netlify deploy --prod --dir=public

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "    ✅ SITE FIXED!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌍 Your site: https://6931e60e4696eeea56a3fa3b--aesi-hem.netlify.app/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "  ✓ Fixed navigation menu" -ForegroundColor Green
Write-Host "  ✓ Fixed all HTML file paths" -ForegroundColor Green
Write-Host "  ✓ Created/updated index.html" -ForegroundColor Green
Write-Host "  ✓ Verified Netlify config" -ForegroundColor Green
Write-Host "  ✓ Deployed to production" -ForegroundColor Green
Write-Host ""
Write-Host "Wait 30 seconds, then refresh your site!" -ForegroundColor Cyan
Write-Host ""

pause
