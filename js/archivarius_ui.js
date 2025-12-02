// Archivarius UI v1.0
const ArchivariusUI = {
    init() {
        this.drop = document.getElementById('dropZone');
        this.listEl = document.getElementById('list');
        this.meta = document.getElementById('meta');
        this.setupDrop();
        document.getElementById('btnRefresh').addEventListener('click', () => this.refresh());
        this.refresh();
        setInterval(() => this.refresh(), 5000);
    },

    setupDrop() {
        this.drop.addEventListener('click', async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = async (e) => {
                const f = e.target.files[0];
                await this.uploadFile(f);
            };
            input.click();
        });

        this.drop.addEventListener('dragover', (e) => { e.preventDefault(); this.drop.style.borderColor = '#10b981'; });
        this.drop.addEventListener('dragleave', () => { this.drop.style.borderColor = '#4F46E5'; });
        this.drop.addEventListener('drop', async (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            for (const f of files) await this.uploadFile(f);
        });
    },

    async uploadFile(file){
        const name = file.name;
        const text = await file.text();
        const payload = { name, content: text, mime: file.type };
        const res = await fetch('/api/archive/upload', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        if (res.ok) {
            const j = await res.json();
            this.refresh();
            if (window.AesiRealtime && AesiRealtime.emit) AesiRealtime.emit('archive-updated', { id: j.id, filename: name });
        } else {
            alert('Upload failed');
        }
    },

    async refresh(){
        try{
            const res = await fetch('/api/archive/list');
            if (!res.ok) return;
            const j = await res.json();
            this.renderList(j.entries || []);
        }catch(e){console.error(e)}
    },

    renderList(entries){
        this.listEl.innerHTML = '';
        entries.forEach(e => {
            const div = document.createElement('div');
            div.className = 'archive-item';
            div.textContent = `${e.id} — ${e.filename} — ${e.ae?.timestamp || ''}`;
            div.onclick = () => this.viewMeta(e.id);
            this.listEl.appendChild(div);
        });
    },

    async viewMeta(id){
        const res = await fetch(`/api/archive/get/${id}`);
        if (!res.ok) { this.meta.textContent = 'Not found'; return; }
        const j = await res.json();
        this.meta.innerHTML = `<pre>${JSON.stringify(j, null, 2)}</pre>`;
    }
};

window.addEventListener('DOMContentLoaded', () => ArchivariusUI.init());
