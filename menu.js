const navHTML = `
<nav class="bg-black border-b border-green-600 p-2 flex justify-between items-center">
  <a href="/index.html" class="text-green-400 font-bold">ÆSI PORTAL</a>
  <div class="space-x-3 text-sm">
    <a href="/live.html" class="text-green-400 hover:text-white">💬 LIVE</a>
    <a href="/book.html" class="text-green-400 hover:text-white">📖 Boken</a>
    <a href="/memory.html" class="text-green-400 hover:text-white">💾 Tunnan</a>
    <a href="/uploads.html" class="text-green-400 hover:text-white">📤 Uploads</a>
  </div>
</nav>`;
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("global-nav");
  if (el) el.innerHTML = navHTML;
});