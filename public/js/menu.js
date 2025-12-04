/**
 * ÆSI Global Navigation System v1.0
 * Auto-injects navigation on all pages
 */

(function() {
  'use strict';
  
  const API_BASE = window.location.origin;
  
  // Check authentication status
  function isAuthenticated() {
    return !!localStorage.getItem('aesi_token');
  }
  
  // Get current user
  function getCurrentUser() {
    const user = localStorage.getItem('aesi_user');
    return user ? JSON.parse(user) : null;
  }
  
  // Logout function
  async function logout() {
    try {
      const token = localStorage.getItem('aesi_token');
      
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      localStorage.removeItem('aesi_token');
      localStorage.removeItem('aesi_user');
      window.location.href = '/login.html';
      
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.clear();
      window.location.href = '/login.html';
    }
  }
  
  // Create navigation HTML
  function createNavigation() {
    const user = getCurrentUser();
    const authenticated = isAuthenticated();
    
    const nav = document.createElement('nav');
    nav.className = 'aesi-global-nav';
    nav.innerHTML = `
      <div class="nav-container">
        <div class="nav-brand">
          <span class="nav-logo">ÆSI</span>
          <span class="nav-title">NEXUS</span>
        </div>
        
        <div class="nav-links">
          <a href="/index.html" class="nav-link">🏠 Hem</a>
          <a href="/uploads.html" class="nav-link">📤 Upload</a>
          <a href="/book.html" class="nav-link">📖 Boken</a>
          <a href="/memory.html" class="nav-link">💾 Tunnan</a>
          <a href="/portal.html" class="nav-link">🎛️ Portal</a>
        </div>
        
        <div class="nav-user">
          ${authenticated ? `
            <span class="user-name">${user?.username || 'User'}</span>
            <button onclick="window.aesiLogout()" class="nav-btn logout">🔐 Logga ut</button>
          ` : `
            <a href="/login.html" class="nav-btn login">🔑 Logga in</a>
          `}
        </div>
        
        <button class="mobile-menu-btn" onclick="window.aesiToggleMenu()">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      
      <div class="mobile-menu" id="mobileMenu">
        <a href="/index.html">🏠 Hem</a>
        <a href="/uploads.html">📤 Upload</a>
        <a href="/book.html">📖 Boken</a>
        <a href="/memory.html">💾 Tunnan</a>
        <a href="/portal.html">🎛️ Portal</a>
        ${authenticated ? `
          <button onclick="window.aesiLogout()">🔐 Logga ut</button>
        ` : `
          <a href="/login.html">🔑 Logga in</a>
        `}
      </div>
    `;
    
    return nav;
  }
  
  // Inject navigation into page
  function injectNavigation() {
    const nav = createNavigation();
    document.body.insertBefore(nav, document.body.firstChild);
    
    // Add active class to current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href').includes(currentPage)) {
        link.classList.add('active');
      }
    });
  }
  
  // Toggle mobile menu
  function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('active');
  }
  
  // Inject CSS
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body { 
        padding-top: 70px; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
        color: #fff;
        min-height: 100vh;
      }
      
      .aesi-global-nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-bottom: 2px solid #0f3460;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
      }
      
      .nav-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0.8rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .nav-brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: bold;
      }
      
      .nav-logo {
        font-size: 1.8rem;
        color: #00d4ff;
        text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
      }
      
      .nav-title {
        font-size: 1.2rem;
        color: #e94560;
        letter-spacing: 2px;
      }
      
      .nav-links {
        display: flex;
        gap: 0.5rem;
      }
      
      .nav-link {
        padding: 0.6rem 1.2rem;
        background: rgba(15, 52, 96, 0.6);
        color: #fff;
        text-decoration: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 500;
        transition: all 0.3s ease;
        border: 1px solid rgba(0, 212, 255, 0.2);
      }
      
      .nav-link:hover, .nav-link.active {
        background: rgba(0, 212, 255, 0.2);
        border-color: #00d4ff;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 212, 255, 0.3);
      }
      
      .nav-user {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .user-name {
        color: #00d4ff;
        font-size: 0.9rem;
      }
      
      .nav-btn {
        padding: 0.6rem 1.2rem;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
      }
      
      .nav-btn.logout {
        background: rgba(239, 68, 68, 0.6);
        color: #fff;
      }
      
      .nav-btn.logout:hover {
        background: rgba(239, 68, 68, 0.8);
      }
      
      .nav-btn.login {
        background: rgba(34, 197, 94, 0.6);
        color: #fff;
      }
      
      .nav-btn.login:hover {
        background: rgba(34, 197, 94, 0.8);
      }
      
      .mobile-menu-btn {
        display: none;
        flex-direction: column;
        gap: 4px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
      }
      
      .mobile-menu-btn span {
        width: 25px;
        height: 3px;
        background: #00d4ff;
        border-radius: 3px;
        transition: all 0.3s ease;
      }
      
      .mobile-menu {
        display: none;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem 2rem;
        background: rgba(15, 23, 42, 0.95);
        border-top: 1px solid rgba(0, 212, 255, 0.2);
      }
      
      .mobile-menu a, .mobile-menu button {
        padding: 0.8rem;
        background: rgba(15, 52, 96, 0.6);
        color: #fff;
        text-decoration: none;
        border: 1px solid rgba(0, 212, 255, 0.2);
        border-radius: 8px;
        text-align: center;
        transition: all 0.3s ease;
        font-size: 1rem;
        cursor: pointer;
      }
      
      .mobile-menu button {
        width: 100%;
      }
      
      .mobile-menu a:hover, .mobile-menu button:hover {
        background: rgba(0, 212, 255, 0.2);
        border-color: #00d4ff;
      }
      
      .mobile-menu.active {
        display: flex;
      }
      
      @media (max-width: 768px) {
        .nav-links, .nav-user { display: none; }
        .mobile-menu-btn { display: flex; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStyles();
      injectNavigation();
    });
  } else {
    injectStyles();
    injectNavigation();
  }
  
  // Expose functions globally
  window.aesiLogout = logout;
  window.aesiToggleMenu = toggleMenu;
  window.aesiIsAuthenticated = isAuthenticated;
  
})();
