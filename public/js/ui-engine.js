/**
 * ÆSI UI Engine
 * Handles drag & drop module loading
 */

class AESIUIEngine {
  constructor() {
    this.modules = new Map();
    this.canvas = null;
  }
  
  init(canvasSelector) {
    this.canvas = document.querySelector(canvasSelector);
    if (!this.canvas) {
      console.error('Canvas not found:', canvasSelector);
      return;
    }
    
    this.setupDragAndDrop();
    this.loadSavedLayout();
  }
  
  setupDragAndDrop() {
    // Setup draggable blocks
    document.querySelectorAll('.aesi-block').forEach(block => {
      block.setAttribute('draggable', 'true');
      
      block.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('module', block.dataset.module);
        block.classList.add('dragging');
      });
      
      block.addEventListener('dragend', () => {
        block.classList.remove('dragging');
      });
    });
    
    // Setup drop zone
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.canvas.classList.add('drag-over');
    });
    
    this.canvas.addEventListener('dragleave', () => {
      this.canvas.classList.remove('drag-over');
    });
    
    this.canvas.addEventListener('drop', async (e) => {
      e.preventDefault();
      this.canvas.classList.remove('drag-over');
      
      const moduleName = e.dataTransfer.getData('module');
      await this.loadModule(moduleName);
    });
  }
  
  async loadModule(moduleName) {
    try {
      const module = await import(`../modules/${moduleName}.module.js`);
      
      if (module.render && typeof module.render === 'function') {
        await module.render(this.canvas);
        this.modules.set(moduleName, module);
        this.saveLayout();
      } else {
        console.error('Module missing render function:', moduleName);
      }
    } catch (err) {
      console.error('Failed to load module:', moduleName, err);
      alert(`Failed to load module: ${moduleName}\n${err.message}`);
    }
  }
  
  saveLayout() {
    const layout = Array.from(this.canvas.children).map((el, index) => {
      const moduleId = el.dataset.moduleId;
      return { moduleId, order: index };
    });
    
    localStorage.setItem('aesi_layout', JSON.stringify(layout));
  }
  
  loadSavedLayout() {
    const saved = localStorage.getItem('aesi_layout');
    if (!saved) return;
    
    try {
      const layout = JSON.parse(saved);
      layout.forEach(item => {
        if (item.moduleId) {
          this.loadModule(item.moduleId);
        }
      });
    } catch (err) {
      console.error('Failed to load saved layout:', err);
    }
  }
  
  clearCanvas() {
    this.canvas.innerHTML = '';
    this.modules.clear();
    localStorage.removeItem('aesi_layout');
  }
}

// Global instance
window.aesiUIEngine = new AESIUIEngine();
