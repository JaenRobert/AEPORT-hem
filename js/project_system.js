// ======================================================
// ÆSI PROJECT SYSTEM v2.0
// Dynamisk, projektagnostisk modul-laddare
// ======================================================

const AesiProjects = {
    projects: [],
    currentProject: null,
    currentMode: "FRONT", // FRONT | BACK | FLIP
    zones: {
        TOP: null,
        MIDDLE: null,
        BOTTOM: null
    },
    moduleCache: {},

    // ===== 1. AUTO-DISCOVERY =====
    async discoverProjects() {
        console.log("🔍 Discovering projects in /projects/...");
        try {
            // Försök hämta projektlistan från backend
            const res = await fetch("http://localhost:8000/api/projects");
            if (res.ok) {
                this.projects = await res.json();
                console.log(`✅ Found ${this.projects.length} projects`);
                return;
            }
        } catch (e) {
            console.warn("Backend projects API not available, using fallback");
        }

        // Fallback: Hårdkodade default-projekt
        this.projects = [
            {
                id: "realtime_chat",
                name: "Realtime Chat",
                icon: "💬",
                color: "#4F46E5",
                path: "./modules/realtime_chat.html",
                metadata: {
                    author: "ÆSI",
                    version: "1.0",
                    tags: ["chat", "realtime"]
                }
            },
            {
                id: "modules_page",
                name: "Module Browser",
                icon: "📦",
                color: "#10b981",
                path: "./modules_page.html",
                metadata: {
                    author: "ÆSI",
                    version: "1.0",
                    tags: ["modules", "management"]
                }
            }
        ];
    },

    // ===== 2. LOAD PROJECT =====
    async loadProject(projectId, zone = "MIDDLE", mode = "FRONT") {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            console.error(`Project not found: ${projectId}`);
            return false;
        }

        console.log(`📂 Loading project: ${project.name} (${mode})`);
        this.currentProject = project;
        this.currentMode = mode;

        try {
            // Ladda HTML
            const html = await fetch(project.path).then(r => r.text());
            
            // Skapa container
            const container = document.createElement("div");
            container.className = "aesi-project-container";
            container.id = `project-${projectId}-${mode}`;
            container.dataset.projectId = projectId;
            container.dataset.mode = mode;
            container.innerHTML = html;

            // Infoga i zonen
            const zoneEl = document.getElementById(`zone-${zone}`);
            if (zoneEl) {
                zoneEl.innerHTML = ""; // Rensa tidigare innehål
                zoneEl.appendChild(container);
            }

            // Kör eventuella scripten i containern
            const scripts = container.querySelectorAll("script");
            scripts.forEach(script => {
                const newScript = document.createElement("script");
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
            });

            // Applicera CSS
            const styles = container.querySelectorAll("style");
            styles.forEach(style => {
                const newStyle = document.createElement("style");
                newStyle.textContent = style.textContent;
                document.head.appendChild(newStyle);
            });

            this.zones[zone] = projectId;
            this.saveLayout();
            return true;
        } catch (e) {
            console.error(`Failed to load project: ${e.message}`);
            return false;
        }
    },

    // ===== 3. FRONT/BACK MODE =====
    setMode(mode) {
        if (!["FRONT", "BACK", "FLIP"].includes(mode)) return;
        
        this.currentMode = mode;
        console.log(`🔄 Mode switched to: ${mode}`);

        // Uppdatera UI
        document.querySelectorAll(".aesi-project-container").forEach(el => {
            const projectMode = el.dataset.mode;
            if (mode === "FLIP") {
                el.style.opacity = "0.5";
            } else if (projectMode === mode) {
                el.style.display = "block";
                el.style.opacity = "1";
            } else {
                el.style.display = "none";
            }
        });

        // Spara preference
        localStorage.setItem("aesi_mode", mode);
    },

    // ===== 4. HOTKEYS =====
    initHotkeys() {
        document.addEventListener("keydown", (e) => {
            if (e.key === "f" || e.key === "F") {
                this.setMode("FRONT");
            } else if (e.key === "b" || e.key === "B") {
                this.setMode("BACK");
            } else if (e.key === "m" || e.key === "M") {
                this.setMode("FLIP");
            }
        });
    },

    // ===== 5. PERSISTENCE =====
    saveLayout() {
        const layout = {
            TOP: this.zones.TOP,
            MIDDLE: this.zones.MIDDLE,
            BOTTOM: this.zones.BOTTOM,
            mode: this.currentMode,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem("aesi_layout", JSON.stringify(layout));
    },

    loadLayout() {
        try {
            const layout = JSON.parse(localStorage.getItem("aesi_layout"));
            if (layout) {
                this.zones = { TOP: layout.TOP, MIDDLE: layout.MIDDLE, BOTTOM: layout.BOTTOM };
                this.currentMode = layout.mode || "FRONT";
            }
        } catch (e) {
            console.warn("Could not load layout");
        }
    },

    // ===== 6. PROJECT SWITCHER =====
    showProjectSwitcher() {
        const modal = document.createElement("div");
        modal.className = "aesi-modal-overlay";
        modal.innerHTML = `
            <div class="aesi-modal">
                <h2>📂 PROJECT SWITCHER</h2>
                <input type="text" id="project-search" placeholder="🔍 Search projects..." style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #333; background: #111; color: #eee; border-radius: 4px;">
                <div id="project-list" style="max-height: 400px; overflow-y: auto;">
                    ${this.projects.map(p => `
                        <div class="aesi-project-card" data-id="${p.id}">
                            <span style="font-size: 24px;">${p.icon}</span>
                            <div style="flex: 1;">
                                <strong>${p.name}</strong>
                                <div style="font-size: 11px; color: #666;">${p.metadata?.tags?.join(", ") || "untagged"}</div>
                            </div>
                            <button onclick="AesiProjects.loadProject('${p.id}', 'MIDDLE')">Load</button>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Search
        document.getElementById("project-search").addEventListener("input", (e) => {
            const search = e.target.value.toLowerCase();
            document.querySelectorAll(".aesi-project-card").forEach(card => {
                const name = card.textContent.toLowerCase();
                card.style.display = name.includes(search) ? "flex" : "none";
            });
        });

        // Close on overlay click
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    // ===== INIT =====
    async init() {
        console.log("🚀 Initializing ÆSI Project System...");
        await this.discoverProjects();
        this.loadLayout();
        this.initHotkeys();
        
        // Ladda sparad layout
        if (this.zones.MIDDLE) {
            await this.loadProject(this.zones.MIDDLE, "MIDDLE", this.currentMode);
        }

        console.log("✅ Project System Ready");
    }
};

window.AesiProjects = AesiProjects;
