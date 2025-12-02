// ======================================================
// DIMENSION 4: META-PULSE GRID
// 3D real-time system visualization med WebGL/Canvas
// ======================================================

const MetaPulseGrid = {
    canvas: null,
    ctx: null,
    nodes: [],
    modules: [],
    connections: [],
    pulses: [],
    grid: {
        width: 800,
        height: 600,
        cols: 16,
        rows: 12,
        cellSize: 50
    },
    animationId: null,
    running: false,

    // ===== NODE DEFINITIONS =====
    nodeDefinitions: {
        E1TAN: { x: 1, y: 1, color: "#FF6B35", label: "E1TAN", emoji: "🌟" },
        REFLEX: { x: 4, y: 1, color: "#10B981", label: "REFLEX", emoji: "🧩" },
        HAFTED: { x: 7, y: 1, color: "#8B5CF6", label: "HAFTED", emoji: "📚" },
        CLAUDE: { x: 10, y: 1, color: "#06B6D4", label: "CLAUDE", emoji: "🕊️" },
        SMILE: { x: 13, y: 1, color: "#EC4899", label: "SMILE", emoji: "🎨" },
        ERNIE: { x: 1, y: 5, color: "#F59E0B", label: "ERNIE", emoji: "🏗️" },
        DIRIGENTEN: { x: 8, y: 11, color: "#6366F1", label: "DIRIGENTEN", emoji: "Ω" }
    },

    // ===== INITIALIZATION =====
    init() {
        console.log("🫀 META-PULSE GRID initializing...");

        this.createCanvas();
        this.setupNodes();
        this.injectStyles();
        this.setupEventListeners();

        if (window.AesiBridge && window.AesiBridge.eventBus) {
            AesiBridge.eventBus.on("node-activity", (data) => this.onNodeActivity(data));
        }

        this.running = true;
        this.animate();

        console.log("✅ META-PULSE GRID ready");
    },

    // ===== CANVAS CREATION =====
    createCanvas() {
        const container = document.createElement("div");
        container.id = "meta-pulse-container";
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: ${this.grid.width}px;
            height: ${this.grid.height}px;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border: 2px solid #4F46E5;
            border-radius: 12px;
            z-index: 350;
            box-shadow: 0 20px 60px rgba(79, 70, 229, 0.3);
            overflow: hidden;
        `;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.grid.width;
        this.canvas.height = this.grid.height;
        this.canvas.style.display = "block";

        this.ctx = this.canvas.getContext("2d");

        container.appendChild(this.canvas);
        document.body.appendChild(container);

        // Title
        const title = document.createElement("div");
        title.style.cssText = `
            position: absolute;
            top: 8px;
            left: 12px;
            color: #4F46E5;
            font-size: 12px;
            font-weight: 700;
            z-index: 10;
        `;
        title.textContent = "🫀 META-PULSE GRID";
        container.appendChild(title);
    },

    // ===== NODES SETUP =====
    setupNodes() {
        for (const [nodeId, def] of Object.entries(this.nodeDefinitions)) {
            this.nodes.push({
                id: nodeId,
                x: def.x * this.grid.cellSize + this.grid.cellSize / 2,
                y: def.y * this.grid.cellSize + this.grid.cellSize / 2,
                color: def.color,
                label: def.label,
                emoji: def.emoji,
                activity: 0,
                pulseRadius: 0,
                connections: []
            });
        }

        // Setup connections between nodes
        this.nodes.forEach(node => {
            if (node.id !== "DIRIGENTEN") {
                // All nodes connect to DIRIGENTEN
                node.connections.push("DIRIGENTEN");
            }
            // All nodes connect to each other in a mesh
            this.nodes.forEach(other => {
                if (other.id !== node.id && !node.connections.includes(other.id)) {
                    if (Math.random() > 0.7) { // 30% chance of additional connection
                        node.connections.push(other.id);
                    }
                }
            });
        });
    },

    // ===== RENDERING =====
    render() {
        const ctx = this.ctx;

        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, this.grid.width, this.grid.height);
        gradient.addColorStop(0, "rgba(10, 10, 10, 0.9)");
        gradient.addColorStop(1, "rgba(26, 26, 26, 0.9)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.grid.width, this.grid.height);

        // Draw grid
        this.drawGrid();

        // Draw connections
        this.drawConnections();

        // Draw pulses
        this.drawPulses();

        // Draw nodes
        this.drawNodes();

        // Draw info panel
        this.drawInfoPanel();
    },

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = "rgba(79, 70, 229, 0.05)";
        ctx.lineWidth = 0.5;

        // Vertical lines
        for (let x = 0; x <= this.grid.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.grid.cellSize, 0);
            ctx.lineTo(x * this.grid.cellSize, this.grid.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.grid.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.grid.cellSize);
            ctx.lineTo(this.grid.width, y * this.grid.cellSize);
            ctx.stroke();
        }
    },

    drawConnections() {
        const ctx = this.ctx;

        this.nodes.forEach(node => {
            node.connections.forEach(connectionId => {
                const target = this.nodes.find(n => n.id === connectionId);
                if (!target) return;

                // Draw line
                ctx.strokeStyle = `rgba(${this.hexToRgb(node.color)}, 0.2)`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();

                // Draw midpoint glow
                const midX = (node.x + target.x) / 2;
                const midY = (node.y + target.y) / 2;

                const glowGradient = ctx.createRadialGradient(midX, midY, 0, midX, midY, 20);
                glowGradient.addColorStop(0, `rgba(${this.hexToRgb(node.color)}, 0.3)`);
                glowGradient.addColorStop(1, `rgba(${this.hexToRgb(node.color)}, 0)`);

                ctx.fillStyle = glowGradient;
                ctx.fillRect(midX - 20, midY - 20, 40, 40);
            });
        });
    },

    drawPulses() {
        const ctx = this.ctx;

        // Update pulses
        this.pulses = this.pulses.filter(p => p.life > 0);

        this.pulses.forEach(pulse => {
            const node = this.nodes.find(n => n.id === pulse.nodeId);
            if (!node) return;

            const alpha = pulse.life / pulse.maxLife;
            const radius = (1 - pulse.life / pulse.maxLife) * 40;

            const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius);
            gradient.addColorStop(0, `rgba(${this.hexToRgb(node.color)}, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(${this.hexToRgb(node.color)}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw connection pulses
            if (pulse.targetId) {
                const target = this.nodes.find(n => n.id === pulse.targetId);
                if (target) {
                    const x = node.x + (target.x - node.x) * (1 - pulse.life / pulse.maxLife);
                    const y = node.y + (target.y - node.y) * (1 - pulse.life / pulse.maxLife);

                    ctx.fillStyle = `rgba(${this.hexToRgb(node.color)}, ${alpha * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            pulse.life -= 0.5;
        });
    },

    drawNodes() {
        const ctx = this.ctx;

        this.nodes.forEach(node => {
            // Draw node glow
            if (node.activity > 0) {
                const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 30);
                glow.addColorStop(0, `rgba(${this.hexToRgb(node.color)}, ${node.activity * 0.6})`);
                glow.addColorStop(1, `rgba(${this.hexToRgb(node.color)}, 0)`);

                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
                ctx.fill();

                node.activity *= 0.95; // Decay activity
            }

            // Draw node circle
            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Draw node border
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
            ctx.stroke();

            // Draw label
            ctx.fillStyle = node.color;
            ctx.font = "bold 10px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(`${node.emoji}`, node.x, node.y + 16);
        });
    },

    drawInfoPanel() {
        const ctx = this.ctx;
        const panelHeight = 60;

        // Panel background
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, this.grid.height - panelHeight, this.grid.width, panelHeight);

        // Text
        ctx.fillStyle = "#10B981";
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        const activeNodes = this.nodes.filter(n => n.activity > 0.1).length;
        const totalPulses = this.pulses.length;

        ctx.fillText(`Nodes Active: ${activeNodes}/${this.nodes.length}`, 8, this.grid.height - 48);
        ctx.fillText(`Pulses: ${totalPulses}`, 8, this.grid.height - 32);
        ctx.fillText(`Connections: ${this.nodes.reduce((sum, n) => sum + n.connections.length, 0)}`, 8, this.grid.height - 16);
    },

    // ===== ANIMATION LOOP =====
    animate() {
        this.render();
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    // ===== EVENT HANDLERS =====
    onNodeActivity(data) {
        const node = this.nodes.find(n => n.id === data.nodeId);
        if (!node) return;

        node.activity = 1;

        // Create pulse
        this.createPulse(data.nodeId);

        // If there's a target node, create connection pulse
        if (data.targetNodeId) {
            this.createConnectionPulse(data.nodeId, data.targetNodeId);
        }

        console.log(`🫀 Pulse from ${data.nodeId}`);
    },

    createPulse(nodeId, targetId = null) {
        this.pulses.push({
            nodeId,
            targetId,
            life: 30,
            maxLife: 30
        });
    },

    createConnectionPulse(fromId, toId) {
        this.pulses.push({
            nodeId: fromId,
            targetId: toId,
            life: 20,
            maxLife: 20
        });
    },

    // ===== UTILITY FUNCTIONS =====
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "255, 255, 255";
    },

    setupEventListeners() {
        // Listen to document events
        document.addEventListener("keydown", (e) => {
            if (e.key === "G" && e.ctrlKey) {
                // Ctrl+G to show/hide Meta-Pulse Grid
                const container = document.getElementById("meta-pulse-container");
                if (container) {
                    container.style.display = container.style.display === "none" ? "block" : "none";
                }
            }
        });
    },

    injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
        #meta-pulse-container {
            box-sizing: border-box;
        }

        #meta-pulse-container canvas {
            border-radius: 10px;
        }
        `;

        document.head.appendChild(style);
    },

    // ===== TESTING =====
    simulateActivity() {
        const randomNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        const randomTarget = this.nodes[Math.floor(Math.random() * this.nodes.length)];

        this.onNodeActivity({
            nodeId: randomNode.id,
            targetNodeId: randomTarget.id
        });
    }
};

window.MetaPulseGrid = MetaPulseGrid;
