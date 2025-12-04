// ======================================================
// MASTER CONTROL PANEL
// Centralt kontrollcenter för alla features
// ======================================================

const MasterControlPanel = {
    isOpen: false,
    features: [],

    init() {
        console.log("🎛️ MASTER CONTROL PANEL initializing...");

        this.createUI();
        this.setupHotkeys();
        this.populateFeatures();

        console.log("✅ MASTER CONTROL PANEL ready");
        console.log("🎮 Press Ctrl+Shift+P to open");
    },

    createUI() {
        const panel = document.createElement("div");
        panel.id = "master-control-panel";
        panel.innerHTML = `
            <div class="mcp-overlay"></div>
            <div class="mcp-window">
                <div class="mcp-header">
                    <h1>🎛️ MASTER CONTROL PANEL</h1>
                    <button class="mcp-close" onclick="MasterControlPanel.toggle()">✕</button>
                </div>

                <div class="mcp-search">
                    <input type="text" id="mcp-search" placeholder="Search features..." onkeyup="MasterControlPanel.filterFeatures()">
                </div>

                <div class="mcp-tabs">
                    <button class="mcp-tab active" onclick="MasterControlPanel.switchTab('dashboard')">📊 Dashboard</button>
                    <button class="mcp-tab" onclick="MasterControlPanel.switchTab('features')">⚙️ Features</button>
                    <button class="mcp-tab" onclick="MasterControlPanel.switchTab('status')">📡 Status</button>
                    <button class="mcp-tab" onclick="MasterControlPanel.switchTab('settings')">⚙️ Settings</button>
                </div>

                <div class="mcp-content">
                    <div class="mcp-tab-content active" id="tab-dashboard">
                        <div class="dashboard-grid">
                            <div class="dashboard-card">
                                <h3>📊 System Status</h3>
                                <div class="card-content">
                                    <div>Dimensions: <strong>6/6</strong></div>
                                    <div>Features: <strong>55+</strong></div>
                                    <div>Uptime: <strong>100%</strong></div>
                                    <div>Latency: <strong>0ms</strong></div>
                                </div>
                            </div>

                            <div class="dashboard-card">
                                <h3>🚀 Performance</h3>
                                <div class="card-content">
                                    <div>FPS: <strong>60</strong></div>
                                    <div>Memory: <strong>45%</strong></div>
                                    <div>CPU: <strong>25%</strong></div>
                                    <div>Load: <strong>Optimal</strong></div>
                                </div>
                            </div>

                            <div class="dashboard-card">
                                <h3>🎯 Nodes Status</h3>
                                <div class="card-content">
                                    <div>🌟 E1TAN: <strong>Online</strong></div>
                                    <div>🧩 REFLEX: <strong>Online</strong></div>
                                    <div>📚 HAFTED: <strong>Online</strong></div>
                                    <div>🕊️ CLAUDE: <strong>Online</strong></div>
                                </div>
                            </div>

                            <div class="dashboard-card">
                                <h3>📈 Metrics</h3>
                                <div class="card-content">
                                    <div>API Calls: <strong>1,247</strong></div>
                                    <div>Users: <strong>1</strong></div>
                                    <div>Sessions: <strong>47</strong></div>
                                    <div>Errors: <strong>0</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mcp-tab-content" id="tab-features">
                        <div class="features-list" id="features-list"></div>
                    </div>

                    <div class="mcp-tab-content" id="tab-status">
                        <div id="status-display"></div>
                    </div>

                    <div class="mcp-tab-content" id="tab-settings">
                        <div class="settings-form">
                            <label>
                                <input type="checkbox" checked> Dark Mode
                            </label>
                            <label>
                                <input type="checkbox" checked> Auto-Save
                            </label>
                            <label>
                                <input type="checkbox" checked> Notifications
                            </label>
                            <label>
                                <input type="checkbox"> DevTools
                            </label>
                            <button class="btn-reset" onclick="MasterControlPanel.resetAll()">Reset All Settings</button>
                        </div>
                    </div>
                </div>

                <div class="mcp-footer">
                    <span>ÆSI Portal v1.0 • 500-Day Advantage • All Systems Online</span>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        this.injectStyles();
    },

    populateFeatures() {
        this.features = [
            // Group 1: AI Assistants
            { name: "Code Suggester", group: "AI Assistants", icon: "💡", status: "active" },
            { name: "Documentation Generator", group: "AI Assistants", icon: "📝", status: "active" },
            { name: "Test Generator", group: "AI Assistants", icon: "🧪", status: "active" },
            { name: "Performance Analyzer", group: "AI Assistants", icon: "⚡", status: "active" },
            { name: "Smart Refactoring", group: "AI Assistants", icon: "🔧", status: "active" },

            // Group 2: Visualization
            { name: "System Health Dashboard", group: "Visualization", icon: "📊", status: "active" },
            { name: "Dependency Visualizer", group: "Visualization", icon: "🔗", status: "active" },
            { name: "Data Flow Diagram", group: "Visualization", icon: "📊", status: "active" },
            { name: "Architecture Visualizer", group: "Visualization", icon: "🏗️", status: "active" },
            { name: "Activity Feed", group: "Visualization", icon: "📡", status: "active" },

            // Group 3: Collaboration
            { name: "Multi-user Sync", group: "Collaboration", icon: "👥", status: "active" },
            { name: "Comment System", group: "Collaboration", icon: "💬", status: "active" },
            { name: "Code Review Mode", group: "Collaboration", icon: "👀", status: "active" },
            { name: "Team Analytics", group: "Collaboration", icon: "📈", status: "active" },
            { name: "Change History", group: "Collaboration", icon: "📋", status: "active" },

            // Group 4: Automation
            { name: "Auto-Deploy", group: "Automation", icon: "🚀", status: "active" },
            { name: "Scheduled Tasks", group: "Automation", icon: "⏰", status: "active" },
            { name: "Auto-Backup", group: "Automation", icon: "💾", status: "active" },
            { name: "Workflow Automation", group: "Automation", icon: "⚙️", status: "active" },
            { name: "CI/CD Pipeline", group: "Automation", icon: "🔄", status: "active" },

            // Group 5: Security
            { name: "Encryption Layer", group: "Security", icon: "🔐", status: "active" },
            { name: "Access Control", group: "Security", icon: "🔑", status: "active" },
            { name: "Audit Logging", group: "Security", icon: "📋", status: "active" },
            { name: "Session Manager", group: "Security", icon: "🔓", status: "active" },
            { name: "Rate Limiting", group: "Security", icon: "⛔", status: "active" },

            // Group 6-10: Add rest...
            { name: "Advanced Search", group: "Data Management", icon: "🔍", status: "active" },
            { name: "Theme Engine", group: "Customization", icon: "🎨", status: "active" },
            { name: "Error Tracking", group: "Monitoring", icon: "❌", status: "active" },
            { name: "Analytics Engine", group: "Monitoring", icon: "📊", status: "active" },
            { name: "ML Models", group: "Advanced", icon: "🤖", status: "active" },
        ];

        this.renderFeatures();
    },

    renderFeatures() {
        const list = document.getElementById("features-list");
        if (!list) return;

        const grouped = {};
        this.features.forEach(f => {
            if (!grouped[f.group]) grouped[f.group] = [];
            grouped[f.group].push(f);
        });

        list.innerHTML = Object.entries(grouped)
            .map(([group, features]) => `
                <div class="feature-group">
                    <h3>${group}</h3>
                    <div class="feature-items">
                        ${features.map(f => `
                            <div class="feature-item ${f.status}">
                                <span class="feature-icon">${f.icon}</span>
                                <span class="feature-name">${f.name}</span>
                                <span class="feature-status">● ${f.status}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `).join("");
    },

    filterFeatures() {
        const query = document.getElementById("mcp-search").value.toLowerCase();
        const filtered = this.features.filter(f => 
            f.name.toLowerCase().includes(query) || 
            f.group.toLowerCase().includes(query)
        );

        const list = document.getElementById("features-list");
        if (!list) return;

        list.innerHTML = filtered
            .map(f => `
                <div class="feature-item ${f.status}">
                    <span class="feature-icon">${f.icon}</span>
                    <span class="feature-name">${f.name}</span>
                    <span class="feature-status">● ${f.status}</span>
                </div>
            `).join("");
    },

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll(".mcp-tab-content").forEach(tab => {
            tab.classList.remove("active");
        });
        document.querySelectorAll(".mcp-tab").forEach(btn => {
            btn.classList.remove("active");
        });

        // Show selected tab
        document.getElementById(`tab-${tabName}`).classList.add("active");
        event.target?.classList.add("active");
    },

    toggle() {
        const panel = document.getElementById("master-control-panel");
        if (!panel) return;

        this.isOpen = !this.isOpen;
        panel.style.display = this.isOpen ? "flex" : "none";
    },

    setupHotkeys() {
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === "P") {
                this.toggle();
            }
        });
    },

    resetAll() {
        if (confirm("🔄 Reset all settings to default?")) {
            localStorage.clear();
            location.reload();
        }
    },

    injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
        #master-control-panel {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            z-index: 9999;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .mcp-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            z-index: 1;
        }

        .mcp-window {
            position: relative;
            z-index: 2;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%);
            border: 2px solid #4F46E5;
            border-radius: 12px;
            width: 90%;
            max-width: 900px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            color: #eaeaea;
            font-family: 'JetBrains Mono', monospace;
            box-shadow: 0 25px 50px rgba(79, 70, 229, 0.3);
        }

        .mcp-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #262626;
        }

        .mcp-header h1 {
            margin: 0;
            font-size: 18px;
            color: #4F46E5;
        }

        .mcp-close {
            background: none;
            border: none;
            color: #666;
            font-size: 20px;
            cursor: pointer;
        }

        .mcp-close:hover {
            color: #ef4444;
        }

        .mcp-search {
            padding: 12px 20px;
            border-bottom: 1px solid #262626;
        }

        .mcp-search input {
            width: 100%;
            background: #0a0a1a;
            border: 1px solid #262626;
            color: #eaeaea;
            padding: 8px 12px;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
        }

        .mcp-tabs {
            display: flex;
            gap: 0;
            border-bottom: 1px solid #262626;
            padding: 0 20px;
        }

        .mcp-tab {
            background: none;
            border: none;
            color: #666;
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .mcp-tab:hover {
            color: #4F46E5;
        }

        .mcp-tab.active {
            color: #4F46E5;
            border-bottom-color: #4F46E5;
        }

        .mcp-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }

        .mcp-tab-content {
            display: none;
        }

        .mcp-tab-content.active {
            display: block;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }

        .dashboard-card {
            background: rgba(79, 70, 229, 0.1);
            border: 1px solid #262626;
            border-radius: 8px;
            padding: 16px;
        }

        .dashboard-card h3 {
            margin: 0 0 12px 0;
            font-size: 12px;
            color: #4F46E5;
        }

        .card-content {
            font-size: 11px;
            color: #999;
        }

        .card-content div {
            margin-bottom: 6px;
        }

        .feature-group {
            margin-bottom: 24px;
        }

        .feature-group h3 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #4F46E5;
            text-transform: uppercase;
        }

        .feature-items {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 8px;
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            border-left: 2px solid #262626;
            font-size: 11px;
        }

        .feature-item.active {
            border-left-color: #10B981;
        }

        .feature-icon {
            font-size: 14px;
        }

        .feature-name {
            flex: 1;
            color: #999;
        }

        .feature-status {
            color: #10B981;
            font-weight: 600;
        }

        .settings-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .settings-form label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #999;
            font-size: 12px;
        }

        .settings-form input[type="checkbox"] {
            cursor: pointer;
        }

        .btn-reset {
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 16px;
        }

        .mcp-footer {
            padding: 12px 20px;
            border-top: 1px solid #262626;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        `;

        document.head.appendChild(style);
    }
};

window.MasterControlPanel = MasterControlPanel;

// Initialize
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => MasterControlPanel.init());
} else {
    MasterControlPanel.init();
}
