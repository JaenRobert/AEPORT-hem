// ======================================================
// ÆSI MODULES MANAGER v1.0
// Automatisk moduldetektering, zonhantering, drag-drop
// ======================================================

const ModulesManager = {
    // Konfiguration
    zones: {
        TOP: { name: "TOP", max: 1, modules: [] },
        MIDDLE: { name: "MIDDLE", max: 131, modules: [] },
        BOTTOM: { name: "BOTTOM", max: 1, modules: [] }
    },
    
    allModules: {}, // { moduleName: { path, iframe, loaded: bool, data: {} } }
    loadedModules: new Set(),
    draggedModule: null,
    
    // Moduler som inte ska listas
    excludeModules: ["realtime_chat", "realtime_chat.css", "realtime_chat.js"],

    /**
     * Initialisera modulhanteraren
     */
    async init() {
        console.log("📦 ModulesManager: Starting initialization...");
        
        // 1. Hämta alla moduler
        await this.discoverModules();
        
        // 2. Ladda zonkonfiguration från localStorage
        this.loadZoneConfig();
        
        // 3. Rendera UI
        this.renderZones();
        this.renderModuleBrowser();
        
        // 4. Sätt upp events
        this.setupDragDrop();
        this.setupSearchShortcut();
        this.setupAutoSave();
        
        console.log("✅ ModulesManager initialized. Modules found:", Object.keys(this.allModules).length);
    },

    /**
     * Upptäck alla moduler i /modules/
     */
    async discoverModules() {
        try {
            // Försök hämta modulindex (måste skapas av backend eller vara statisk lista)
            // För nu använder vi hardcodad lista + dynamisk detection från localStorage
            
            const knownModules = [
                "reflex", "claude", "chatgpt", "smile", "ernie", "hafted",
                "realtime_chat", "module-search", "portal-status", "node-monitor"
            ];

            knownModules.forEach(name => {
                if (!this.excludeModules.includes(name)) {
                    this.allModules[name] = {
                        name: name,
                        path: `./modules/${name}.html`,
                        loaded: false,
                        zone: null,
                        data: {}
                    };
                }
            });

            // Läs även från localStorage om det finns anpassade moduler
            const savedModules = JSON.parse(localStorage.getItem("aesi_custom_modules") || "{}");
            Object.assign(this.allModules, savedModules);

        } catch (e) {
            console.warn("⚠️ Kunde inte upptäcka moduler:", e);
        }
    },

    /**
     * Ladda zonkonfiguration från localStorage
     */
    loadZoneConfig() {
        const saved = localStorage.getItem("aesi_zone_config");
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.zones = config;
                console.log("📍 Zonkonfiguration laddad från localStorage");
            } catch (e) {
                console.warn("⚠️ Kunde inte ladda zonkonfiguration:", e);
            }
        }
    },

    /**
     * Spara zonkonfiguration
     */
    saveZoneConfig() {
        try {
            localStorage.setItem("aesi_zone_config", JSON.stringify(this.zones));
            console.log("💾 Zonkonfiguration sparad");
        } catch (e) {
            console.warn("⚠️ Kunde inte spara zonkonfiguration:", e);
        }
    },

    /**
     * Rendera de tre zonerna (TOP, MIDDLE, BOTTOM)
     */
    renderZones() {
        const container = document.getElementById("aesi-modules-container");
        if (!container) {
            console.warn("⚠️ #aesi-modules-container inte funnen");
            return;
        }

        container.innerHTML = `
            <div id="aesi-zones" style="display: flex; flex-direction: column; gap: 16px; padding: 16px; min-height: 100vh;">
                <!-- TOP ZONE -->
                <div class="aesi-zone" id="zone-TOP" data-zone="TOP" 
                     ondragover="ModulesManager.handleDragOver(event)" 
                     ondrop="ModulesManager.handleDrop(event)"
                     style="background: #0a0a0a; border: 2px dashed #333; border-radius: 8px; padding: 12px; min-height: 120px;">
                    <div style="color: #666; font-size: 11px; font-weight: bold; margin-bottom: 8px;">🔝 TOP (1 modul)</div>
                    <div id="zone-TOP-modules" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
                </div>

                <!-- MIDDLE ZONE -->
                <div class="aesi-zone" id="zone-MIDDLE" data-zone="MIDDLE"
                     ondragover="ModulesManager.handleDragOver(event)" 
                     ondrop="ModulesManager.handleDrop(event)"
                     style="background: #0a0a0a; border: 2px dashed #333; border-radius: 8px; padding: 12px; min-height: 600px;">
                    <div style="color: #666; font-size: 11px; font-weight: bold; margin-bottom: 8px;">⭐ MIDDLE (131 moduler)</div>
                    <div id="zone-MIDDLE-modules" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;"></div>
                </div>

                <!-- BOTTOM ZONE -->
                <div class="aesi-zone" id="zone-BOTTOM" data-zone="BOTTOM"
                     ondragover="ModulesManager.handleDragOver(event)" 
                     ondrop="ModulesManager.handleDrop(event)"
                     style="background: #0a0a0a; border: 2px dashed #333; border-radius: 8px; padding: 12px; min-height: 120px;">
                    <div style="color: #666; font-size: 11px; font-weight: bold; margin-bottom: 8px;">🔽 BOTTOM (1 modul)</div>
                    <div id="zone-BOTTOM-modules" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
                </div>
            </div>
        `;

        // Rendera moduler i varje zon
        Object.values(this.zones).forEach(zone => {
            const zoneEl = document.getElementById(`zone-${zone.name}-modules`);
            if (zoneEl) {
                zoneEl.innerHTML = zone.modules.map(moduleName => 
                    this.renderModuleCard(moduleName, zone.name)
                ).join("");
            }
        });
    },

    /**
     * Rendera en modulkort
     */
    renderModuleCard(moduleName, zone) {
        const mod = this.allModules[moduleName];
        if (!mod) return "";

        return `
            <div class="module-card" 
                 draggable="true" 
                 data-module="${moduleName}"
                 data-zone="${zone}"
                 ondragstart="ModulesManager.handleDragStart(event)"
                 ondragend="ModulesManager.handleDragEnd(event)"
                 style="
                     background: #1a1a1a;
                     border: 1px solid #333;
                     border-radius: 6px;
                     padding: 8px;
                     cursor: grab;
                     transition: all 0.2s;
                     position: relative;
                     min-width: 120px;
                 "
                 onmouseover="this.style.borderColor='#4F46E5'"
                 onmouseout="this.style.borderColor='#333'">
                <div style="font-size: 11px; font-weight: bold; color: #eee; margin-bottom: 4px;">
                    📦 ${moduleName}
                </div>
                <div style="display: flex; gap: 4px; margin-top: 6px;">
                    <button onclick="ModulesManager.openModule('${moduleName}')" 
                            style="flex: 1; background: #4F46E5; border: none; color: white; font-size: 9px; padding: 4px; border-radius: 3px; cursor: pointer;">
                        Öppna
                    </button>
                    <button onclick="ModulesManager.removeModule('${moduleName}')" 
                            style="flex: 0; background: #ef4444; border: none; color: white; font-size: 9px; padding: 4px 6px; border-radius: 3px; cursor: pointer;">
                        ✕
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Rendera modulbrowsern (vänsterkant)
     */
    renderModuleBrowser() {
        const container = document.getElementById("aesi-module-browser");
        if (!container) return;

        const availableModules = Object.keys(this.allModules)
            .filter(name => !Object.values(this.zones).some(z => z.modules.includes(name)));

        container.innerHTML = `
            <div style="padding: 12px; border-bottom: 1px solid #333; font-size: 11px; font-weight: bold; color: #888;">
                📚 MODULE BROWSER
                <span style="font-size: 10px; color: #666;">(${Object.keys(this.allModules).length})</span>
            </div>
            
            <div style="padding: 8px;">
                <input id="module-search-box" 
                       type="text" 
                       placeholder="🔍 Sök moduler..." 
                       style="
                           width: 100%;
                           background: #111;
                           color: #eee;
                           border: 1px solid #333;
                           padding: 6px;
                           border-radius: 4px;
                           font-size: 11px;
                       "
                       oninput="ModulesManager.filterBrowser(this.value)">
            </div>

            <div id="available-modules" style="padding: 8px; overflow-y: auto; max-height: 600px;">
                ${availableModules.map(name => `
                    <div draggable="true" 
                         data-module="${name}"
                         ondragstart="ModulesManager.handleBrowserDragStart(event)"
                         style="
                             background: #1a1a1a;
                             border: 1px solid #333;
                             padding: 8px;
                             margin-bottom: 6px;
                             border-radius: 4px;
                             cursor: grab;
                             font-size: 11px;
                             transition: all 0.2s;
                         "
                         onmouseover="this.style.borderColor='#4F46E5'"
                         onmouseout="this.style.borderColor='#333'">
                        📦 ${name}
                    </div>
                `).join("")}
            </div>
        `;
    },

    /**
     * Filtera modulbrowsern
     */
    filterBrowser(query) {
        const modules = document.querySelectorAll("#available-modules > div");
        modules.forEach(el => {
            const name = el.dataset.module.toLowerCase();
            el.style.display = name.includes(query.toLowerCase()) ? "block" : "none";
        });
    },

    /**
     * Drag-drop handlers
     */
    handleDragStart(e) {
        this.draggedModule = e.target.closest(".module-card").dataset.module;
        e.target.closest(".module-card").style.opacity = "0.5";
        e.dataTransfer.effectAllowed = "move";
    },

    handleBrowserDragStart(e) {
        this.draggedModule = e.target.dataset.module;
        e.dataTransfer.effectAllowed = "move";
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        e.target.closest(".aesi-zone").style.borderColor = "#4F46E5";
    },

    handleDrop(e) {
        e.preventDefault();
        const targetZone = e.target.closest(".aesi-zone").dataset.zone;
        const zone = this.zones[targetZone];

        if (this.draggedModule && zone.modules.length < zone.max) {
            // Ta bort från andra zoner
            Object.values(this.zones).forEach(z => {
                z.modules = z.modules.filter(m => m !== this.draggedModule);
            });

            // Lägg till i denna zon
            zone.modules.push(this.draggedModule);
            this.allModules[this.draggedModule].zone = targetZone;

            this.saveZoneConfig();
            this.renderZones();
            this.renderModuleBrowser();
        }

        e.target.closest(".aesi-zone").style.borderColor = "#333";
    },

    handleDragEnd(e) {
        document.querySelectorAll(".module-card").forEach(el => el.style.opacity = "1");
        document.querySelectorAll(".aesi-zone").forEach(el => el.style.borderColor = "#333");
    },

    /**
     * Öppna modul i ny flik/modal
     */
    async openModule(moduleName) {
        const mod = this.allModules[moduleName];
        if (!mod) return;

        // Enkel modal
        const modal = document.createElement("div");
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
            align-items: center; justify-content: center;
        `;

        modal.innerHTML = `
            <div style="
                background: #0a0a0a; width: 90%; height: 90%;
                border: 1px solid #333; border-radius: 8px;
                display: flex; flex-direction: column;
            ">
                <div style="
                    padding: 12px; border-bottom: 1px solid #333;
                    display: flex; justify-content: space-between; align-items: center;
                ">
                    <span style="font-weight: bold; color: #eee;">📦 ${moduleName}</span>
                    <button onclick="this.closest('[style*=fixed]').remove()" style="
                        background: #ef4444; color: white; border: none;
                        padding: 4px 8px; border-radius: 3px; cursor: pointer;
                    ">✕</button>
                </div>
                <iframe id="module-iframe-${moduleName}" 
                        src="${mod.path}" 
                        style="
                            flex: 1; border: none; background: #050505;
                        "
                        sandbox="allow-same-origin allow-scripts allow-forms">
                </iframe>
            </div>
        `;

        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    },

    /**
     * Ta bort modul från zon
     */
    removeModule(moduleName) {
        Object.values(this.zones).forEach(z => {
            z.modules = z.modules.filter(m => m !== moduleName);
        });
        this.saveZoneConfig();
        this.renderZones();
        this.renderModuleBrowser();
    },

    /**
     * Sätt upp snabbkommandon (CMD+K eller CTRL+K)
     */
    setupSearchShortcut() {
        document.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                const searchBox = document.getElementById("module-search-box");
                if (searchBox) searchBox.focus();
            }
        });
    },

    /**
     * Sätt upp autospara (sparar zonkonfig var 5:e sekund)
     */
    setupAutoSave() {
        setInterval(() => {
            this.saveZoneConfig();
        }, 5000);
    }
};

// Exportera globalt
window.ModulesManager = ModulesManager;

// Initiera när DOM är redo
document.addEventListener("DOMContentLoaded", () => {
    ModulesManager.init();
});
