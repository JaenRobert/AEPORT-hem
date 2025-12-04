/**
 * ÆSI Book Module
 * Displays and manages "Boken" chapters
 */

export const metadata = {
  id: 'book',
  name: 'Boken',
  icon: '📖',
  description: 'Chapter management system',
  version: '3.0.0'
};

export async function render(container) {
  const module = document.createElement('div');
  module.className = 'aesi-module aesi-card';
  module.innerHTML = `
    <div class="module-header">
      <h3>${metadata.icon} ${metadata.name}</h3>
      <button class="btn-icon" onclick="this.closest('.aesi-module').remove()">✕</button>
    </div>
    <div class="module-body" id="book-content">
      <button class="aesi-btn" onclick="window.bookModule.loadChapters()">
        📖 Load Chapters
      </button>
      <div class="chapter-list" id="chapter-list"></div>
    </div>
  `;
  
  container.appendChild(module);
  
  // Store module instance
  window.bookModule = {
    loadChapters: async () => {
      try {
        const res = await fetch('/api/book');
        const data = await res.json();
        const list = document.getElementById('chapter-list');
        
        if (data.book && data.book.chapters) {
          list.innerHTML = data.book.chapters.map(ch => `
            <div class="chapter-item">
              <h4>${ch.title}</h4>
              <p class="text-muted">${new Date(ch.createdAt).toLocaleDateString('sv-SE')}</p>
              <p>${ch.content.substring(0, 200)}...</p>
            </div>
          `).join('');
        } else {
          list.innerHTML = '<p class="text-muted">No chapters yet</p>';
        }
      } catch (err) {
        alert('Failed to load chapters: ' + err.message);
      }
    }
  };
}
