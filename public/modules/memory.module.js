/**
 * ÆSI Memory Module
 * Displays conversation history from "Tunnan"
 */

export const metadata = {
  id: 'memory',
  name: 'Tunnan',
  icon: '💾',
  description: 'Conversation history',
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
    <div class="module-body" id="memory-content">
      <button class="aesi-btn" onclick="window.memoryModule.loadConversations()">
        💾 Load History
      </button>
      <div class="conversation-list" id="conversation-list"></div>
    </div>
  `;
  
  container.appendChild(module);
  
  window.memoryModule = {
    loadConversations: async () => {
      try {
        const res = await fetch('/api/memory');
        const data = await res.json();
        const list = document.getElementById('conversation-list');
        
        if (data.conversations && data.conversations.length > 0) {
          list.innerHTML = data.conversations.map(conv => `
            <div class="conversation-item">
              <div class="conv-header">
                <strong>${conv.date}</strong>
                <span class="badge">${conv.entries?.length || 0} entries</span>
              </div>
              <p class="text-muted">${conv.preview || 'No preview'}</p>
            </div>
          `).join('');
        } else {
          list.innerHTML = '<p class="text-muted">No conversations yet</p>';
        }
      } catch (err) {
        alert('Failed to load conversations: ' + err.message);
      }
    }
  };
}
