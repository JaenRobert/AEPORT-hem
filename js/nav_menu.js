fetch('/menu.json')
  .then(res => res.json())
  .then(pages => {
    const nav = document.getElementById('global-nav');
    if(!nav) return;
    nav.innerHTML = '<nav class="flex justify-center gap-6 bg-gray-900 text-green-400 py-2 text-sm border-b border-gray-800">' +
      pages.map(p => \<a href="\" class="hover:text-green-200">\</a>\).join('') +
      '</nav>';
  });
