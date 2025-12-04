document.addEventListener("DOMContentLoaded", function() {
    const navHTML = `
    <nav class="bg-gray-900 text-white border-b border-green-900 shadow-lg mb-6">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <div class="flex-shrink-0">
                    <a href="/" class="text-2xl font-bold text-green-500 tracking-widest hover:text-green-400 transition">ÆSI</a>
                </div>
                <div class="hidden md:block">
                    <div class="ml-10 flex items-baseline space-x-4">
                        <a href="/" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 hover:text-white transition">🏠 Hem</a>
                        <a href="/vision-builder.html" class="px-3 py-2 rounded-md text-sm font-medium bg-green-900 text-green-100 hover:bg-green-700 transition shadow-sm">👁️ Vision</a>
                        <a href="/deploy-console.html" class="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 hover:text-green-400 transition">💻 Konsol</a>
                        <a href="/nexus.html" class="px-3 py-2 rounded-md text-sm font-medium bg-gray-800 text-purple-400 hover:bg-gray-700 border border-purple-900 transition">💬 NEXUS</a>
                    </div>
                </div>
            </div>
        </div>
    </nav>
    `;

    const body = document.querySelector('body');
    const div = document.createElement('div');
    div.innerHTML = navHTML;
    body.insertBefore(div, body.firstChild);
});
