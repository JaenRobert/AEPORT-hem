/**
 * ═══════════════════════════════════════════════════════════════════
 * NAVIGATION HUB - Complete Page Navigation System
 * ═══════════════════════════════════════════════════════════════════
 * Manages all page connections, back/forward history, and navigation flow
 */

class NavigationHub {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 20;
        this.pageMap = this.createPageMap();
        this.init();
    }

    /**
     * Complete mapping of all pages with metadata
     */
    createPageMap() {
        return {
            'index.html': {
                title: '📊 PORTAL',
                emoji: '📊',
                description: 'Main Portal Dashboard',
                category: 'core',
                relatedPages: ['chat.html', 'modules_page.html', 'console.html', 'claude_console.html', 'archivarius.html', 'builder.html', 'portal.html'],
                canGoBack: false
            },
            'chat.html': {
                title: '💬 LIVE CHAT',
                emoji: '💬',
                description: 'Real-time Messaging System',
                category: 'communication',
                relatedPages: ['index.html', 'console.html'],
                canGoBack: true
            },
            'console.html': {
                title: '⚙️ ADMIN CONSOLE',
                emoji: '⚙️',
                description: 'Administration Panel',
                category: 'admin',
                relatedPages: ['index.html', 'chat.html', 'modules_page.html', 'claude_console.html'],
                canGoBack: true
            },
            'modules_page.html': {
                title: '📦 MODULES',
                emoji: '📦',
                description: 'Module Browser & Manager',
                category: 'modules',
                relatedPages: ['index.html', 'console.html', 'chat.html'],
                canGoBack: true
            },
            'claude_console.html': {
                title: '❤️ CLAUDE',
                emoji: '❤️',
                description: 'Claude AI Console',
                category: 'ai',
                relatedPages: ['index.html', 'modules_page.html', 'chat.html'],
                canGoBack: true
            },
            'archivarius.html': {
                title: '📚 ARCHIVARIUS',
                emoji: '📚',
                description: 'Archive Viewer & Manager',
                category: 'archive',
                relatedPages: ['index.html', 'console.html'],
                canGoBack: true
            },
            'builder.html': {
                title: '🎯 BUILDER',
                emoji: '🎯',
                description: 'Build & Create Tool',
                category: 'tools',
                relatedPages: ['index.html', 'console.html'],
                canGoBack: true
            },
            'portal.html': {
                title: '🌐 PORTAL ENTRY',
                emoji: '🌐',
                description: 'Portal Entry Point',
                category: 'core',
                relatedPages: ['index.html', 'portal_black.html'],
                canGoBack: false
            },
            'portal_black.html': {
                title: '🌙 PORTAL BLACK',
                emoji: '🌙',
                description: 'Dark Theme Portal',
                category: 'core',
                relatedPages: ['index.html', 'portal.html'],
                canGoBack: true
            },
            'pulse_panel.html': {
                title: '⚡ PULSE',
                emoji: '⚡',
                description: 'System Pulse & Status',
                category: 'monitor',
                relatedPages: ['index.html', 'console.html'],
                canGoBack: true
            }
        };
    }

    /**
     * Initialize navigation system
     */
    init() {
        // Get current page
        const currentPage = this.getCurrentPage();
        
        // Initialize history if not already set
        if (this.history.length === 0) {
            this.history.push(currentPage);
            this.currentIndex = 0;
        }

        // Track page changes
        window.addEventListener('load', () => this.trackPageLoad());
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => this.handlePopState(e));

        // Setup navigation UI
        this.setupNavigationUI();
    }

    /**
     * Get current page filename
     */
    getCurrentPage() {
        let pathname = window.location.pathname;
        return pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
    }

    /**
     * Track page loads and update history
     */
    trackPageLoad() {
        const currentPage = this.getCurrentPage();
        
        // Only add if different from last page in history
        if (this.history[this.currentIndex] !== currentPage) {
            this.history = this.history.slice(0, this.currentIndex + 1);
            this.history.push(currentPage);
            this.currentIndex++;
            
            if (this.history.length > this.maxHistory) {
                this.history.shift();
                this.currentIndex--;
            }
        }
        
        this.updateNavigationButtons();
    }

    /**
     * Handle browser back/forward
     */
    handlePopState(e) {
        this.updateNavigationButtons();
    }

    /**
     * Navigate to page
     */
    navigateTo(page) {
        if (!this.pageMap[page]) {
            console.warn(`⚠️ Unknown page: ${page}`);
            return;
        }

        // Check if different from current
        if (this.getCurrentPage() !== page) {
            window.location.href = '/' + page;
        }
    }

    /**
     * Go back in history
     */
    goBack() {
        if (this.canGoBack()) {
            this.currentIndex--;
            const page = this.history[this.currentIndex];
            window.location.href = '/' + page;
        }
    }

    /**
     * Go forward in history
     */
    goForward() {
        if (this.canGoForward()) {
            this.currentIndex++;
            const page = this.history[this.currentIndex];
            window.location.href = '/' + page;
        }
    }

    /**
     * Check if can go back
     */
    canGoBack() {
        return this.currentIndex > 0;
    }

    /**
     * Check if can go forward
     */
    canGoForward() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Go to home (index.html)
     */
    goHome() {
        window.location.href = '/index.html';
    }

    /**
     * Get page info
     */
    getPageInfo(page) {
        return this.pageMap[page] || null;
    }

    /**
     * Get all pages
     */
    getAllPages() {
        return Object.keys(this.pageMap);
    }

    /**
     * Get related pages for current page
     */
    getRelatedPages() {
        const currentPage = this.getCurrentPage();
        return this.pageMap[currentPage]?.relatedPages || [];
    }

    /**
     * Setup navigation UI elements
     */
    setupNavigationUI() {
        // Create navigation bar if it doesn't exist
        const existingNav = document.getElementById('aesi-nav-bar');
        if (existingNav) return; // Already exists

        const navBar = document.createElement('nav');
        navBar.id = 'aesi-nav-bar';
        navBar.className = 'aesi-navigation-bar';
        navBar.innerHTML = `
            <div class="aesi-nav-container">
                <!-- Back/Forward Controls -->
                <div class="aesi-nav-controls">
                    <button id="aesi-nav-back" class="aesi-nav-btn aesi-nav-back-btn" title="Go Back (Alt+←)">
                        <span class="aesi-nav-icon">←</span>
                        <span class="aesi-nav-label">Back</span>
                    </button>
                    <button id="aesi-nav-forward" class="aesi-nav-btn aesi-nav-forward-btn" title="Go Forward (Alt+→)">
                        <span class="aesi-nav-icon">→</span>
                        <span class="aesi-nav-label">Forward</span>
                    </button>
                    <button id="aesi-nav-home" class="aesi-nav-btn aesi-nav-home-btn" title="Go Home (Alt+H)">
                        <span class="aesi-nav-icon">🏠</span>
                        <span class="aesi-nav-label">Home</span>
                    </button>
                </div>

                <!-- Current Page Info -->
                <div class="aesi-nav-current">
                    <span id="aesi-current-page-icon" class="aesi-page-icon">📊</span>
                    <div class="aesi-page-info">
                        <span id="aesi-current-page-title" class="aesi-page-title">PORTAL</span>
                        <span id="aesi-current-page-desc" class="aesi-page-desc">Main Portal Dashboard</span>
                    </div>
                </div>

                <!-- Menu Button -->
                <div class="aesi-nav-menu">
                    <button id="aesi-nav-menu-btn" class="aesi-nav-btn aesi-nav-menu-btn" title="Menu (Alt+M)">
                        <span class="aesi-nav-icon">☰</span>
                        <span class="aesi-nav-label">Menu</span>
                    </button>
                </div>
            </div>
        `;

        // Insert at top of body
        document.body.insertBefore(navBar, document.body.firstChild);

        // Add event listeners
        this.attachEventListeners();

        // Update button states
        this.updateNavigationButtons();
    }

    /**
     * Attach event listeners to navigation buttons
     */
    attachEventListeners() {
        const backBtn = document.getElementById('aesi-nav-back');
        const forwardBtn = document.getElementById('aesi-nav-forward');
        const homeBtn = document.getElementById('aesi-nav-home');
        const menuBtn = document.getElementById('aesi-nav-menu-btn');

        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
            backBtn.addEventListener('dblclick', () => {
                while (this.canGoBack()) this.goBack();
            });
        }

        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => this.goForward());
            forwardBtn.addEventListener('dblclick', () => {
                while (this.canGoForward()) this.goForward();
            });
        }

        if (homeBtn) {
            homeBtn.addEventListener('click', () => this.goHome());
        }

        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.openPageMenu());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                if (e.key === 'ArrowLeft') { e.preventDefault(); this.goBack(); }
                if (e.key === 'ArrowRight') { e.preventDefault(); this.goForward(); }
                if (e.key === 'h' || e.key === 'H') { e.preventDefault(); this.goHome(); }
                if (e.key === 'm' || e.key === 'M') { e.preventDefault(); this.openPageMenu(); }
            }
        });
    }

    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        const backBtn = document.getElementById('aesi-nav-back');
        const forwardBtn = document.getElementById('aesi-nav-forward');
        const currentPage = this.getCurrentPage();
        const pageInfo = this.getPageInfo(currentPage);

        // Update back button
        if (backBtn) {
            if (this.canGoBack()) {
                backBtn.classList.remove('disabled');
                backBtn.title = `Go Back (Alt+←) - ${this.history[this.currentIndex - 1]}`;
            } else {
                backBtn.classList.add('disabled');
                backBtn.title = 'Go Back (disabled)';
            }
        }

        // Update forward button
        if (forwardBtn) {
            if (this.canGoForward()) {
                forwardBtn.classList.remove('disabled');
                forwardBtn.title = `Go Forward (Alt+→) - ${this.history[this.currentIndex + 1]}`;
            } else {
                forwardBtn.classList.add('disabled');
                forwardBtn.title = 'Go Forward (disabled)';
            }
        }

        // Update current page info
        if (pageInfo) {
            const icon = document.getElementById('aesi-current-page-icon');
            const title = document.getElementById('aesi-current-page-title');
            const desc = document.getElementById('aesi-current-page-desc');

            if (icon) icon.textContent = pageInfo.emoji;
            if (title) title.textContent = pageInfo.title;
            if (desc) desc.textContent = pageInfo.description;
        }
    }

    /**
     * Open page menu modal
     */
    openPageMenu() {
        // Check if menu already exists
        let modal = document.getElementById('aesi-page-menu-modal');
        if (!modal) {
            modal = this.createPageMenuModal();
        }

        modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    }

    /**
     * Create page menu modal
     */
    createPageMenuModal() {
        const modal = document.createElement('div');
        modal.id = 'aesi-page-menu-modal';
        modal.className = 'aesi-page-menu-modal';
        
        const pages = this.getAllPages();
        const currentPage = this.getCurrentPage();
        
        let menuHTML = `
            <div class="aesi-page-menu-content">
                <div class="aesi-page-menu-header">
                    <h3>📖 PAGE MENU</h3>
                    <button class="aesi-menu-close" onclick="document.getElementById('aesi-page-menu-modal').style.display='none'">✕</button>
                </div>
                <div class="aesi-page-menu-list">
        `;

        // Organize pages by category
        const categories = {};
        pages.forEach(page => {
            const info = this.getPageInfo(page);
            if (info) {
                if (!categories[info.category]) {
                    categories[info.category] = [];
                }
                categories[info.category].push({ page, info });
            }
        });

        // Build menu with categories
        Object.keys(categories).sort().forEach(category => {
            menuHTML += `<div class="aesi-menu-category"><strong>${category.toUpperCase()}</strong></div>`;
            categories[category].forEach(({ page, info }) => {
                const isActive = page === currentPage ? 'active' : '';
                menuHTML += `
                    <button class="aesi-menu-item ${isActive}" onclick="window.navigationHub.navigateTo('${page}')">
                        <span class="aesi-menu-emoji">${info.emoji}</span>
                        <span class="aesi-menu-title">${info.title}</span>
                        <span class="aesi-menu-desc">${info.description}</span>
                    </button>
                `;
            });
        });

        menuHTML += `
                </div>
                <div class="aesi-page-menu-footer">
                    <small>💡 Use Alt+M to toggle menu | Alt+← Back | Alt+→ Forward | Alt+H Home</small>
                </div>
            </div>
        `;

        modal.innerHTML = menuHTML;
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Get navigation history for debugging
     */
    getHistory() {
        return {
            history: this.history,
            currentIndex: this.currentIndex,
            currentPage: this.history[this.currentIndex]
        };
    }
}

// Initialize global navigation hub
window.navigationHub = new NavigationHub();

// Expose methods globally
window.navigateTo = (page) => window.navigationHub.navigateTo(page);
window.goBack = () => window.navigationHub.goBack();
window.goForward = () => window.navigationHub.goForward();
window.goHome = () => window.navigationHub.goHome();

console.log('✅ Navigation Hub initialized');
