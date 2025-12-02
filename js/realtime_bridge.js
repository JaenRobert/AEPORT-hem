// ======================================================
// ÆSI REALTIME BRIDGE v2.0
// Universal event bus, file monitoring, hot-reload
// ======================================================

const AesiRealtime = {
    isConnected: false,
    eventBus: {},
    watchers: [],
    nodeActivityLog: [],
    maxLogs: 100,
    pollInterval: null,

    // ===== EVENT BUS =====
    on(event, callback) {
        if (!this.eventBus[event]) this.eventBus[event] = [];
        this.eventBus[event].push(callback);
    },

    emit(event, data) {
        if (this.eventBus[event]) {
            this.eventBus[event].forEach(cb => cb(data));
        }
    },

    off(event, callback) {
        if (this.eventBus[event]) {
            this.eventBus[event] = this.eventBus[event].filter(cb => cb !== callback);
        }
    },

    // ===== NODE ACTIVITY =====
    logActivity(node, action, detail) {
        const entry = {
            timestamp: new Date().toISOString(),
            node: node,
            action: action,
            detail: detail
        };
        this.nodeActivityLog.unshift(entry);
        if (this.nodeActivityLog.length > this.maxLogs) {
            this.nodeActivityLog.pop();
        }
        this.emit("activity", entry);
    },

    // ===== FILE MONITORING =====
    async watchFile(path) {
        console.log(`👁️ Watching: ${path}`);
        let lastHash = null;

        const check = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/file-hash?path=${encodeURIComponent(path)}`);
                if (res.ok) {
                    const { hash } = await res.json();
                    if (lastHash && hash !== lastHash) {
                        console.log(`📝 File changed: ${path}`);
                        this.emit("file-changed", { path, newHash: hash });
                    }
                    lastHash = hash;
                }
            } catch (e) {
                console.warn(`Could not watch: ${path}`);
            }
        };

        check(); // Initial
        const interval = setInterval(check, 2000); // Kolla var 2 sekund
        this.watchers.push(interval);
    },

    // ===== PULSE VISUALIZATION =====
    renderPulseIndicator(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const indicator = document.createElement("div");
        indicator.className = "aesi-pulse-indicator";
        indicator.innerHTML = `
            <div class="pulse-dot"></div>
            <span class="pulse-text">REALTIME</span>
        `;

        container.appendChild(indicator);

        // Animera puls
        setInterval(() => {
            const dot = indicator.querySelector(".pulse-dot");
            dot.style.opacity = this.isConnected ? "1" : "0.3";
        }, 1000);
    },

    // ===== MODULE HOT-RELOAD =====
    hotReloadModule(moduleId) {
        console.log(`🔥 Hot-reloading module: ${moduleId}`);
        
        // Ta bort gammal CSS
        document.querySelectorAll(`link[data-module="${moduleId}"]`).forEach(el => el.remove());
        
        // Ta bort gammal JS
        document.querySelectorAll(`script[data-module="${moduleId}"]`).forEach(el => el.remove());
        
        // Re-load
        this.emit("module-reload", { moduleId });
    },

    // ===== CONNECTION CHECK =====
    async checkConnection() {
        try {
            const res = await fetch("http://localhost:8000/context/nodes", { timeout: 5000 });
            this.isConnected = res.ok;
        } catch (e) {
            this.isConnected = false;
        }

        this.emit("connection-changed", { isConnected: this.isConnected });
    },

    // ===== GLOBAL STATUS HEADER =====
    renderGlobalStatus(headerId) {
        const header = document.getElementById(headerId);
        if (!header) return;

        const status = document.createElement("div");
        status.className = "aesi-global-status";
        status.innerHTML = `
            <div class="status-item">
                <span id="status-connection">● OFFLINE</span>
            </div>
            <div class="status-item">
                <span id="status-nodes">0 nodes</span>
            </div>
            <div class="status-item">
                <span id="status-time"></span>
            </div>
        `;

        header.appendChild(status);

        // Uppdatera varje sekund
        setInterval(() => {
            const connEl = document.getElementById("status-connection");
            if (connEl) {
                connEl.textContent = this.isConnected ? "● ONLINE" : "● OFFLINE";
                connEl.style.color = this.isConnected ? "#10b981" : "#ef4444";
            }

            const timeEl = document.getElementById("status-time");
            if (timeEl) {
                timeEl.textContent = new Date().toLocaleTimeString("sv-SE");
            }
        }, 1000);
    },

    // ===== SYNC ENGINE =====
    async syncWithProton() {
        console.log("☁️ Syncing with Proton Drive...");
        try {
            // Om Proton Drive integration finns senare
            const res = await fetch("http://localhost:8000/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    layout: localStorage.getItem("aesi_layout"),
                    modules: localStorage.getItem("node_modules"),
                    timestamp: new Date().toISOString()
                })
            });
            if (res.ok) {
                this.emit("synced", { target: "proton" });
                console.log("✅ Synced with Proton");
            }
        } catch (e) {
            console.warn("Proton sync not available");
        }
    },

    // ===== INIT =====
    init() {
        console.log("🌉 Initializing Realtime Bridge...");
        
        // Check connection every 5 seconds
        this.checkConnection();
        this.pollInterval = setInterval(() => this.checkConnection(), 5000);

        // Setup watchers
        this.watchFile("index.html");
        this.watchFile("arvskedjan_d.jsonl");
        this.watchFile("context_events.jsonl");

        // Auto-sync every 10 seconds
        setInterval(() => this.syncWithProton(), 10000);

        console.log("✅ Realtime Bridge Ready");
    },

    destroy() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.watchers.forEach(w => clearInterval(w));
    }
};

// CSS for realtime bridge
const realtimeCss = `
.aesi-pulse-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    color: #10b981;
}

.pulse-dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

.aesi-global-status {
    display: flex;
    gap: 24px;
    font-size: 11px;
    color: #666;
    font-weight: 500;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 6px;
}
`;

const style = document.createElement("style");
style.textContent = realtimeCss;
document.head.appendChild(style);

window.AesiRealtime = AesiRealtime;
