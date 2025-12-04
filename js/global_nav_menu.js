/**
 * GLOBAL NAVIGATION MENU SYSTEM
 * =============================
 * A fun, multi-directional scroll menu that works on all pages
 * with buttons floating on all sides of the screen.
 */

class GlobalNavMenu {
    constructor() {
        this.isOpen = false;
        this.currentPage = this.detectCurrentPage();
        this.init();
    }

    init() {
        this.createMenuHTML();
        this.attachStyles();
        this.attachEventListeners();
        this.populateMenuItems();
        this.createFloatingButtons();
        console.log('✨ GlobalNavMenu initialized on:', this.currentPage);
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('index.html') || path === '/') return 'portal';
        if (path.includes('chat')) return 'chat';
        if (path.includes('modules')) return 'modules';
        if (path.includes('claude')) return 'claude';
        if (path.includes('console')) return 'console';
        if (path.includes('archivarius')) return 'archivarius';
        return 'unknown';
    }

    createMenuHTML() {
        const menuHTML = `
            <div id="globalNavOverlay" class="global-nav-overlay"></div>
            <div id="globalNavMenu" class="global-nav-menu">
                <div class="nav-menu-top">
                    <div class="nav-menu-brand">
                        <span class="brand-icon">Æ</span>
                        <span class="brand-text">NAVIGERA</span>
                        <button class="nav-close-btn" onclick="window.globalNav.toggle()">✕</button>
                    </div>
                </div>

                <div class="nav-menu-scroll">
                    <div id="navMenuItems" class="nav-menu-items"></div>
                </div>

                <div class="nav-menu-footer">
                    <div class="nav-footer-info">
                        <span id="currentPageName" class="page-indicator">PORTAL</span>
                        <span class="page-timestamp" id="pageTime">--:--</span>
                    </div>
                </div>
            </div>

            <!-- FLOATING BUTTONS ON ALL SIDES -->
            <div id="topNavButtons" class="floating-buttons top-buttons"></div>
            <div id="bottomNavButtons" class="floating-buttons bottom-buttons"></div>
            <div id="leftNavButtons" class="floating-buttons left-buttons"></div>
            <div id="rightNavButtons" class="floating-buttons right-buttons"></div>
        `;

        const container = document.createElement('div');
        container.id = 'globalNavContainer';
        container.innerHTML = menuHTML;
        document.body.insertBefore(container, document.body.firstChild);
    }

    attachStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* GLOBAL NAV MENU STYLES */
            :root {
                --nav-primary: #6366f1;
                --nav-dark: #0f172a;
                --nav-light: #f8fafc;
                --nav-border: #262626;
            }

            /* OVERLAY */
            .global-nav-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0);
                transition: all 0.3s ease;
                z-index: 998;
                pointer-events: none;
            }

            .global-nav-overlay.open {
                background: rgba(0, 0, 0, 0.6);
                pointer-events: all;
            }

            /* MAIN MENU */
            #globalNavMenu {
                position: fixed;
                left: -380px;
                top: 0;
                width: 350px;
                height: 100vh;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: #f8fafc;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                z-index: 999;
                display: flex;
                flex-direction: column;
                box-shadow: 4px 0 30px rgba(0, 0, 0, 0.5);
                border-right: 2px solid #6366f1;
            }

            #globalNavMenu.open {
                left: 0;
                box-shadow: 4px 0 40px rgba(99, 102, 241, 0.3);
            }

            /* MENU TOP */
            .nav-menu-top {
                padding: 24px;
                border-bottom: 2px solid rgba(99, 102, 241, 0.2);
                flex-shrink: 0;
            }

            .nav-menu-brand {
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;
            }

            .brand-icon {
                font-size: 32px;
                background: #6366f1;
                width: 50px;
                height: 50px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
                font-weight: bold;
            }

            .brand-text {
                font-size: 18px;
                font-weight: bold;
                letter-spacing: 2px;
                flex-grow: 1;
            }

            .nav-close-btn {
                background: none;
                border: none;
                color: #f8fafc;
                font-size: 24px;
                cursor: pointer;
                transition: all 0.2s;
                opacity: 0.7;
            }

            .nav-close-btn:hover {
                opacity: 1;
                transform: rotate(90deg);
            }

            /* MENU SCROLL AREA */
            .nav-menu-scroll {
                flex-grow: 1;
                overflow-y: auto;
                padding: 12px;
                scroll-behavior: smooth;
            }

            .nav-menu-scroll::-webkit-scrollbar {
                width: 6px;
            }

            .nav-menu-scroll::-webkit-scrollbar-track {
                background: rgba(99, 102, 241, 0.1);
                border-radius: 3px;
            }

            .nav-menu-scroll::-webkit-scrollbar-thumb {
                background: #6366f1;
                border-radius: 3px;
            }

            .nav-menu-scroll::-webkit-scrollbar-thumb:hover {
                background: #818cf8;
            }

            /* MENU ITEMS */
            .nav-menu-items {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .nav-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px 16px;
                background: rgba(99, 102, 241, 0.1);
                border: 2px solid transparent;
                border-radius: 8px;
                color: #f8fafc;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                font-weight: 500;
                font-size: 14px;
                position: relative;
                overflow: hidden;
            }

            .nav-item::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                width: 0;
                height: 100%;
                background: #6366f1;
                z-index: -1;
                transition: width 0.3s ease;
            }

            .nav-item:hover {
                border-color: #6366f1;
                background: rgba(99, 102, 241, 0.2);
                padding-left: 20px;
            }

            .nav-item:hover::before {
                width: 100%;
                opacity: 0.1;
            }

            .nav-item.active {
                background: #6366f1;
                border-color: #818cf8;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            }

            .nav-item-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .nav-item-text {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex-grow: 1;
            }

            .nav-item-name {
                font-weight: bold;
                letter-spacing: 0.5px;
            }

            .nav-item-desc {
                font-size: 11px;
                opacity: 0.7;
            }

            .nav-item.active .nav-item-desc {
                opacity: 0.9;
            }

            /* MENU FOOTER */
            .nav-menu-footer {
                padding: 16px 24px;
                border-top: 2px solid rgba(99, 102, 241, 0.2);
                flex-shrink: 0;
                background: rgba(15, 23, 42, 0.5);
            }

            .nav-footer-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #a1aec6;
            }

            .page-indicator {
                font-weight: bold;
                color: #6366f1;
                letter-spacing: 1px;
            }

            /* FLOATING BUTTONS */
            .floating-buttons {
                position: fixed;
                z-index: 997;
                display: flex;
                gap: 8px;
            }

            .top-buttons {
                top: 12px;
                left: 50%;
                transform: translateX(-50%);
                flex-direction: row;
            }

            .bottom-buttons {
                bottom: 12px;
                left: 50%;
                transform: translateX(-50%);
                flex-direction: row;
            }

            .left-buttons {
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                flex-direction: column;
            }

            .right-buttons {
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                flex-direction: column;
            }

            .nav-floating-btn {
                width: 48px;
                height: 48px;
                background: #6366f1;
                border: 2px solid rgba(99, 102, 241, 0.3);
                border-radius: 12px;
                color: white;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                position: relative;
                overflow: hidden;
            }

            .nav-floating-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.2);
                transition: left 0.3s;
            }

            .nav-floating-btn:hover {
                background: #818cf8;
                border-color: #6366f1;
                transform: scale(1.15) rotate(10deg);
                box-shadow: 0 8px 20px rgba(99, 102, 241, 0.6);
            }

            .nav-floating-btn:hover::before {
                left: 100%;
            }

            .nav-floating-btn:active {
                transform: scale(0.95);
            }

            .nav-floating-btn.primary {
                background: #ec4899;
                border-color: #f472b6;
            }

            .nav-floating-btn.primary:hover {
                background: #f472b6;
            }

            .nav-floating-btn.success {
                background: #10b981;
                border-color: #34d399;
            }

            .nav-floating-btn.success:hover {
                background: #34d399;
            }

            .nav-floating-btn.warning {
                background: #f59e0b;
                border-color: #fbbf24;
            }

            .nav-floating-btn.warning:hover {
                background: #fbbf24;
            }

            .nav-floating-btn.danger {
                background: #ef4444;
                border-color: #f87171;
            }

            .nav-floating-btn.danger:hover {
                background: #f87171;
            }

            /* TOOLTIP */
            .nav-floating-btn-tooltip {
                position: absolute;
                background: rgba(15, 23, 42, 0.95);
                color: #f8fafc;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 11px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 1000;
                border: 1px solid #6366f1;
                font-weight: 500;
            }

            .nav-floating-btn:hover .nav-floating-btn-tooltip {
                opacity: 1;
            }

            .top-buttons .nav-floating-btn:hover .nav-floating-btn-tooltip {
                bottom: 110%;
                left: 50%;
                transform: translateX(-50%);
            }

            .bottom-buttons .nav-floating-btn:hover .nav-floating-btn-tooltip {
                top: 110%;
                left: 50%;
                transform: translateX(-50%);
            }

            .left-buttons .nav-floating-btn:hover .nav-floating-btn-tooltip {
                left: 110%;
                top: 50%;
                transform: translateY(-50%);
            }

            .right-buttons .nav-floating-btn:hover .nav-floating-btn-tooltip {
                right: 110%;
                top: 50%;
                transform: translateY(-50%);
            }

            /* RESPONSIVE */
            @media (max-width: 768px) {
                #globalNavMenu {
                    width: 280px;
                    left: -280px;
                }

                .top-buttons, .bottom-buttons {
                    display: none;
                }

                .nav-floating-btn {
                    width: 42px;
                    height: 42px;
                    font-size: 18px;
                }

                .left-buttons {
                    left: 8px;
                    gap: 6px;
                }

                .right-buttons {
                    right: 8px;
                    gap: 6px;
                }
            }

            @media (max-width: 480px) {
                .left-buttons, .right-buttons {
                    display: none;
                }

                .top-buttons, .bottom-buttons {
                    display: flex !important;
                }
            }

            /* ANIMATIONS */
            @keyframes slideInLeft {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }

            .nav-item {
                animation: slideInLeft 0.3s ease forwards;
            }

            .nav-item:nth-child(1) { animation-delay: 0.05s; }
            .nav-item:nth-child(2) { animation-delay: 0.1s; }
            .nav-item:nth-child(3) { animation-delay: 0.15s; }
            .nav-item:nth-child(4) { animation-delay: 0.2s; }
            .nav-item:nth-child(5) { animation-delay: 0.25s; }
            .nav-item:nth-child(6) { animation-delay: 0.3s; }
            .nav-item:nth-child(7) { animation-delay: 0.35s; }
        `;
        document.head.appendChild(style);
    }

    populateMenuItems() {
        const items = [
            { icon: '📊', name: 'PORTAL', desc: 'Main dashboard', url: 'index.html', id: 'portal' },
            { icon: '💬', name: 'LIVE CHAT', desc: 'Real-time chat', url: 'chat.html', id: 'chat' },
            { icon: '📦', name: 'MODULES', desc: 'Module browser', url: 'modules_page.html', id: 'modules' },
            { icon: '❤️', name: 'CLAUDE', desc: 'Claude console', url: 'claude_console.html', id: 'claude' },
            { icon: '⚙️', name: 'ADMIN', desc: 'Admin console', url: 'console.html', id: 'console' },
            { icon: '📚', name: 'ARCHIVARIUS', desc: 'Archive viewer', url: 'archivarius.html', id: 'archivarius' },
            { icon: '🎯', name: 'PULSE', desc: 'System pulse', url: 'pulse_panel.html', id: 'pulse' },
            { icon: '🌀', name: 'BUILDER', desc: 'Build tool', url: 'builder.html', id: 'builder' },
        ];

        const itemsContainer = document.getElementById('navMenuItems');
        itemsContainer.innerHTML = items.map(item => `
            <a class="nav-item${this.currentPage === item.id ? ' active' : ''}" href="${item.url}">
                <span class="nav-item-icon">${item.icon}</span>
                <span class="nav-item-text">
                    <span class="nav-item-name">${item.name}</span>
                    <span class="nav-item-desc">${item.desc}</span>
                </span>
            </a>
        `).join('');

        // Update page name
        const pageNames = {
            'portal': 'PORTAL',
            'chat': 'LIVE CHAT',
            'modules': 'MODULES',
            'claude': 'CLAUDE',
            'console': 'ADMIN',
            'archivarius': 'ARCHIVARIUS',
            'pulse': 'PULSE',
            'builder': 'BUILDER'
        };
        document.getElementById('currentPageName').textContent = pageNames[this.currentPage] || 'UNKNOWN';
    }

    createFloatingButtons() {
        // TOP BUTTONS
        const topButtons = [
            { icon: '🏠', label: 'Home', url: 'index.html', class: '' },
            { icon: '📞', label: 'Support', url: '#', class: 'primary' },
            { icon: '⚡', label: 'Quick', url: '#', class: '' },
        ];

        // BOTTOM BUTTONS
        const bottomButtons = [
            { icon: '💾', label: 'Save', url: '#', class: 'success' },
            { icon: '🔄', label: 'Refresh', url: '#', class: '', onclick: 'location.reload()' },
            { icon: '⚙️', label: 'Settings', url: '#', class: 'warning' },
        ];

        // LEFT BUTTONS
        const leftButtons = [
            { icon: '☰', label: 'Menu', url: '#', class: '', onclick: 'window.globalNav.toggle()' },
            { icon: '⬆️', label: 'Top', url: '#', class: 'primary', onclick: 'window.scrollTo({top: 0, behavior: "smooth"})' },
        ];

        // RIGHT BUTTONS
        const rightButtons = [
            { icon: '⬇️', label: 'Bottom', url: '#', class: 'success', onclick: 'window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"})' },
            { icon: '🔍', label: 'Search', url: '#', class: 'warning' },
            { icon: '✕', label: 'Close', url: '#', class: 'danger', onclick: 'window.globalNav.close()' },
        ];

        this.renderButtons('topNavButtons', topButtons);
        this.renderButtons('bottomNavButtons', bottomButtons);
        this.renderButtons('leftNavButtons', leftButtons);
        this.renderButtons('rightNavButtons', rightButtons);
    }

    renderButtons(containerId, buttons) {
        const container = document.getElementById(containerId);
        container.innerHTML = buttons.map(btn => `
            <button 
                class="nav-floating-btn ${btn.class}"
                title="${btn.label}"
                onclick="${btn.onclick ? btn.onclick : `window.location.href='${btn.url}'`}"
            >
                ${btn.icon}
                <span class="nav-floating-btn-tooltip">${btn.label}</span>
            </button>
        `).join('');
    }

    attachEventListeners() {
        const overlay = document.getElementById('globalNavOverlay');
        overlay.addEventListener('click', () => this.close());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'm') this.toggle();
            if (e.key === 'Escape') this.close();
        });

        // Update time
        setInterval(() => {
            const now = new Date();
            document.getElementById('pageTime').textContent = 
                now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        const menu = document.getElementById('globalNavMenu');
        const overlay = document.getElementById('globalNavOverlay');
        menu.classList.add('open');
        overlay.classList.add('open');
        this.isOpen = true;
    }

    close() {
        const menu = document.getElementById('globalNavMenu');
        const overlay = document.getElementById('globalNavOverlay');
        menu.classList.remove('open');
        overlay.classList.remove('open');
        this.isOpen = false;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.globalNav = new GlobalNavMenu();
    });
} else {
    window.globalNav = new GlobalNavMenu();
}
