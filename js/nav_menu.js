// Global Navigation Menu for ÆSI Portal
// Injiceras i live.html och andra sidor, synkroniserar serverstatusen

(function() {
  const navHTML = `
  <nav class="bg-black border-b border-green-600 p-2 flex justify-between items-center">
    <a href="/index.html" class="text-green-400 font-bold text-lg">ÆSI PORTAL</a>
    <div class="flex items-center space-x-4">
      <div class="space-x-3 text-sm">
        <a href="/live.html" class="text-green-400 hover:text-white">💬 LIVE</a>
        <a href="/nexus.html" class="text-green-400 hover:text-white">🌐 NEXUS</a>
        <a href="/archivarius.html" class="text-green-400 hover:text-white">📚 Archivarius</a>
        <a href="/vision-builder.html" class="text-green-400 hover:text-white">🎙️ Vision</a>
      </div>
      <div id="nav-server-status" class="text-xs px-2 py-1 rounded bg-gray-800">
        <span class="text-gray-400">Server:</span>
        <span id="nav-status-indicator" class="text-red-500">●</span>
      </div>
    </div>
  </nav>`;

  function initNav() {
    const el = document.getElementById("global-nav");
    if (el) {
      el.innerHTML = navHTML;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initNav);
  } else {
    initNav();
  }

  // Export status update function for other scripts
  window.updateNavServerStatus = function(isOnline) {
    const indicator = document.getElementById("nav-status-indicator");
    if (indicator) {
      indicator.className = isOnline ? "text-green-500" : "text-red-500";
    }
  };
})();
