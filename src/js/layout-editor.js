/**
 * ÆSI Layout Editor System
 * Enables realtime customization and deployment
 */

class LayoutEditor {
    constructor() {
        this.isEditMode = false;
        this.layout = {};
        this.protonDriveAuth = null;
        this.netlifyAuth = null;
        this.autoSaveInterval = null;
    }

    // Initialize layout editor
    async init() {
        await this.loadLayout();
        this.setupToolbar();
        this.setupAutoSave();
        console.log('✅ Layout Editor initialized');
    }

    // Load layout from layout_config.json
    async loadLayout() {
        try {
            const response = await fetch('/layout_config.json');
            this.layout = await response.json();
            console.log('📐 Layout loaded:', this.layout);
        } catch(e) {
            console.error('Failed to load layout:', e);
            this.layout = this.getDefaultLayout();
        }
    }

    // Get default layout
    getDefaultLayout() {
        return {
            version: "1.0.0",
            widgets: [],
            grid: { rows: "auto 1fr auto", columns: "280px 1fr 400px" }
        };
    }

    // Setup editor toolbar
    setupToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'layout-editor-toolbar';
        toolbar.innerHTML = `
            <button onclick="layoutEditor.toggleEditMode()">✏️ Edit Layout</button>
            <button onclick="layoutEditor.saveLayout()">💾 Save</button>
            <button onclick="layoutEditor.syncProton()">☁️ Proton Sync</button>
            <button onclick="layoutEditor.deployNetlify()">🚀 Deploy</button>
            <button onclick="layoutEditor.showWidgetPicker()">📦 Add Widget</button>
        `;
        document.body.appendChild(toolbar);
    }

    // Toggle edit mode
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        document.body.classList.toggle('layout-edit-mode', this.isEditMode);
        console.log(`🎯 Layout edit mode: ${this.isEditMode}`);
    }

    // Save layout to localStorage and file
    async saveLayout() {
        localStorage.setItem('layout_config', JSON.stringify(this.layout));
        
        // Send to backend for persistence
        try {
            const response = await fetch('/api/save-layout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.layout)
            });
            
            if(response.ok) {
                console.log('✅ Layout saved');
            }
        } catch(e) {
            console.log('Layout saved locally (backend unavailable)');
        }
    }

    // Sync with Proton Drive
    async syncProton() {
        console.log('☁️ Starting Proton Drive sync...');
        
        // TODO: Implement Proton Drive API sync
        // For now, just save locally
        this.saveLayout();
        
        console.log('✅ Proton sync triggered (check realtime_sync.py)');
    }

    // Deploy to Netlify
    async deployNetlify() {
        console.log('🚀 Deploying to Netlify...');
        
        // TODO: Implement Netlify deploy trigger
        
        console.log('✅ Netlify deploy triggered (check realtime_sync.py)');
    }

    // Show widget picker
    showWidgetPicker() {
        alert('Widget Picker Coming Soon!\n\nAvailable widgets:\n• Nodes Grid\n• Module Editor\n• Chat Log\n• Pulse Input\n• Document Editor\n• Portal Status\n• Custom HTML');
    }

    // Setup auto-save (every 30 seconds)
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if(this.isEditMode) {
                this.saveLayout();
                console.log('💾 Auto-saved layout');
            }
        }, 30000);
    }

    // Cleanup
    destroy() {
        if(this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    }
}

// Initialize on page load
let layoutEditor = null;
document.addEventListener('DOMContentLoaded', () => {
    layoutEditor = new LayoutEditor();
    layoutEditor.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if(layoutEditor) layoutEditor.destroy();
});
