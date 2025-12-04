/**
 * ÆSI Chat Module
 * AI interaction panel
 */

export const metadata = {
  id: 'chat',
  name: 'AI Chat',
  icon: '💬',
  description: 'Chat with AI nodes',
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
    <div class="module-body">
      <select id="chat-node" class="aesi-select">
        <option value="REFLEX">REFLEX</option>
        <option value="CLAUDE">CLAUDE</option>
        <option value="E1TAN">E1TAN</option>
      </select>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-wrapper">
        <input type="text" id="chat-input" placeholder="Type message..." class="aesi-input">
        <button class="aesi-btn" onclick="window.chatModule.send()">Send</button>
      </div>
    </div>
  `;
  
  container.appendChild(module);
  
  window.chatModule = {
    send: async () => {
      const input = document.getElementById('chat-input');
      const node = document.getElementById('chat-node').value;
      const messages = document.getElementById('chat-messages');
      const text = input.value.trim();
      
      if (!text) return;
      
      // Add user message
      messages.innerHTML += `
        <div class="message user">
          <strong>You:</strong> ${text}
        </div>
      `;
      
      input.value = '';
      
      try {
        const res = await fetch('/api/pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, node })
        });
        
        const data = await res.json();
        
        messages.innerHTML += `
          <div class="message ai">
            <strong>${node}:</strong> ${data.response || data.text}
          </div>
        `;
        
        messages.scrollTop = messages.scrollHeight;
      } catch (err) {
        alert('Failed to send message: ' + err.message);
      }
    }
  };
  
  // Send on Enter
  document.getElementById('chat-input').onkeypress = (e) => {
    if (e.key === 'Enter') window.chatModule.send();
  };
}
