// Minimal Conversations & Documents Browser UI
(function(){
  function createModal() {
    if(document.getElementById('aesi-browser-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'aesi-browser-modal';
    modal.style = 'position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2000;';
    modal.innerHTML = `
      <div style="width:90%;max-width:1000px;height:80%;background:#0b0b0b;border:1px solid #333;border-radius:8px;overflow:hidden;display:flex;">
        <div style="width:360px;border-right:1px solid #222;padding:12px;overflow:auto;background:#080808;">
          <h3 style="color:#c7c7ff;margin:0 0 8px;font-size:14px">Conversations</h3>
          <div style="margin-bottom:8px">
            <select id="aesi-browser-node-filter" style="width:100%;background:#111;border:1px solid #222;color:#ddd;padding:6px;border-radius:4px;margin-bottom:8px">
              <option value="">All nodes</option>
              <option>JEMMIN</option>
              <option>REFLEX</option>
              <option>CLAUDE</option>
              <option>HAFTED</option>
              <option>SMILE</option>
              <option>ERNIE</option>
            </select>
            <input id="aesi-search" placeholder="Search text..." style="width:100%;background:#111;border:1px solid #222;color:#ddd;padding:6px;border-radius:4px;margin:8px 0;font-size:12px" />
            <div style="display:flex;gap:8px;margin-bottom:8px;">
              <select id="aesi-page-size" style="flex:1;background:#111;border:1px solid #222;color:#ddd;padding:6px;border-radius:4px;font-size:12px">
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
              </select>
              <button id="aesi-refresh-list" style="width:120px;padding:6px;background:#1f2937;color:#fff;border:none;border-radius:4px">Refresh</button>
            </div>
          </div>
          <div id="aesi-convo-list" style="font-size:12px;color:#bbb"></div>
          <div id="aesi-pagination" style="padding-top:8px;color:#aaa;font-size:12px;display:flex;gap:8px;align-items:center;justify-content:center;"></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;">
          <div style="padding:12px;border-bottom:1px solid #222;display:flex;justify-content:space-between;align-items:center">
            <div style="color:#fff;font-weight:700">Viewer</div>
            <div>
              <button id="aesi-close-browser" style="background:#111;border:1px solid #333;color:#ccc;padding:6px;border-radius:4px">Close</button>
            </div>
          </div>
          <div id="aesi-viewer" style="padding:12px;overflow:auto;color:#ddd;font-size:13px;flex:1;background:#050505"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('aesi-close-browser').onclick = () => modal.remove();
    document.getElementById('aesi-refresh-list').onclick = () => loadList();
    document.getElementById('aesi-browser-node-filter').onchange = () => loadList();
  }

  // pagination & state
  let _aesi_lastItems = [];
  let _aesi_currentPage = 1;
  let _aesi_pageSize = 10;

  function renderListPage(page){
    const listEl = document.getElementById('aesi-convo-list');
    const paginationEl = document.getElementById('aesi-pagination');
    if(!listEl) return;
    const search = (document.getElementById('aesi-search')?.value || '').toLowerCase();
    const nodeFilter = document.getElementById('aesi-browser-node-filter')?.value || '';
    const filtered = _aesi_lastItems.filter(it => {
      if(nodeFilter && (it.node || it.folder) !== nodeFilter) return false;
      if(search){
        const txt = JSON.stringify(it).toLowerCase();
        return txt.includes(search);
      }
      return true;
    });
    const total = filtered.length;
    const pageSize = _aesi_pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    _aesi_currentPage = Math.min(Math.max(1, page), totalPages);
    const start = ( _aesi_currentPage - 1 ) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    if(pageItems.length === 0) listEl.innerHTML = '<div style="color:#666">No conversations</div>';
    else listEl.innerHTML = pageItems.map(it=>`<div class="aesi-convo-item" data-path="${it.path}" style="padding:6px;border-bottom:1px solid #111;cursor:pointer;color:#cfcfcf">${it.name}<div style="font-size:11px;color:#888">${it.folder||it.node} • ${it.modified}</div></div>`).join('');
    document.querySelectorAll('.aesi-convo-item').forEach(el=>el.onclick = ()=>openConversation(el.dataset.path));

    // pagination controls
    if(paginationEl){
      paginationEl.innerHTML = `
        <button id="aesi-prev" style="padding:6px 10px;background:#111;border:1px solid #222;color:#ddd;border-radius:4px">Prev</button>
        <span style="color:#aaa"> Page ${_aesi_currentPage} / ${totalPages} — ${total} items</span>
        <button id="aesi-next" style="padding:6px 10px;background:#111;border:1px solid #222;color:#ddd;border-radius:4px">Next</button>
      `;
      document.getElementById('aesi-prev').onclick = ()=>{ if(_aesi_currentPage>1) renderListPage(_aesi_currentPage-1); };
      document.getElementById('aesi-next').onclick = ()=>{ if(_aesi_currentPage<totalPages) renderListPage(_aesi_currentPage+1); };
    }
  }

  async function loadList(){
    createModal();
    const node = document.getElementById('aesi-browser-node-filter').value;
    const listEl = document.getElementById('aesi-convo-list');
    listEl.innerHTML = 'Loading...';
    try{
      _aesi_pageSize = parseInt(document.getElementById('aesi-page-size')?.value || '10', 10);
      const resp = await fetch('/api/conversations/list', {method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({node: node})});
      const data = await resp.json();
      _aesi_lastItems = data.items || [];
      _aesi_currentPage = 1;
      renderListPage(1);
    }catch(e){listEl.innerHTML = '<div style="color:#f88">Failed to load</div>';console.error(e)}
  }

  async function openConversation(path){
    const viewer = document.getElementById('aesi-viewer');
    viewer.innerHTML = 'Loading...';
    try{
      const resp = await fetch('/api/conversations/get', {method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({path: path})});
      const data = await resp.json();
      const convo = data.conversation || {};
      viewer.innerHTML = `<pre style="white-space:pre-wrap;color:#cfcfcf">${JSON.stringify(convo,null,2)}</pre>`;
    }catch(e){viewer.innerHTML = '<div style="color:#f88">Failed to open</div>';console.error(e)}
  }

  // expose open function to global so index.html can attach to a button
  window.AESI = window.AESI || {};
  window.AESI.openConversationsBrowser = function(){ createModal(); loadList(); };

})();
