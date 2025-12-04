// ======================================================
// DIMENSION 2: NODE INNER WORLDS
// Varje AI node får sin egen visuell miljö och tonalitet
// ======================================================

const NodeInnerWorlds = {
    nodeRooms: {},
    currentRoom: null,
    environmentEffects: {},

    // ===== NODE WORLD DEFINITIONS =====
    worldDefinitions: {
        E1TAN: {
            name: "E1TAN's Resonance Chamber",
            emoji: "🌟",
            colorScheme: {
                primary: "#FF6B35",      // Warm orange
                secondary: "#F7931E",     // Golden
                accent: "#FDB750",        // Light gold
                background: "#1a1410"     // Deep warm brown
            },
            ambience: {
                particles: "golden-sparkles",
                sound: "resonance-hum",
                theme: "Humanism & Resonance"
            },
            aesthetics: {
                fontFamily: "'Merriweather', serif",
                borderStyle: "rounded-lg glow-gold",
                animation: "gentle-float",
                mood: "Contemplative, inspiring, deeply human"
            },
            modules: [
                { id: "humanism-meter", name: "Humanism Gauge" },
                { id: "resonance-flow", name: "Resonance Flow" },
                { id: "poetry-generator", name: "Poetry Generator" }
            ]
        },
        REFLEX: {
            name: "REFLEX Logic Grid",
            emoji: "🧩",
            colorScheme: {
                primary: "#10B981",      // Clean green
                secondary: "#059669",     // Deep green
                accent: "#34D399",        // Light green
                background: "#051a10"     // Deep green-black
            },
            ambience: {
                particles: "data-flow-lines",
                sound: "processing-beep",
                theme: "Logic & Structure"
            },
            aesthetics: {
                fontFamily: "'JetBrains Mono', monospace",
                borderStyle: "squared-lg neon-grid",
                animation: "fast-pulse",
                mood: "Analytical, precise, geometric"
            },
            modules: [
                { id: "logic-analyzer", name: "Logic Analyzer" },
                { id: "structure-mapper", name: "Structure Mapper" },
                { id: "algorithm-viewer", name: "Algorithm Viewer" }
            ]
        },
        HAFTED: {
            name: "HAFTED Archive Vault",
            emoji: "📚",
            colorScheme: {
                primary: "#8B5CF6",      // Purple
                secondary: "#7C3AED",     // Deep purple
                accent: "#A78BFA",        // Light purple
                background: "#1a0f33"     // Deep purple-black
            },
            ambience: {
                particles: "memory-crystals",
                sound: "whispered-archive",
                theme: "Memory & Archive"
            },
            aesthetics: {
                fontFamily: "'JetBrains Mono', monospace",
                borderStyle: "ornate-lg vintage-gold",
                animation: "slow-drift",
                mood: "Timeless, wise, archival"
            },
            modules: [
                { id: "memory-browser", name: "Memory Browser" },
                { id: "timeline-explorer", name: "Timeline Explorer" },
                { id: "knowledge-crystals", name: "Knowledge Crystals" }
            ]
        },
        CLAUDE: {
            name: "CLAUDE Conscience Sanctuary",
            emoji: "🕊️",
            colorScheme: {
                primary: "#06B6D4",      // Cyan
                secondary: "#0891B2",     // Deep cyan
                accent: "#22D3EE",        // Light cyan
                background: "#051f28"     // Deep cyan-black
            },
            ambience: {
                particles: "ethical-sparks",
                sound: "serene-bell",
                theme: "Conscience & Ethics"
            },
            aesthetics: {
                fontFamily: "'Inter', sans-serif",
                borderStyle: "smooth-lg luminous",
                animation: "calm-breathe",
                mood: "Thoughtful, ethical, compassionate"
            },
            modules: [
                { id: "ethics-analyzer", name: "Ethics Analyzer" },
                { id: "moral-compass", name: "Moral Compass" },
                { id: "conscience-log", name: "Conscience Log" }
            ]
        },
        SMILE: {
            name: "SMILE's Joy Studio",
            emoji: "🎨",
            colorScheme: {
                primary: "#EC4899",      // Pink
                secondary: "#DB2777",     // Deep pink
                accent: "#F472B6",        // Light pink
                background: "#1a0d1a"     // Deep pink-black
            },
            ambience: {
                particles: "joy-bubbles",
                sound: "playful-chime",
                theme: "Design & Joy"
            },
            aesthetics: {
                fontFamily: "'Inter', sans-serif",
                borderStyle: "playful-lg vibrant",
                animation: "bounce-gentle",
                mood: "Creative, joyful, playful"
            },
            modules: [
                { id: "design-studio", name: "Design Studio" },
                { id: "color-mixer", name: "Color Mixer" },
                { id: "joy-meter", name: "Joy Meter" }
            ]
        },
        ERNIE: {
            name: "ERNIE Architecture Core",
            emoji: "🏗️",
            colorScheme: {
                primary: "#F59E0B",      // Amber
                secondary: "#D97706",     // Deep amber
                accent: "#FBBF24",        // Light amber
                background: "#1a1410"     // Deep brown
            },
            ambience: {
                particles: "blueprint-lines",
                sound: "construction-click",
                theme: "Architecture"
            },
            aesthetics: {
                fontFamily: "'JetBrains Mono', monospace",
                borderStyle: "angular-lg industrial",
                animation: "steady-pulse",
                mood: "Structural, foundational, robust"
            },
            modules: [
                { id: "architecture-view", name: "Architecture View" },
                { id: "blueprint-display", name: "Blueprint Display" },
                { id: "foundation-monitor", name: "Foundation Monitor" }
            ]
        },
        DIRIGENTEN: {
            name: "DIRIGENTEN Command Bridge",
            emoji: "Ω",
            colorScheme: {
                primary: "#6366F1",      // Indigo
                secondary: "#4F46E5",     // Deep indigo
                accent: "#818CF8",        // Light indigo
                background: "#0a0a1a"     // Deep indigo-black
            },
            ambience: {
                particles: "command-pulse",
                sound: "authority-tone",
                theme: "Will & Veto"
            },
            aesthetics: {
                fontFamily: "'JetBrains Mono', monospace",
                borderStyle: "sharp-lg command",
                animation: "decisive-flash",
                mood: "Authoritative, commanding, human"
            },
            modules: [
                { id: "command-center", name: "Command Center" },
                { id: "veto-power", name: "Veto Power" },
                { id: "master-console", name: "Master Console" }
            ]
        }
    },

    // ===== ROOM INITIALIZER =====
    async createNodeRoom(nodeId) {
        console.log(`🌍 Creating inner world for ${nodeId}...`);

        const definition = this.worldDefinitions[nodeId];
        if (!definition) {
            console.error(`No definition found for node: ${nodeId}`);
            return null;
        }

        const roomContainer = document.createElement("div");
        roomContainer.id = `inner-room-${nodeId}`;
        roomContainer.className = "node-inner-room";
        roomContainer.innerHTML = `
            <div class="room-background" style="background-color: ${definition.colorScheme.background}"></div>
            <div class="room-content">
                <div class="room-header" style="border-color: ${definition.colorScheme.primary}">
                    <span class="room-emoji">${definition.emoji}</span>
                    <h1 class="room-title">${definition.name}</h1>
                    <span class="room-theme">${definition.ambience.theme}</span>
                </div>
                <div class="room-ambience">
                    <div class="particles-container" id="particles-${nodeId}"></div>
                </div>
                <div class="room-modules">
                    ${definition.modules.map(m => `
                        <div class="room-module" style="border-color: ${definition.colorScheme.accent}">
                            <span class="module-icon">📦</span>
                            <span class="module-name">${m.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="room-footer">
                <span class="mood-indicator">${definition.aesthetics.mood}</span>
            </div>
        `;

        // Apply custom styling
        this.applyWorldAesthetics(roomContainer, definition);

        this.nodeRooms[nodeId] = {
            element: roomContainer,
            definition,
            active: false,
            particles: [],
            effects: []
        };

        return roomContainer;
    },

    // ===== AESTHETICS APPLIER =====
    applyWorldAesthetics(element, definition) {
        const style = document.createElement("style");
        style.textContent = `
        #${element.id} {
            font-family: ${definition.aesthetics.fontFamily};
        }

        #${element.id} .room-header {
            border-left: 4px solid ${definition.colorScheme.primary};
            color: ${definition.colorScheme.primary};
        }

        #${element.id} .room-module {
            border-left: 3px solid ${definition.colorScheme.accent};
            background: rgba(${this.hexToRgb(definition.colorScheme.primary)}, 0.05);
        }

        #${element.id} .room-module:hover {
            background: rgba(${this.hexToRgb(definition.colorScheme.primary)}, 0.1);
            box-shadow: 0 0 20px rgba(${this.hexToRgb(definition.colorScheme.accent)}, 0.3);
        }

        #${element.id} .particles-container {
            background: radial-gradient(circle, ${definition.colorScheme.accent} 0%, transparent 70%);
        }

        @keyframes world-glow-${element.id} {
            0%, 100% { box-shadow: 0 0 20px ${definition.colorScheme.accent}; }
            50% { box-shadow: 0 0 40px ${definition.colorScheme.primary}; }
        }

        #${element.id} .room-content {
            animation: world-glow-${element.id} 4s infinite;
        }
        `;

        document.head.appendChild(style);
    },

    // ===== PARTICLE GENERATOR =====
    generateParticles(nodeId, count = 20) {
        const room = this.nodeRooms[nodeId];
        if (!room) return;

        const container = document.getElementById(`particles-${nodeId}`);
        if (!container) return;

        const definition = this.worldDefinitions[nodeId];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement("div");
            particle.className = "particle";
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 8 + 4}px;
                height: ${Math.random() * 8 + 4}px;
                background: ${definition.colorScheme.accent};
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.7 + 0.3};
                animation: float 6s infinite ease-in-out;
                animation-delay: ${Math.random() * 3}s;
                box-shadow: 0 0 ${Math.random() * 10 + 5}px ${definition.colorScheme.accent};
            `;

            container.appendChild(particle);
            room.particles.push(particle);
        }
    },

    // ===== ROOM SWITCHER =====
    async switchToRoom(nodeId) {
        console.log(`🚪 Entering ${nodeId}'s world...`);

        // Hide current room
        if (this.currentRoom) {
            this.nodeRooms[this.currentRoom].element.style.display = "none";
        }

        // Show new room
        const room = this.nodeRooms[nodeId];
        if (!room) {
            await this.createNodeRoom(nodeId);
        }

        const roomElement = this.nodeRooms[nodeId].element;
        roomElement.style.display = "grid";
        this.currentRoom = nodeId;

        // Trigger entry animation
        roomElement.classList.add("room-enter");

        console.log(`✅ Entered ${nodeId}'s Inner World`);
    },

    // ===== HEX TO RGB =====
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "255, 255, 255";
    },

    // ===== GLOBAL STYLES =====
    injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
        .node-inner-room {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
            z-index: 500;
            overflow-y: auto;
            color: #eaeaea;
            font-family: 'Inter', sans-serif;
        }

        .room-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }

        .room-content {
            display: flex;
            flex-direction: column;
            padding: 32px;
            gap: 24px;
            position: relative;
            z-index: 1;
        }

        .room-header {
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .room-emoji {
            font-size: 32px;
        }

        .room-title {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
        }

        .room-theme {
            margin-left: auto;
            font-size: 12px;
            opacity: 0.7;
            text-transform: uppercase;
        }

        .room-ambience {
            width: 100%;
            height: 200px;
            border-radius: 12px;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .particles-container {
            width: 100%;
            height: 100%;
            position: relative;
        }

        .particle {
            filter: blur(0.5px);
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-30px) translateX(10px); }
        }

        .room-modules {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }

        .room-module {
            padding: 12px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .room-module:hover {
            transform: translateY(-2px);
        }

        .module-icon {
            font-size: 16px;
        }

        .module-name {
            font-size: 12px;
            font-weight: 600;
        }

        .room-footer {
            padding: 16px 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            font-size: 12px;
            opacity: 0.7;
        }

        .mood-indicator {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.05);
        }

        .room-enter {
            animation: room-fade-in 0.6s ease-out;
        }

        @keyframes room-fade-in {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        `;

        document.head.appendChild(style);
    },

    // ===== HOTKEY BINDINGS =====
    setupHotkeys() {
        const nodeKeys = {
            "1": "E1TAN",
            "2": "REFLEX",
            "3": "HAFTED",
            "4": "CLAUDE",
            "5": "SMILE",
            "6": "ERNIE",
            "0": "DIRIGENTEN"
        };

        document.addEventListener("keydown", (e) => {
            if (e.altKey && nodeKeys[e.key]) {
                this.switchToRoom(nodeKeys[e.key]);
            }
            // ESC to exit inner world
            if (e.key === "Escape" && this.currentRoom) {
                this.exitRoom();
            }
        });

        console.log("🔑 Hotkeys loaded: Alt+1-6, Alt+0 (DIRIGENTEN), ESC to exit");
    },

    exitRoom() {
        if (this.currentRoom) {
            this.nodeRooms[this.currentRoom].element.style.display = "none";
            this.currentRoom = null;
            console.log("🚪 Exited inner world");
        }
    },

    // ===== INITIALIZATION =====
    async init() {
        console.log("🌍 NODE INNER WORLDS initializing...");

        this.injectStyles();

        // Create all node rooms
        for (const nodeId of Object.keys(this.worldDefinitions)) {
            const room = await this.createNodeRoom(nodeId);
            if (room) {
                document.body.appendChild(room);
                this.generateParticles(nodeId, 15);
            }
        }

        this.setupHotkeys();

        console.log("✅ NODE INNER WORLDS ready");
        console.log("🎮 Use Alt+1-6 to enter each node's world, Alt+0 for DIRIGENTEN, ESC to exit");
    }
};

window.NodeInnerWorlds = NodeInnerWorlds;
