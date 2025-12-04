/**
 * Global Nav Injector
 * Auto-injects the global navigation menu into all pages
 */

(function injectGlobalNav() {
    // Don't reinject if already present
    if (document.getElementById('globalNavContainer')) return;

    // Create and inject script
    const script = document.createElement('script');
    script.src = '/js/global_nav_menu.js';
    script.defer = true;
    document.head.appendChild(script);

    console.log('✨ Global nav menu injector loaded');
})();
