// ÆSI WebCore - Dynamisk global meny (ES6)
(function () {
  const menuRoot = document.getElementById("webcore-menu");
  if (!menuRoot) return;
  const modules = [
    { name: "Portal", type: "HTML", path: "portal.html", category: "Core" },
    { name: "Book", type: "HTML", path: "book.html", category: "Book" },
    { name: "Tunnan", type: "HTML", path: "memory.html", category: "Memory" },
    { name: "Uploads", type: "HTML", path: "uploads.html", category: "Upload" },
    { name: "Arkivarius", type: "HTML", path: "archivarius.html", category: "Archive" }
  ];
  menuRoot.innerHTML = "";
  modules.forEach(mod => {
    const btn = document.createElement("button");
    btn.className = "menu-btn";
    btn.innerHTML = `${mod.name}`;
    btn.title = `${mod.category} (${mod.type})`;
    btn.onclick = () => window.loadModule ? window.loadModule(mod.path, mod.name) : null;
    menuRoot.appendChild(btn);
  });
  // Responsiv sticky
  menuRoot.style.position = "sticky";
  menuRoot.style.top = "0";
  menuRoot.style.zIndex = "100";
})();

/* Dynamisk global meny */
document.addEventListener("DOMContentLoaded", () => {
  const menuHTML = `
  <nav style="background:#050505;color:#00ffe0;padding:12px 16px;display:flex;gap:20px;font-family:monospace;position:sticky;top:0;z-index:999;border-bottom:1px solid #222;align-items:center;box-shadow:0 2px 8px rgba(0,255,224,0.1);">
    <a href="index.html" style="color:#00ffe0;text-decoration:none;transition:0.2s;" onmouseover="this.style.color='#00bfa0'" onmouseout="this.style.color='#00ffe0'">🏠 Start</a>
    <a href="portal.html" style="color:#00ffe0;text-decoration:none;transition:0.2s;" onmouseover="this.style.color='#00bfa0'" onmouseout="this.style.color='#00ffe0'">🧠 Portal</a>
    <a href="uploads.html" style="color:#00ffe0;text-decoration:none;transition:0.2s;" onmouseover="this.style.color='#00bfa0'" onmouseout="this.style.color='#00ffe0'">📤 Upload</a>
    <a href="book.html" style="color:#00ffe0;text-decoration:none;transition:0.2s;" onmouseover="this.style.color='#00bfa0'" onmouseout="this.style.color='#00ffe0'">📖 Boken</a>
    <a href="memory.html" style="color:#00ffe0;text-decoration:none;transition:0.2s;" onmouseover="this.style.color='#00bfa0'" onmouseout="this.style.color='#00ffe0'">💾 Tunnan</a>
    <a href="archivarius.html" style="color:#00ffe0;text-decoration:none;transition:0.2s;" onmouseover="this.style.color='#00bfa0'" onmouseout="this.style.color='#00ffe0'">📚 Arkivarius</a>
    <span style="margin-left:auto;font-size:0.9em;color:#666;">ÆSI NEXUS v5.0</span>
  </nav>`;
  document.body.insertAdjacentHTML("afterbegin", menuHTML);
});

const style = document.createElement("style");
style.textContent = `
.aesi-menu {
  position: sticky; top:0; background:#0b0b0b; color:#00ffe0;
  display:flex; justify-content:space-between; padding:10px 20px;
  font-family:system-ui; font-size:14px; z-index:1000;
}
.aesi-menu a { color:#00ffe0; margin:0 8px; text-decoration:none; }
.aesi-menu a:hover { text-decoration:underline; }
`;
document.head.append(style);
