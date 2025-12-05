// ÆSI Navigation Hub - Complete Navigation System
class NavigationHub {
  constructor() {
    this.currentPage = this.detectCurrentPage();
    this.history = [this.currentPage];
    this.historyIndex = 0;
    this.maxHistory = 20;
    this.pageMap = this.createPageMap();
    this.init();
  }

  createPageMap() {
    return {
      'index.html': {
        name: 'Hem',
        category: 'main',
        description: 'Huvudportal och översikt',
        icon: '🏠'
      },
      'portal.html': {
        name: 'AI Portal',
        category: 'ai',
        description: 'AI-interaktion och chatt',
        icon: '🧠'
      },
      'chat.html': {
        name: 'Chatt',
        category: 'ai',
        description: 'Direkt AI-kommunikation',
        icon: '💬'
      },
      'console.html': {
        name: 'Konsol',
        category: 'admin',
        description: 'Administratörskonsol',
        icon: '⚙️'
      },
      'claude_console.html': {
        name: 'Claude Konsol',
        category: 'ai',
        description: 'Claude AI-specialiserad konsol',
        icon: '🤖'
      },
      'builder.html': {
        name: 'Byggare',
        category: 'tools',
        description: 'Sidbyggare och verktyg',
        icon: '🔨'
      },
      'modules_page.html': {
        name: 'Moduler',
        category: 'admin',
        description: 'Modulhantering',
        icon: '📦'
      },
      'archivarius.html': {
        name: 'Arkiv',
        category: 'data',
        description: 'Arkiv och historik',
        icon: '📚'
      },
      'portal_black.html': {
        name: 'Svart Portal',
        category: 'special',
        description: 'Avancerad åtkomst',
        icon: '⚫'
      }
    };
  }

  detectCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename;
  }

  init() {
    this.setupNavigationUI();
    this.attachEventListeners();
    this.updateNavigationButtons();
    console.log('✅ ÆSI Navigation Hub initialized');
  }

  setupNavigationUI() {
    const navHTML = `
      <nav class="aesi-navigation-bar">
        <div class="aesi-nav-container">
          <div class="aesi-nav-controls">
            <button class="aesi-nav-btn" id="nav-back" title="Tillbaka (Alt+←)">
              ← Tillbaka
            </button>
            <button class="aesi-nav-btn" id="nav-forward" title="Framåt (Alt+→)">
              Framåt →
            </button>
            <button class="aesi-nav-btn" id="nav-home" title="Hem (Alt+H)">
              🏠 Hem
            </button>
          </div>
          
          <div class="aesi-nav-current">
            <span class="current-page-info">
              ${this.pageMap[this.currentPage]?.icon || '📄'} 
              ${this.pageMap[this.currentPage]?.name || this.currentPage}
            </span>
          </div>
          
          <div class="aesi-nav-menu">
            <button class="aesi-nav-btn" id="nav-menu" title="Sidomeny (Alt+M)">
              ☰ Sidor
            </button>
          </div>
        </div>
        
        <div class="aesi-page-menu-modal" id="page-menu-modal" style="display: none;">
          <div class="aesi-page-menu-content">
            <div class="aesi-page-menu-header">
              <h3>Navigera till sida</h3>
              <button class="close-menu" id="close-menu">×</button>
            </div>
            <div class="aesi-page-menu-list">
              ${this.createPageMenuModal()}
            </div>
          </div>
        </div>
      </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }

  createPageMenuModal() {
    const categories = {};
    
    Object.entries(this.pageMap).forEach(([page, info]) => {
      if (!categories[info.category]) {
        categories[info.category] = [];
      }
      categories[info.category].push({ page, ...info });
    });

    let html = '';
    Object.entries(categories).forEach(([category, pages]) => {
      html += `<div class="aesi-menu-category">${this.getCategoryName(category)}</div>`;
      pages.forEach(({ page, name, description, icon }) => {
        const isCurrent = page === this.currentPage;
        html += `
          <div class="aesi-menu-item ${isCurrent ? 'current' : ''}" data-page="${page}">
            <span class="menu-icon">${icon}</span>
            <div class="menu-text">
              <div class="menu-name">${name}</div>
              <div class="menu-desc">${description}</div>
            </div>
            ${isCurrent ? '<span class="current-indicator">✓</span>' : ''}
          </div>
        `;
      });
    });

    return html;
  }

  getCategoryName(category) {
    const names = {
      'main': '🏠 Huvud',
      'ai': '🤖 AI & Chatt',
      'admin': '⚙️ Administration',
      'tools': '🔨 Verktyg',
      'data': '📊 Data',
      'special': '⭐ Special'
    };
    return names[category] || category;
  }

  attachEventListeners() {
    // Navigation buttons
    document.getElementById('nav-back')?.addEventListener('click', () => this.goBack());
    document.getElementById('nav-forward')?.addEventListener('click', () => this.goForward());
    document.getElementById('nav-home')?.addEventListener('click', () => this.goHome());
    document.getElementById('nav-menu')?.addEventListener('click', () => this.openPageMenu());

    // Menu modal
    document.getElementById('close-menu')?.addEventListener('click', () => this.closePageMenu());
    document.getElementById('page-menu-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'page-menu-modal') this.closePageMenu();
    });

    // Menu items
    document.querySelectorAll('.aesi-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const page = e.currentTarget.dataset.page;
        if (page) {
          this.navigateTo(page);
          this.closePageMenu();
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.goBack();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.goForward();
            break;
          case 'h':
          case 'H':
            e.preventDefault();
            this.goHome();
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            this.openPageMenu();
            break;
        }
      }
    });

    // Browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.currentPage = this.detectCurrentPage();
      this.updateNavigationButtons();
    });
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const page = this.history[this.historyIndex];
      this.navigateTo(page, false);
    }
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const page = this.history[this.historyIndex];
      this.navigateTo(page, false);
    }
  }

  goHome() {
    this.navigateTo('index.html');
  }

  navigateTo(page, addToHistory = true) {
    if (addToHistory) {
      // Remove future history if going to new page
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(page);
      this.historyIndex = this.history.length - 1;

      // Limit history size
      if (this.history.length > this.maxHistory) {
        this.history.shift();
        this.historyIndex--;
      }
    }

    this.currentPage = page;
    window.location.href = page;
    this.updateNavigationButtons();
  }

  openPageMenu() {
    const modal = document.getElementById('page-menu-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  closePageMenu() {
    const modal = document.getElementById('page-menu-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  updateNavigationButtons() {
    const backBtn = document.getElementById('nav-back');
    const forwardBtn = document.getElementById('nav-forward');
    const currentInfo = document.querySelector('.current-page-info');

    if (backBtn) {
      backBtn.classList.toggle('disabled', this.historyIndex <= 0);
    }

    if (forwardBtn) {
      forwardBtn.classList.toggle('disabled', this.historyIndex >= this.history.length - 1);
    }

    if (currentInfo && this.pageMap[this.currentPage]) {
      currentInfo.innerHTML = `
        ${this.pageMap[this.currentPage].icon} 
        ${this.pageMap[this.currentPage].name}
      `;
    }
  }
}

// Global functions for external access
window.navigateTo = (page) => {
  if (window.aesiNavigation) {
    window.aesiNavigation.navigateTo(page);
  }
};

window.goBack = () => {
  if (window.aesiNavigation) {
    window.aesiNavigation.goBack();
  }
};

window.goForward = () => {
  if (window.aesiNavigation) {
    window.aesiNavigation.goForward();
  }
};

window.goHome = () => {
  if (window.aesiNavigation) {
    window.aesiNavigation.goHome();
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.aesiNavigation = new NavigationHub();
});
