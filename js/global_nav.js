/**
 * Global Navigation System för ÆSI Portal
 * Lägger automatiskt till en meny på alla HTML-sidor
 */

(function() {
    'use strict';

    // Vänta tills DOM är laddad
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobalNav);
    } else {
        initGlobalNav();
    }

    function initGlobalNav() {
        // Kontrollera om menyn redan finns
        if (document.getElementById('aesi-global-nav')) return;

        // Skapa meny-HTML
        const navHTML = `
            <div id="aesi-global-nav" class="aesi-global-nav">
                <button class="nav-toggle" onclick="toggleAesiNav()" title="Öppna navigering">
                    ☰
                </button>
                <div class="nav-menu" id="aesi-nav-menu">
                    <div class="nav-header">
                        <span class="nav-logo">ÆSI</span>
                        <button class="nav-close" onclick="toggleAesiNav()">✕</button>
                    </div>
                    <nav class="nav-links">
                        <a href="/index.html" class="nav-link">🏠 Hem</a>
                        <a href="/console.html" class="nav-link">⚙️ Konsol</a>
                        <a href="/chat.html" class="nav-link">💬 Chat</a>
                        <a href="/claude_workspace.html" class="nav-link">❤️ Claude</a>
                        <a href="/nexus.html" class="nav-link">🌐 Nexus</a>
                    </nav>
                    <div class="nav-footer">
                        <div class="nav-status">
                            <span class="status-dot"></span>
                            <span class="status-text">System Online</span>
                        </div>
                    </div>
                </div>
                <div class="nav-overlay" onclick="toggleAesiNav()"></div>
            </div>
        `;

        // Skapa CSS
        const styleHTML = `
            <style>
                .aesi-global-nav { position: fixed; top: 20px; right: 20px; z-index: 99999; }
                .nav-toggle { 
                    background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); 
                    border: none; 
                    color: white; 
                    font-size: 24px; 
                    width: 50px; 
                    height: 50px; 
                    border-radius: 50%; 
                    cursor: pointer; 
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
                    transition: all 0.3s ease;
                }
                .nav-toggle:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(79, 70, 229, 0.6); }
                .nav-menu { 
                    position: fixed; 
                    top: 0; 
                    right: -350px; 
                    width: 320px; 
                    height: 100vh; 
                    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); 
                    box-shadow: -4px 0 20px rgba(0,0,0,0.5);
                    transition: right 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    z-index: 100001;
                }
                .nav-menu.open { right: 0; }
                .nav-overlay { 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100vw; 
                    height: 100vh; 
                    background: rgba(0,0,0,0); 
                    pointer-events: none; 
                    transition: background 0.3s ease;
                    z-index: 100000;
                }
                .nav-overlay.open { background: rgba(0,0,0,0.6); pointer-events: all; }
                .nav-header { 
                    padding: 20px; 
                    border-bottom: 1px solid rgba(255,255,255,0.1); 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                }
                .nav-logo { font-size: 28px; font-weight: bold; color: #00d4ff; text-shadow: 0 0 10px rgba(0,212,255,0.5); }
                .nav-close { 
                    background: none; 
                    border: none; 
                    color: white; 
                    font-size: 32px; 
                    cursor: pointer; 
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                .nav-close:hover { background: rgba(255,255,255,0.1); }
                .nav-links { 
                    flex: 1; 
                    padding: 20px 0; 
                    overflow-y: auto;
                }
                .nav-link { 
                    display: block; 
                    padding: 16px 24px; 
                    color: white; 
                    text-decoration: none; 
                    font-size: 16px; 
                    font-weight: 500; 
                    transition: all 0.2s;
                    border-left: 4px solid transparent;
                }
                .nav-link:hover { 
                    background: rgba(0,212,255,0.1); 
                    border-left-color: #00d4ff; 
                    padding-left: 28px;
                }
                .nav-footer { 
                    padding: 20px; 
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                .nav-status { 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    color: #888;
                    font-size: 12px;
                }
                .status-dot { 
                    width: 10px; 
                    height: 10px; 
                    border-radius: 50%; 
                    background: #10b981; 
                    animation: pulse 2s infinite;
                }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            </style>
        `;

        // Lägg till i body
        document.body.insertAdjacentHTML('beforeend', styleHTML);
        document.body.insertAdjacentHTML('beforeend', navHTML);

        // Markera aktiv sida
        highlightCurrentPage();
    }

    function highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            if (link.getAttribute('href') === currentPath || 
                (currentPath === '/' && link.getAttribute('href') === '/index.html')) {
                link.style.background = 'rgba(0,212,255,0.2)';
                link.style.borderLeftColor = '#00d4ff';
            }
        });
    }

    // Global toggle-funktion
    window.toggleAesiNav = function() {
        const menu = document.getElementById('aesi-nav-menu');
        const overlay = document.querySelector('.nav-overlay');
        menu.classList.toggle('open');
        overlay.classList.toggle('open');
    };
})();
