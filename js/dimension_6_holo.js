// ======================================================
// DIMENSION 6: Æ-HOLO
// 3D holographic rendering av dataflöden och arkitektur
// ======================================================

const AeHolo = {
    canvas: null,
    ctx: null,
    particles: [],
    holograms: [],
    rotationX: 0,
    rotationY: 0,
    time: 0,
    size: {
        width: 600,
        height: 600
    },

    // ===== INITIALIZATION =====
    init() {
        console.log("🌌 DIMENSION 6: Æ-HOLO initializing...");

        this.createCanvas();
        this.initParticles();
        this.injectStyles();
        this.setupControls();
        this.animate();

        console.log("✅ DIMENSION 6: Æ-HOLO ready");
        console.log("🎮 Use mouse to rotate, scroll to zoom");
    },

    // ===== CANVAS SETUP =====
    createCanvas() {
        const container = document.createElement("div");
        container.id = "ae-holo-container";
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: ${this.size.width}px;
            height: ${this.size.height}px;
            background: radial-gradient(circle at center, rgba(79, 70, 229, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%);
            border: 2px solid #4F46E5;
            border-radius: 12px;
            z-index: 250;
            box-shadow: 0 0 60px rgba(79, 70, 229, 0.3), inset 0 0 60px rgba(79, 70, 229, 0.1);
            overflow: hidden;
        `;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.size.width;
        this.canvas.height = this.size.height;
        this.ctx = this.canvas.getContext("2d");

        container.appendChild(this.canvas);

        // Title
        const title = document.createElement("div");
        title.style.cssText = `
            position: absolute;
            top: 8px;
            right: 12px;
            color: #4F46E5;
            font-size: 11px;
            font-weight: 700;
            z-index: 10;
        `;
        title.textContent = "Æ-HOLO";
        container.appendChild(title);

        document.body.appendChild(container);
    },

    // ===== PARTICLE SYSTEM =====
    initParticles() {
        // Create a 3D cube of particles
        const gridSize = 8;
        const spacing = 40;
        const offset = (gridSize * spacing) / 2;

        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                for (let z = 0; z < gridSize; z++) {
                    this.particles.push({
                        x: x * spacing - offset,
                        y: y * spacing - offset,
                        z: z * spacing - offset,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        vz: (Math.random() - 0.5) * 0.5,
                        color: this.randomColor(),
                        size: Math.random() * 2 + 1,
                        lifespan: Math.random() * 200 + 100
                    });
                }
            }
        }
    },

    // ===== 3D PROJECTION =====
    project3D(point) {
        // Apply rotations
        let x = point.x;
        let y = point.y * Math.cos(this.rotationX) - point.z * Math.sin(this.rotationX);
        let z = point.y * Math.sin(this.rotationX) + point.z * Math.cos(this.rotationX);

        let x2 = x * Math.cos(this.rotationY) + z * Math.sin(this.rotationY);
        let z2 = -x * Math.sin(this.rotationY) + z * Math.cos(this.rotationY);

        x = x2;
        z = z2 + 150; // Move away from camera

        // Perspective projection
        const scale = 300 / Math.max(z, 1);
        
        return {
            x: this.size.width / 2 + x * scale,
            y: this.size.height / 2 + y * scale,
            z: z,
            scale: scale
        };
    },

    // ===== RENDERING =====
    render() {
        const ctx = this.ctx;

        // Clear with glow effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, this.size.width, this.size.height);

        // Add glow background
        const glowGradient = ctx.createRadialGradient(
            this.size.width / 2,
            this.size.height / 2,
            0,
            this.size.width / 2,
            this.size.height / 2,
            this.size.width / 2
        );
        glowGradient.addColorStop(0, "rgba(79, 70, 229, 0.05)");
        glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, this.size.width, this.size.height);

        // Draw holograms (data structures)
        this.drawHolograms();

        // Draw particles
        const projectedParticles = this.particles.map(p => {
            // Update particle position
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            // Bounce off boundaries
            const boundary = 150;
            if (Math.abs(p.x) > boundary) p.vx *= -1;
            if (Math.abs(p.y) > boundary) p.vy *= -1;
            if (Math.abs(p.z) > boundary) p.vz *= -1;

            const proj = this.project3D(p);
            return { ...p, ...proj };
        });

        // Sort by depth (painter's algorithm)
        projectedParticles.sort((a, b) => a.z - b.z);

        // Draw sorted particles
        projectedParticles.forEach(p => {
            if (p.x > 0 && p.x < this.size.width && p.y > 0 && p.y < this.size.height) {
                // Glow effect
                const glowSize = p.size * p.scale * 3;
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
                gradient.addColorStop(0, p.color.replace("1)", "0.6)"));
                gradient.addColorStop(1, p.color.replace("1)", "0)"));

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
                ctx.fill();

                // Core particle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw info
        this.drawInfo();

        // Update rotation
        this.rotationY += 0.005;
        this.rotationX += 0.002;
        this.time++;
    },

    drawHolograms() {
        const ctx = this.ctx;

        // Central hologram structure
        const centerX = this.size.width / 2;
        const centerY = this.size.height / 2;

        // Draw holographic rings
        const rings = [40, 80, 120];
        rings.forEach((radius, index) => {
            ctx.strokeStyle = `rgba(79, 70, 229, ${0.3 - index * 0.08})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Rotating ring
            const rotation = this.time * (0.01 + index * 0.005);
            ctx.strokeStyle = `rgba(79, 70, 229, ${0.5 - index * 0.1})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, rotation, rotation + Math.PI * 0.5);
            ctx.stroke();
        });

        // Draw data points on rings
        const dataPoints = 12;
        for (let ring = 0; ring < rings.length; ring++) {
            for (let i = 0; i < dataPoints; i++) {
                const angle = (i / dataPoints) * Math.PI * 2 + this.time * 0.02;
                const radius = rings[ring];
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                ctx.fillStyle = `rgba(79, 70, 229, ${0.7 - ring * 0.2})`;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();

                // Connect to center
                if (i % 3 === 0) {
                    ctx.strokeStyle = `rgba(79, 70, 229, ${0.2 - ring * 0.05})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            }
        }

        // Central energy core
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
        coreGradient.addColorStop(0, "rgba(255, 107, 53, 0.8)");
        coreGradient.addColorStop(0.5, "rgba(79, 70, 229, 0.4)");
        coreGradient.addColorStop(1, "rgba(79, 70, 229, 0)");

        ctx.fillStyle = coreGradient;
        ctx.fillRect(centerX - 30, centerY - 30, 60, 60);

        // Pulsing core
        const pulseSize = 8 + Math.sin(this.time * 0.05) * 3;
        ctx.fillStyle = "rgba(255, 200, 87, 0.9)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
    },

    drawInfo() {
        const ctx = this.ctx;
        ctx.fillStyle = "rgba(79, 70, 229, 0.5)";
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";

        const info = [
            `Particles: ${this.particles.length}`,
            `Rotation: ${(this.rotationY % (Math.PI * 2)).toFixed(2)}`,
            `Time: ${this.time}`
        ];

        info.forEach((text, i) => {
            ctx.fillText(text, 8, this.size.height - 40 + i * 12);
        });
    },

    // ===== ANIMATION =====
    animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
    },

    // ===== UTILITIES =====
    randomColor() {
        const colors = [
            "rgba(79, 70, 229, 1)",      // Indigo
            "rgba(16, 185, 129, 1)",     // Green
            "rgba(59, 130, 246, 1)",     // Blue
            "rgba(168, 85, 247, 1)",     // Purple
            "rgba(244, 63, 94, 1)"       // Red
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    setupControls() {
        // Mouse control
        document.addEventListener("mousemove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (x > 0 && x < this.size.width && y > 0 && y < this.size.height) {
                this.rotationY = (x / this.size.width) * Math.PI * 2;
                this.rotationX = (y / this.size.height) * Math.PI * 2;
            }
        });

        // Toggle visibility with 'H' key
        document.addEventListener("keydown", (e) => {
            if (e.key === "h" || e.key === "H") {
                const container = document.getElementById("ae-holo-container");
                if (container) {
                    container.style.display = container.style.display === "none" ? "block" : "none";
                }
            }
        });
    },

    injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
        #ae-holo-container {
            filter: drop-shadow(0 0 20px rgba(79, 70, 229, 0.2));
        }

        #ae-holo-container canvas {
            cursor: crosshair;
        }

        /* Hologram animation */
        @keyframes hologram-glow {
            0%, 100% {
                filter: drop-shadow(0 0 10px rgba(79, 70, 229, 0.3));
            }
            50% {
                filter: drop-shadow(0 0 30px rgba(79, 70, 229, 0.6));
            }
        }

        #ae-holo-container {
            animation: hologram-glow 3s ease-in-out infinite;
        }
        `;

        document.head.appendChild(style);
    }
};

window.AeHolo = AeHolo;
