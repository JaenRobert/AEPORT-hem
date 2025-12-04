/**
 * ÆSI Upload Module
 * File upload functionality
 */

export const metadata = {
  id: 'upload',
  name: 'Upload',
  icon: '📤',
  description: 'File upload system',
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
      <div class="upload-zone" id="upload-zone">
        <p>📁 Drop files here or click to browse</p>
        <input type="file" id="file-input" hidden multiple>
      </div>
      <div class="file-list" id="file-list"></div>
    </div>
  `;
  
  container.appendChild(module);
  
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  
  zone.onclick = () => input.click();
  
  zone.ondragover = (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  };
  
  zone.ondragleave = () => {
    zone.classList.remove('drag-over');
  };
  
  zone.ondrop = async (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    await handleFiles(e.dataTransfer.files);
  };
  
  input.onchange = async (e) => {
    await handleFiles(e.target.files);
  };
  
  async function handleFiles(files) {
    const token = localStorage.getItem('aesi_token');
    if (!token) {
      alert('Please login first');
      return;
    }
    
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filename: file.name,
              content: e.target.result
            })
          });
          
          if (res.ok) {
            alert(`✅ ${file.name} uploaded`);
          }
        } catch (err) {
          alert(`❌ ${file.name} failed: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  }
}
