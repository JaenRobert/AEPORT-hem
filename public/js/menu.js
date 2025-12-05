/**
 * ÆSI Global Navigation System v3.0
 * Automatically injects unified navigation across all pages
 */

document.addEventListener("DOMContentLoaded", () => {
  // Create navigation HTML
  const menuHTML = `
  <nav class="aesi-nav">
    <div class="aesi-logo">
      <span class="logo-icon">⚡</span>
      <span class="logo-text">ÆSI NEXUS</span>
      <span class="logo-version">v5.0</span>
    </div>
    <ul class="aesi-menu">
      <li><a href="/index.html" data-page="index">🏠 Hem</a></li>
      <li><a href="/ai_console.html" data-page="ai_console">💻 AI Console</a></li>
      <li><a href="/portal.html" data-page="portal">🧠 Portal</a></li>
      <li><a href="/uploads.html" data-page="uploads">📤 Upload</a></li>
      <li><a href="/book.html" data-page="book">📖 Boken</a></li>
      <li><a href="/memory.html" data-page="memory">💾 Tunnan</a></li>
      <li><a href="/login.html" data-page="login">🔐 Login</a></li>
    </ul>
    <button class="mobile-toggle" aria-label="Toggle menu">☰</button>
  </nav>
  <style>
    /* ÆSI Navigation Styles */
    .aesi-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      border-bottom: 2px solid #00ffe0;
      padding: 12px 24px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      box-shadow: 0 4px 12px rgba(0, 255, 224, 0.1);
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
      letter-spacing: 1px;
    }
    
    .logo-icon {
      font-size: 1.5rem;
      animation: pulse 2s infinite;
    }
    
    .logo-version {
      font-size: 0.7rem;
      opacity: 0.6;
      background: rgba(0, 255, 224, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .aesi-menu {
      list-style: none;
      display: flex;
      gap: 1.5rem;
      margin: 0;
      padding: 0;
      align-items: center;
    }
    
    .aesi-menu a {
      color: #eee;
      text-decoration: none;
      transition: all 0.3s ease;
      padding: 6px 12px;
      border-radius: 6px;
      position: relative;
    }
    
    .aesi-menu a:hover {
      color: #00ffe0;
      background: rgba(0, 255, 224, 0.1);
      text-shadow: 0 0 8px rgba(0, 255, 224, 0.6);
      transform: translateY(-2px);
    }
    
    .aesi-menu a.active {
      color: #00ffe0;
      font-weight: bold;
      background: rgba(0, 255, 224, 0.15);
      border-bottom: 2px solid #00ffe0;
    }
    
    .mobile-toggle {
      display: none;
      background: none;
      border: 2px solid #00ffe0;
      color: #00ffe0;
      font-size: 1.5rem;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .mobile-toggle:hover {
      background: rgba(0, 255, 224, 0.2);
      transform: rotate(90deg);
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
      .aesi-nav {
        flex-wrap: wrap;
        padding: 12px;
      }
      
      .mobile-toggle {
        display: block;
      }
      
      .aesi-menu {
        display: none;
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        margin-top: 12px;
        gap: 0.5rem;
      }
      
      .aesi-menu.active {
        display: flex;
      }
      
      .aesi-menu a {
        width: 100%;
        text-align: center;
        padding: 12px;
      }
    }
  </style>
  `;
  
  // Insert menu at top of body
  document.body.insertAdjacentHTML("afterbegin", menuHTML);
  
  // Highlight current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".aesi-menu a").forEach(link => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (linkPage === currentPage) {
      link.classList.add("active");
    }
  });
  
  // Mobile menu toggle
  const toggle = document.querySelector(".mobile-toggle");
  const menu = document.querySelector(".aesi-menu");
  
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("active");
    });
  }
  
  console.log("✅ ÆSI Navigation loaded");
});
