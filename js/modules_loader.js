/**
 * ÆSI MODULES LOADER v2.0
 * Universal module discovery and metadata management
 * Auto-discovers ALL modules: UI, System, Projects, Tools, Experimental
 */

const AesiModulesLoader = {
  // ===== STATE =====
  allModules: [],
  favorites: JSON.parse(localStorage.getItem('aesi_module_favorites')) || [],
  recentlyUsed: JSON.parse(localStorage.getItem('aesi_module_recent')) || [],
  moduleMetadata: {},
  categories: {
    'AI_NODES': { icon: '🤖', label: 'AI Nodes', description: 'LLM Integration & AI Nodes' },
    'UI_MODULES': { icon: '🎨', label: 'UI Modules', description: 'Visual Components & Interfaces' },
    'SYSTEM': { icon: '⚙️', label: 'System', description: 'Core System & Monitoring' },
    'PROJECT': { icon: '📁', label: 'Projects', description: 'Project Modules' },
    'TOOL': { icon: '🔧', label: 'Tools', description: 'Utilities & Tools' },
    'EXPERIMENTAL': { icon: '🧪', label: 'Experimental', description: 'Beta Features' }
  },

  // ===== INITIALIZATION =====
  async init() {
    console.log('🚀 AesiModulesLoader initializing...');
    
    // Load metadata first
    await this.loadModuleMetadata();
    
    await this.discoverModules();
    this.attachKeyboardShortcuts();
    this.syncWithProjects();
    console.log(`✅ Loaded ${this.allModules.length} modules`);
  },

  // ===== LOAD METADATA =====
  async loadModuleMetadata() {
    try {
      const response = await fetch('/module_metadata.json');
      if (response.ok) {
        const data = await response.json();
        this.moduleMetadata = data.metadata || {};
      }
    } catch (e) {
      console.warn('Could not load module_metadata.json:', e.message);
    }
  },

  // ===== DISCOVERY ENGINE =====
  async discoverModules() {
    this.allModules = [];

    // 1. SCAN /modules/ FOLDER (HTML modules + legacy nodes)
    const htmlModules = await this.scanHtmlModules();
    this.allModules.push(...htmlModules);

    // 2. SCAN /projects/ FOLDER (Project modules)
    const projectModules = await this.scanProjectModules();
    this.allModules.push(...projectModules);

    // 3. SYSTEM MODULES (Built-in)
    const systemModules = this.getSystemModules();
    this.allModules.push(...systemModules);

    // 4. FALLBACK: Load from modules_catalog.json
    const catalogModules = await this.loadCatalogModules();
    this.allModules.push(...catalogModules);

    // 5. DEDUP and sort
    this.allModules = this.deduplicateModules(this.allModules);
    this.sortModules();

    // Save index to localStorage
    localStorage.setItem('aesi_modules_index', JSON.stringify(
      this.allModules.map(m => ({ id: m.id, name: m.name, category: m.category }))
    ));
  },

  // ===== SCANNER: HTML MODULES =====
  async scanHtmlModules() {
    const modules = [];
    const htmlFiles = [
      'realtime_chat.html',
      'claude.html',
      'chatgpt.html',
      'reflex.html',
      'hafted.html',
      'smile.html',
      'ernie.html'
    ];

    for (const file of htmlFiles) {
      try {
        const response = await fetch(`/modules/${file}`);
        if (response.ok) {
          const html = await response.text();
          const metadata = this.extractHtmlMetadata(file, html);
          modules.push(metadata);
        }
      } catch (e) {
        console.warn(`Could not load module ${file}:`, e.message);
      }
    }

    return modules;
  },

  // ===== SCANNER: PROJECT MODULES =====
  async scanProjectModules() {
    const modules = [];
    
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const projects = await response.json();
        for (const proj of projects) {
          try {
            const metaResponse = await fetch(`/projects/${proj.id}/.aesi.json`);
            if (metaResponse.ok) {
              const metadata = await metaResponse.json();
              modules.push({
                id: `project-${proj.id}`,
                name: metadata.name || proj.id,
                description: metadata.description || 'Project module',
                type: 'PROJECT',
                category: 'PROJECT',
                icon: metadata.icon || '📁',
                color: metadata.color || '#6366f1',
                path: `/projects/${proj.id}/`,
                module: proj.id,
                tags: metadata.tags || []
              });
            }
          } catch (e) {
            console.warn(`Could not load project ${proj.id}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.warn('Project discovery unavailable (using fallback):', e.message);
    }

    return modules;
  },

  // ===== SYSTEM MODULES (Built-in) =====
  getSystemModules() {
    return [
      {
        id: 'portal-status',
        name: 'Portal Status',
        description: 'Real-time portal health monitoring',
        type: 'SYSTEM',
        category: 'SYSTEM',
        icon: '📊',
        color: '#8b5cf6',
        tags: ['monitoring', 'status']
      },
      {
        id: 'node-monitor',
        name: 'Node Monitor',
        description: 'Monitor all AI nodes in real-time',
        type: 'SYSTEM',
        category: 'SYSTEM',
        icon: '🔍',
        color: '#06b6d4',
        tags: ['monitoring', 'nodes']
      },
      {
        id: 'activity-log',
        name: 'Activity Log',
        description: 'System event and activity tracking',
        type: 'SYSTEM',
        category: 'SYSTEM',
        icon: '📝',
        color: '#10b981',
        tags: ['logging', 'events']
      },
      {
        id: 'file-watcher',
        name: 'File Watcher',
        description: 'Monitor file changes in real-time',
        type: 'SYSTEM',
        category: 'SYSTEM',
        icon: '👁️',
        color: '#f59e0b',
        tags: ['monitoring', 'files']
      },
      {
        id: 'connection-status',
        name: 'Connection Status',
        description: 'Backend connection health',
        type: 'SYSTEM',
        category: 'SYSTEM',
        icon: '🌐',
        color: '#3b82f6',
        tags: ['connection', 'status']
      },
      {
        id: 'module-catalog',
        name: 'Module Catalog',
        description: 'Browse and manage all modules',
        type: 'SYSTEM',
        category: 'SYSTEM',
        icon: '📦',
        color: '#ec4899',
        tags: ['modules', 'catalog']
      }
    ];
  },

  // ===== EXTRACT METADATA FROM HTML =====
  extractHtmlMetadata(filename, html) {
    const id = filename.replace('.html', '');
    
    // Try to load from module_metadata.json first (NEW)
    if (this.moduleMetadata[id]) {
      return {
        ...this.moduleMetadata[id],
        path: `/modules/${filename}`
      };
    }

    // Try to extract from HTML comment metadata
    const metaMatch = html.match(/<!--\s*@aesi\s*([\s\S]*?)\s*-->/);
    if (metaMatch) {
      try {
        const metadata = JSON.parse(metaMatch[1]);
        return {
          id,
          name: metadata.name || this.formatName(id),
          description: metadata.description || 'HTML module',
          type: metadata.type || 'UI',
          category: metadata.category || 'UI_MODULES',
          icon: metadata.icon || '🎨',
          color: metadata.color || '#6366f1',
          path: `/modules/${filename}`,
          tags: metadata.tags || []
        };
      } catch (e) {
        // Fall back to basic extraction
      }
    }

    // Fallback: extract from HTML title or filename
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1] : this.formatName(id);

    return {
      id,
      name: title,
      description: `Module: ${id}`,
      type: 'UI',
      category: this.categorizeModule(id),
      icon: this.getModuleIcon(id),
      color: this.getModuleColor(id),
      path: `/modules/${filename}`,
      tags: [id]
    };
  },

  // ===== LOAD FROM CATALOG.JSON =====
  async loadCatalogModules() {
    const modules = [];
    try {
      const response = await fetch('/modules_catalog.json');
      if (response.ok) {
        const catalog = await response.json();
        
        // Convert catalog entries to module objects
        for (const [key, moduleData] of Object.entries(catalog.modules || {})) {
          modules.push({
            id: key,
            name: moduleData.name || key,
            description: moduleData.description || '',
            type: 'SYSTEM',
            category: this.mapCatalogCategory(moduleData.category),
            icon: catalog.categories?.[moduleData.category]?.icon || '⚙️',
            color: this.getCatalogColor(moduleData.category),
            path: null,
            tags: moduleData.tags || [],
            status: moduleData.status
          });
        }
      }
    } catch (e) {
      console.warn('Could not load catalog:', e.message);
    }
    return modules;
  },

  // ===== HELPERS: Category & Color =====
  categorizeModule(id) {
    if (id.includes('node') || id === 'reflex' || id === 'claude' || id === 'hafted' || id === 'smile' || id === 'ernie' || id === 'chatgpt') {
      return 'AI_NODES';
    }
    if (id.includes('chat') || id.includes('panel')) return 'UI_MODULES';
    if (id.includes('monitor') || id.includes('status') || id.includes('log')) return 'SYSTEM';
    if (id.includes('project')) return 'PROJECT';
    if (id.includes('tool')) return 'TOOL';
    return 'EXPERIMENTAL';
  },

  mapCatalogCategory(catalogCat) {
    const mapping = {
      'core': 'SYSTEM',
      'governance': 'SYSTEM',
      'generation': 'UI_MODULES',
      'processing': 'SYSTEM',
      'interface': 'UI_MODULES',
      'monitoring': 'SYSTEM',
      'optimization': 'TOOL',
      'external': 'TOOL',
      'application': 'UI_MODULES'
    };
    return mapping[catalogCat] || 'SYSTEM';
  },

  getModuleIcon(id) {
    const iconMap = {
      'realtime_chat': '💬',
      'claude': '❤️',
      'reflex': '🧠',
      'hafted': '📚',
      'smile': '😊',
      'ernie': '🏗️',
      'chatgpt': '🔵',
      'portal': '🜂',
      'monitor': '📊',
      'log': '📝'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (id.includes(key)) return icon;
    }
    return '📦';
  },

  getModuleColor(id) {
    const colorMap = {
      'claude': '#ef4444',
      'reflex': '#3b82f6',
      'hafted': '#78716c',
      'smile': '#eab308',
      'ernie': '#10b981',
      'chatgpt': '#00a67e',
      'realtime': '#10a37f',
      'system': '#8b5cf6',
      'portal': '#6366f1'
    };

    for (const [key, color] of Object.entries(colorMap)) {
      if (id.includes(key)) return color;
    }
    return '#6366f1';
  },

  getCatalogColor(category) {
    const colors = {
      'core': '#8b5cf6',
      'governance': '#f59e0b',
      'generation': '#10b981',
      'processing': '#06b6d4',
      'interface': '#6366f1',
      'monitoring': '#ef4444',
      'optimization': '#3b82f6',
      'external': '#ec4899',
      'application': '#14b8a6'
    };
    return colors[category] || '#6366f1';
  },

  formatName(id) {
    return id
      .split(/[-_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  },

  // ===== DEDUPLICATION =====
  deduplicateModules(modules) {
    const seen = new Set();
    return modules.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  },

  // ===== SORTING =====
  sortModules() {
    const categoryOrder = ['AI_NODES', 'UI_MODULES', 'SYSTEM', 'PROJECT', 'TOOL', 'EXPERIMENTAL'];
    
    this.allModules.sort((a, b) => {
      const catA = categoryOrder.indexOf(a.category);
      const catB = categoryOrder.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      return a.name.localeCompare(b.name);
    });
  },

  // ===== PROJECT SYNC =====
  syncWithProjects() {
    if (window.AesiProjects) {
      window.AesiProjects.on?.('project-loaded', (projectId) => {
        this.addRecentlyUsed(projectId);
      });
    }
  },

  // ===== FAVORITE MANAGEMENT =====
  toggleFavorite(moduleId) {
    const idx = this.favorites.indexOf(moduleId);
    if (idx >= 0) {
      this.favorites.splice(idx, 1);
    } else {
      this.favorites.push(moduleId);
    }
    localStorage.setItem('aesi_module_favorites', JSON.stringify(this.favorites));
    this.dispatchEvent('favorites-changed', { favorites: this.favorites });
  },

  isFavorite(moduleId) {
    return this.favorites.includes(moduleId);
  },

  // ===== RECENTLY USED =====
  addRecentlyUsed(moduleId) {
    // Remove if already exists
    const idx = this.recentlyUsed.indexOf(moduleId);
    if (idx >= 0) this.recentlyUsed.splice(idx, 1);
    
    // Add to front
    this.recentlyUsed.unshift(moduleId);
    
    // Keep only last 10
    if (this.recentlyUsed.length > 10) {
      this.recentlyUsed.pop();
    }
    
    localStorage.setItem('aesi_module_recent', JSON.stringify(this.recentlyUsed));
    this.dispatchEvent('recently-used-changed', { recent: this.recentlyUsed });
  },

  getRecentlyUsed() {
    return this.recentlyUsed
      .map(id => this.allModules.find(m => m.id === id))
      .filter(m => m);
  },

  // ===== LOADING & INJECTION =====
  async loadModule(moduleId, zone = 'MIDDLE') {
    const module = this.getModule(moduleId);
    if (!module) {
      console.error(`Module not found: ${moduleId}`);
      return null;
    }

    this.addRecentlyUsed(moduleId);

    if (module.path) {
      // HTML module
      return this.loadHtmlModule(module, zone);
    } else if (module.category === 'SYSTEM') {
      // System module
      return this.renderSystemModule(moduleId, zone);
    } else if (module.category === 'PROJECT') {
      // Project module
      if (window.AesiProjects) {
        return window.AesiProjects.loadProject(module.module, zone);
      }
    }

    return null;
  },

  async loadHtmlModule(module, zone) {
    try {
      const response = await fetch(module.path);
      if (response.ok) {
        const html = await response.text();
        
        // Inject into zone or create container
        const container = document.querySelector(`#zone-${zone}`) || 
                         document.querySelector('.zone-modules') ||
                         document.body;

        const wrapper = document.createElement('div');
        wrapper.id = `module-${module.id}`;
        wrapper.className = 'module-container';
        wrapper.innerHTML = html;
        wrapper.style.cssText = `
          border: 2px solid ${module.color};
          border-radius: 8px;
          padding: 12px;
          margin: 8px;
          background: #1a1a1a;
          flex: 1;
          overflow: auto;
        `;

        container.appendChild(wrapper);

        // Execute any scripts
        const scripts = wrapper.querySelectorAll('script');
        scripts.forEach(script => {
          const newScript = document.createElement('script');
          newScript.textContent = script.textContent;
          wrapper.appendChild(newScript);
        });

        return wrapper;
      }
    } catch (e) {
      console.error(`Failed to load module ${module.id}:`, e);
    }
    return null;
  },

  renderSystemModule(moduleId, zone) {
    // Return HTML for system modules
    const module = this.getModule(moduleId);
    const html = `
      <div class="system-module" id="${moduleId}">
        <div style="padding: 16px; background: #0a0a0a; border-radius: 8px; color: #d4d4d4;">
          <div style="font-size: 24px; margin-bottom: 8px;">${module.icon}</div>
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: white;">${module.name}</h3>
          <p style="margin: 0; font-size: 12px; color: #888;">${module.description}</p>
          <div style="margin-top: 12px; padding: 8px; background: #111; border-radius: 4px; font-size: 11px; color: #666;">
            Loading system module: <strong>${moduleId}</strong>...
          </div>
        </div>
      </div>
    `;
    
    const container = document.querySelector(`#zone-${zone}`);
    if (container) {
      container.innerHTML = html;
    }
    
    return document.querySelector(`#${moduleId}`);
  },

  // ===== GETTERS =====
  getModule(moduleId) {
    return this.allModules.find(m => m.id === moduleId);
  },

  getModulesByCategory(category) {
    return this.allModules.filter(m => m.category === category);
  },

  getModulesByTag(tag) {
    return this.allModules.filter(m => m.tags?.includes(tag));
  },

  search(query) {
    const q = query.toLowerCase();
    return this.allModules.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.tags?.some(t => t.toLowerCase().includes(q))
    );
  },

  fuzzySearch(query) {
    // Simple fuzzy search: match consecutive chars
    const q = query.toLowerCase();
    return this.allModules.filter(m => {
      const name = m.name.toLowerCase();
      let qi = 0;
      for (let i = 0; i < name.length && qi < q.length; i++) {
        if (name[i] === q[qi]) qi++;
      }
      return qi === q.length;
    }).sort((a, b) => {
      // Prioritize matches that occur earlier
      return a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q);
    });
  },

  // ===== EVENT BUS =====
  eventListeners: {},

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  },

  dispatchEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => cb(data));
    }
  },

  // ===== KEYBOARD SHORTCUTS =====
  attachKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+P or Cmd+P: Open module fuzzy finder
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        this.showQuickLauncher();
      }

      // Ctrl+Shift+M: Open module browser
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'm') {
        e.preventDefault();
        window.location.href = 'modules_page.html';
      }
    });
  },

  // ===== QUICK LAUNCHER (Ctrl+P) =====
  showQuickLauncher() {
    if (document.querySelector('#aesi-quick-launcher')) {
      document.querySelector('#aesi-quick-launcher').remove();
      return;
    }

    const launcher = document.createElement('div');
    launcher.id = 'aesi-quick-launcher';
    launcher.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          <div style="padding: 12px; border-bottom: 1px solid #333;">
            <input id="launcher-search" type="text" placeholder="🔍 Search modules..." style="width: 100%; background: #111; color: white; border: 1px solid #333; padding: 8px; border-radius: 4px; font-size: 14px; outline: none;" autofocus>
          </div>
          <div id="launcher-results" style="max-height: 400px; overflow-y: auto; padding: 8px;">
            <!-- Results injected here -->
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(launcher);

    const input = document.querySelector('#launcher-search');
    const results = document.querySelector('#launcher-results');

    const updateResults = () => {
      const query = input.value;
      const matches = query ? this.fuzzySearch(query) : this.allModules.slice(0, 20);
      
      results.innerHTML = matches.map(m => `
        <div onclick="AesiModulesLoader.loadModule('${m.id}'); document.querySelector('#aesi-quick-launcher').remove();" style="padding: 8px 12px; border-bottom: 1px solid #222; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#262626'" onmouseout="this.style.background='transparent'">
          <span style="font-size: 18px;">${m.icon}</span>
          <div>
            <div style="color: white; font-weight: 500;">${m.name}</div>
            <div style="color: #888; font-size: 12px;">${m.description}</div>
          </div>
        </div>
      `).join('');
    };

    input.addEventListener('input', () => updateResults());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        launcher.remove();
      }
    });

    updateResults();
  }
};

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AesiModulesLoader.init());
} else {
  AesiModulesLoader.init();
}
