// Gratitude Stream
const GratitudeStream = {
    init(){
        this.container = null;
        // Create UI panel in body
        const panel = document.createElement('div');
        panel.id = 'gratitudeStreamPanel';
        panel.style = 'position:fixed;right:20px;top:80px;width:300px;max-height:400px;overflow:auto;background:#07111a;border:1px solid #233;padding:8px;border-radius:8px;color:#fff;z-index:800';
        panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong>Gratitude</strong><button id="gClose">✕</button></div><div id="gList"></div>';
        document.body.appendChild(panel);
        document.getElementById('gClose').addEventListener('click', ()=>panel.style.display='none');
        this.gList = panel.querySelector('#gList');
        this.refresh();
        setInterval(()=>this.refresh(), 3000);
    },
    async refresh(){
        try{
            const res = await fetch('/logs/ethics/mtl.jsonl');
            if (!res.ok) return;
            const txt = await res.text();
            const lines = txt.trim().split('\n').filter(Boolean).slice(-50).reverse();
            this.gList.innerHTML = '';
            for (const ln of lines){
                try{
                    const obj = JSON.parse(ln);
                    const div = document.createElement('div');
                    div.style='padding:6px;border-bottom:1px solid rgba(255,255,255,0.02);font-size:12px';
                    div.innerHTML = `<div><strong>${obj.node}</strong> <span style="color:#9CA3AF;font-size:11px">${obj.timestamp}</span></div><div style="color:#cbd5e1">${obj.type} ${obj.detail?JSON.stringify(obj.detail):''}</div>`;
                    this.gList.appendChild(div);
                }catch(e){ }
            }
            if (window.AesiRealtime && AesiRealtime.emit) AesiRealtime.emit('gratitude-updated', {});
        }catch(e){ console.warn('Gratitude stream error',e); }
    }
};

window.addEventListener('DOMContentLoaded', ()=> GratitudeStream.init());
