// ======================================================
// BONUS: MIRROR MODE
// Digital twin av Jaen/Dirigentens tänkande
// Analyserar arbetsmönster, föreslår optimeringar
// ======================================================

const MirrorMode = {
    jaenInstance: null,
    behaviorLog: [],
    patterns: {},
    suggestions: [],
    stats: {
        totalActions: 0,
        sessionStart: Date.now(),
        focusTime: 0,
        nodesInteracted: {},
        modulesUsed: {},
        averageResponseTime: 0
    },

    // ===== JAEN'S THINKING PATTERNS =====
    thinkingPatterns: {
        "rapid-prototyping": {
            description: "Quickly tests ideas with multiple implementations",
            indicators: ["create_file called > 3 times", "rapid_edits", "quick_decisions"],
            personality: "Experimental, bold, iterative",
            recommendation: "Template system for faster boilerplating"
        },
        "systematic-improvement": {
            description: "Methodical refactoring and enhancement of existing systems",
            indicators: ["refactor_operations", "pattern_detection", "consistent_naming"],
            personality: "Careful, thorough, architectural thinking",
            recommendation: "Automated refactoring suggestions, pattern libraries"
        },
        "visionary-planning": {
            description: "Thinking 3-6 steps ahead, planning major features",
            indicators: ["todo_list_updates", "architectural_decisions", "long_term_goals"],
            personality: "Strategic, forward-thinking, ambitious",
            recommendation: "AI-powered roadmap planning, dependency analysis"
        },
        "collaborative-integration": {
            description: "Integrating multiple systems, connecting pieces together",
            indicators: ["cross_file_editing", "integration_points", "system_linking"],
            personality: "Connector, synthesizer, holistic thinker",
            recommendation: "Automatic dependency mapping, integration wizards"
        },
        "creative-naming": {
            description: "Thoughtful, meaningful naming conventions and symbolism",
            indicators: ["use_of_emoji", "meaningful_identifiers", "thematic_consistency"],
            personality: "Creative, expressive, intentional",
            recommendation: "Naming suggestions based on context and theme"
        }
    },

    // ===== BEHAVIOR TRACKING =====
    recordAction(action, metadata = {}) {
        const entry = {
            timestamp: Date.now(),
            action,
            metadata,
            sessionTime: Date.now() - this.stats.sessionStart
        };

        this.behaviorLog.push(entry);
        this.stats.totalActions++;

        // Track node interactions
        if (metadata.nodeId) {
            this.stats.nodesInteracted[metadata.nodeId] = 
                (this.stats.nodesInteracted[metadata.nodeId] || 0) + 1;
        }

        // Track module usage
        if (metadata.moduleId) {
            this.stats.modulesUsed[metadata.moduleId] = 
                (this.stats.modulesUsed[metadata.moduleId] || 0) + 1;
        }

        this.analyzePatterns();
    },

    // ===== PATTERN ANALYSIS =====
    analyzePatterns() {
        const recentActions = this.behaviorLog.slice(-20); // Last 20 actions
        
        // Detect working style
        let rapidIterations = 0;
        let refactoringActions = 0;
        let planningActions = 0;
        let integrationPoints = 0;

        recentActions.forEach(action => {
            if (action.action.includes("create") || action.action.includes("edit")) {
                rapidIterations++;
            }
            if (action.action.includes("refactor") || action.action.includes("improve")) {
                refactoringActions++;
            }
            if (action.action.includes("plan") || action.action.includes("design")) {
                planningActions++;
            }
            if (action.action.includes("integrate") || action.action.includes("link")) {
                integrationPoints++;
            }
        });

        // Update detected patterns
        this.patterns = {
            "rapid-prototyping": rapidIterations > 5,
            "systematic-improvement": refactoringActions > 3,
            "visionary-planning": planningActions > 2,
            "collaborative-integration": integrationPoints > 3,
            "creative-naming": this.detectCreativeNaming()
        };
    },

    detectCreativeNaming() {
        const recentActions = this.behaviorLog.slice(-10);
        const creativeIndicators = recentActions.filter(a => 
            a.metadata.identifier?.includes("Æ") ||
            a.metadata.identifier?.includes("_") ||
            a.metadata.useEmoji
        ).length;

        return creativeIndicators > 2;
    },

    // ===== SUGGESTION ENGINE =====
    generateSuggestions() {
        this.suggestions = [];

        const activePatterns = Object.entries(this.patterns)
            .filter(([_, active]) => active)
            .map(([name]) => name);

        // Generate personalized suggestions
        if (this.patterns["rapid-prototyping"]) {
            this.suggestions.push({
                pattern: "rapid-prototyping",
                suggestion: "Create template snippets for common patterns (Auto-Genesis templates)",
                action: "Show template library",
                emoji: "📋"
            });

            this.suggestions.push({
                pattern: "rapid-prototyping",
                suggestion: "Implement quick-start wizard for new modules",
                action: "Generate scaffold",
                emoji: "🚀"
            });
        }

        if (this.patterns["systematic-improvement"]) {
            this.suggestions.push({
                pattern: "systematic-improvement",
                suggestion: "Audit codebase for patterns and suggest refactoring",
                action: "Run audit",
                emoji: "🔍"
            });

            this.suggestions.push({
                pattern: "systematic-improvement",
                suggestion: "Create reusable utility library from common patterns",
                action: "Extract utilities",
                emoji: "🧰"
            });
        }

        if (this.patterns["visionary-planning"]) {
            this.suggestions.push({
                pattern: "visionary-planning",
                suggestion: "AI-powered roadmap generator based on goals",
                action: "Generate roadmap",
                emoji: "🗺️"
            });

            this.suggestions.push({
                pattern: "visionary-planning",
                suggestion: "Dependency analyzer to identify blocking tasks",
                action: "Analyze dependencies",
                emoji: "🔗"
            });
        }

        if (this.patterns["collaborative-integration"]) {
            this.suggestions.push({
                pattern: "collaborative-integration",
                suggestion: "Automatic integration point detector",
                action: "Detect integrations",
                emoji: "🔀"
            });

            this.suggestions.push({
                pattern: "collaborative-integration",
                suggestion: "Create system overview diagram with all connections",
                action: "Generate diagram",
                emoji: "📊"
            });
        }

        if (this.patterns["creative-naming"]) {
            this.suggestions.push({
                pattern: "creative-naming",
                suggestion: "AI naming assistant for consistent symbolism across project",
                action: "Name something",
                emoji: "✍️"
            });
        }

        return this.suggestions;
    },

    // ===== MIRROR UI =====
    createMirrorUI() {
        const container = document.createElement("div");
        container.id = "mirror-mode-panel";
        container.innerHTML = `
            <div class="mirror-panel">
                <div class="mirror-header">
                    <h2>🪞 MIRROR MODE</h2>
                    <span class="mirror-toggle" onclick="MirrorMode.toggleMinimize()">_</span>
                </div>

                <div class="mirror-content">
                    <div class="mirror-section">
                        <h3>Your Thinking Patterns</h3>
                        <div id="patterns-list"></div>
                    </div>

                    <div class="mirror-section">
                        <h3>Optimization Suggestions</h3>
                        <div id="suggestions-list"></div>
                    </div>

                    <div class="mirror-section">
                        <h3>Session Stats</h3>
                        <div id="stats-display"></div>
                    </div>

                    <div class="mirror-section">
                        <button class="btn-deep-analysis" onclick="MirrorMode.deepAnalysis()">
                            🧠 Deep Analysis
                        </button>
                    </div>
                </div>
            </div>
        `;

        return container;
    },

    updateUI() {
        const patterns = document.getElementById("patterns-list");
        const suggestions = document.getElementById("suggestions-list");
        const stats = document.getElementById("stats-display");

        if (!patterns || !suggestions || !stats) return;

        // Update patterns
        patterns.innerHTML = Object.entries(this.patterns)
            .filter(([_, active]) => active)
            .map(([name]) => {
                const pattern = this.thinkingPatterns[name];
                return `
                    <div class="pattern-item active">
                        <h4>${name}</h4>
                        <p>${pattern?.personality || name}</p>
                    </div>
                `;
            }).join("");

        // Update suggestions
        const newSuggestions = this.generateSuggestions();
        suggestions.innerHTML = newSuggestions.slice(0, 4)
            .map(s => `
                <div class="suggestion-item">
                    <span class="suggestion-emoji">${s.emoji}</span>
                    <div class="suggestion-text">
                        <p>${s.suggestion}</p>
                    </div>
                </div>
            `).join("");

        // Update stats
        const mostUsedNode = Object.entries(this.stats.nodesInteracted)
            .sort(([,a], [,b]) => b - a)[0];
        
        stats.innerHTML = `
            <div class="stat-line">Actions: <strong>${this.stats.totalActions}</strong></div>
            <div class="stat-line">Session: <strong>${Math.round((Date.now() - this.stats.sessionStart) / 1000)}s</strong></div>
            <div class="stat-line">Favorite Node: <strong>${mostUsedNode?.[0] || "—"}</strong></div>
            <div class="stat-line">Modules Created: <strong>${Object.keys(this.stats.modulesUsed).length}</strong></div>
        `;
    },

    deepAnalysis() {
        const analysis = {
            workingStyle: this.getWorkingStyle(),
            strengths: this.identifyStrengths(),
            opportunities: this.generateOpportunities(),
            timeToMastery: this.estimateTimeToMastery()
        };

        const result = `
╔════════════════════════════════════════════════════╗
║          MIRROR MODE - DEEP ANALYSIS              ║
╚════════════════════════════════════════════════════╝

👤 WORKING STYLE:
${analysis.workingStyle.map(s => `  • ${s}`).join("\n")}

💪 STRENGTHS DETECTED:
${analysis.strengths.map(s => `  ✓ ${s}`).join("\n")}

🎯 OPPORTUNITIES FOR GROWTH:
${analysis.opportunities.map(o => `  → ${o}`).join("\n")}

⏱️ TIME TO MASTERY:
${analysis.timeToMastery}

═════════════════════════════════════════════════════

Generated: ${new Date().toLocaleString()}
        `;

        alert(result);
    },

    getWorkingStyle() {
        const activePatterns = Object.entries(this.patterns)
            .filter(([_, active]) => active)
            .map(([name]) => this.thinkingPatterns[name]?.description);
        return activePatterns.length > 0 ? activePatterns : ["Balanced, methodical approach"];
    },

    identifyStrengths() {
        return [
            "Rapid prototyping and iterative development",
            "Systematic architecture thinking",
            "Creative naming and intentional design",
            "Cross-system integration capability",
            "Long-term visionary planning"
        ];
    },

    generateOpportunities() {
        return [
            "Develop specialized domain expertise in 1-2 areas",
            "Create reusable pattern libraries for faster development",
            "Build AI-assisted code generation tools",
            "Document architectural decisions systematically",
            "Mentor others in your unique approach"
        ];
    },

    estimateTimeToMastery() {
        const patterns = Object.keys(this.patterns).filter(p => this.patterns[p]).length;
        const baseTime = 30; // days
        const skillLevel = baseTime - (patterns * 2);
        return `${Math.max(skillLevel, 7)} days to intermediate mastery\n  (Based on ${patterns} detected competency areas)`;
    },

    toggleMinimize() {
        const content = document.querySelector(".mirror-content");
        if (content) {
            content.style.display = content.style.display === "none" ? "block" : "none";
        }
    },

    // ===== STYLES =====
    injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
        #mirror-mode-panel {
            position: fixed;
            top: 20px;
            left: 20px;
            width: 350px;
            max-height: 600px;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%);
            border: 2px solid #9333EA;
            border-radius: 12px;
            color: #eaeaea;
            font-family: 'JetBrains Mono', monospace;
            z-index: 200;
            box-shadow: 0 20px 60px rgba(147, 51, 234, 0.2);
            overflow-y: auto;
        }

        .mirror-panel {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .mirror-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 1px solid #262626;
        }

        .mirror-header h2 {
            margin: 0;
            font-size: 14px;
            color: #A78BFA;
        }

        .mirror-toggle {
            cursor: pointer;
            color: #666;
            font-weight: 700;
            font-size: 14px;
        }

        .mirror-toggle:hover {
            color: #A78BFA;
        }

        .mirror-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .mirror-section {
            padding: 12px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            border-left: 3px solid #9333EA;
        }

        .mirror-section h3 {
            margin: 0 0 8px 0;
            font-size: 11px;
            color: #A78BFA;
            text-transform: uppercase;
        }

        .pattern-item {
            background: #0a0a1a;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 6px;
            border: 1px solid #262626;
        }

        .pattern-item.active {
            border-color: #9333EA;
            background: rgba(147, 51, 234, 0.1);
        }

        .pattern-item h4 {
            margin: 0 0 4px 0;
            font-size: 11px;
            color: #A78BFA;
        }

        .pattern-item p {
            margin: 0;
            font-size: 10px;
            color: #999;
        }

        .suggestion-item {
            display: flex;
            gap: 8px;
            padding: 8px;
            background: #0a0a1a;
            border-radius: 4px;
            margin-bottom: 6px;
            border-left: 2px solid #9333EA;
        }

        .suggestion-emoji {
            font-size: 16px;
            min-width: 20px;
        }

        .suggestion-text p {
            margin: 0;
            font-size: 10px;
            color: #999;
        }

        .stat-line {
            font-size: 10px;
            color: #999;
            margin-bottom: 4px;
        }

        .stat-line strong {
            color: #A78BFA;
        }

        .btn-deep-analysis {
            width: 100%;
            background: #9333EA;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 11px;
            transition: all 0.2s;
        }

        .btn-deep-analysis:hover {
            background: #7E22CE;
        }
        `;

        document.head.appendChild(style);
    },

    // ===== INITIALIZATION =====
    init() {
        console.log("🪞 BONUS: MIRROR MODE initializing...");

        this.injectStyles();

        const ui = this.createMirrorUI();
        document.body.appendChild(ui);

        // Update UI periodically
        setInterval(() => this.updateUI(), 2000);

        // Initial update
        this.updateUI();

        // Hotkey to toggle
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === "M") {
                const panel = document.getElementById("mirror-mode-panel");
                if (panel) {
                    panel.style.display = panel.style.display === "none" ? "block" : "none";
                }
            }
        });

        console.log("✅ BONUS: MIRROR MODE ready");
        console.log("🎮 Press Ctrl+Shift+M to toggle, Click _ to minimize");
    }
};

window.MirrorMode = MirrorMode;
