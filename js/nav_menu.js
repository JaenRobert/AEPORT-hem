/**
 * Navigation Menu Module
 * Innehåller navbar HTML och logik för serverstatus
 */

// HTML för navigation bar
export const navHTML = `
<nav class="navbar">
    <div class="nav-left">
        <a href="index.html" class="nav-logo">AEPORT</a>
        <a href="nexus.html" class="nav-link active">Nexus</a>
        <a href="history.html" class="nav-link">Historik</a>
    </div>
    <div class="nav-right">
        <span class="server-status" id="serverStatus">
            <span class="status-dot offline"></span>
            <span class="status-text">Offline</span>
        </span>
        <button class="reconnect-btn" id="reconnectBtn">Återanslut</button>
    </div>
</nav>
`;

// Serverstatus hantering
let serverCheckInterval = null;

export async function checkServerStatus() {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (!statusDot || !statusText) return false;

    try {
        const response = await fetch('http://localhost:8767/ping', {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok) {
            statusDot.className = 'status-dot online';
            statusText.textContent = 'Online';
            return true;
        }
    } catch (error) {
        console.log('Server ej tillgänglig:', error.message);
    }
    
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Offline';
    return false;
}

export function startServerMonitoring() {
    // Initial check
    checkServerStatus();
    
    // Periodisk kontroll var 10:e sekund
    if (serverCheckInterval) {
        clearInterval(serverCheckInterval);
    }
    serverCheckInterval = setInterval(checkServerStatus, 10000);
}

export function initNavigation() {
    // Inject navbar HTML
    const navContainer = document.getElementById('navbar-container');
    if (navContainer) {
        navContainer.innerHTML = navHTML;
    }
    
    // Setup reconnect button
    const reconnectBtn = document.getElementById('reconnectBtn');
    if (reconnectBtn) {
        reconnectBtn.addEventListener('click', async () => {
            reconnectBtn.disabled = true;
            reconnectBtn.textContent = 'Kontrollerar...';
            
            await checkServerStatus();
            
            setTimeout(() => {
                reconnectBtn.disabled = false;
                reconnectBtn.textContent = 'Återanslut';
            }, 1000);
        });
    }
    
    // Start monitoring
    startServerMonitoring();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (serverCheckInterval) {
        clearInterval(serverCheckInterval);
    }
});
