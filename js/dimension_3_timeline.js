// ======================================================
// DIMENSION 3: Æ-TIMELINE
// Tidsögoning, återuppspelning, tidsgrenning
// ======================================================

const AeTimeline = {
    timeline: [],
    currentTimePoint: null,
    branches: {},
    masterBranch: "MASTER",
    timelineUI: null,

    // ===== DATA STRUCTURES =====
    timePoint: {
        create(timestamp, action, data, nodeId = null) {
            return {
                id: crypto.randomUUID(),
                timestamp: timestamp || Date.now(),
                action,
                data,
                nodeId,
                branchId: this.currentBranch || "MASTER",
                parentId: this.currentTimePoint?.id || null,
                children: []
            };
        }
    },

    // ===== TIMELINE MANAGER =====
    recordEvent(action, data, nodeId = null) {
        const point = this.timePoint.create(Date.now(), action, data, nodeId);
        
        if (this.currentTimePoint) {
            this.currentTimePoint.children.push(point.id);
        }

        this.timeline.push(point);
        this.currentTimePoint = point;

        console.log(`⏱️ EVENT RECORDED [${action}]: ${point.id.substring(0, 8)}`);
        this.broadcastEvent("timeline-update", point);

        return point;
    },

    // ===== TIMELINE SCRUBBING =====
    scrubToPoint(pointId) {
        const point = this.timeline.find(p => p.id === pointId);
        if (!point) {
            console.error(`Point not found: ${pointId}`);
            return;
        }

        console.log(`⏮️ SCRUBBING TO: ${point.action} (${new Date(point.timestamp).toLocaleString()})`);

        // Restore state at this point
        const state = this.reconstructState(pointId);
        
        this.currentTimePoint = point;
        this.updateUI();

        this.broadcastEvent("timeline-scrub", { point, state });
    },

    scrubForward() {
        if (!this.currentTimePoint || this.currentTimePoint.children.length === 0) {
            console.log("⏭️ No more events forward");
            return;
        }

        const nextId = this.currentTimePoint.children[0];
        this.scrubToPoint(nextId);
    },

    scrubBackward() {
        if (!this.currentTimePoint || !this.currentTimePoint.parentId) {
            console.log("⏮️ No more events backward");
            return;
        }

        this.scrubToPoint(this.currentTimePoint.parentId);
    },

    // ===== TIME FORKING =====
    createBranch(branchName, fromPointId) {
        const sourcePoint = this.timeline.find(p => p.id === fromPointId);
        if (!sourcePoint) {
            console.error(`Cannot create branch: point not found`);
            return null;
        }

        const branchId = `BRANCH_${Date.now()}_${branchName}`;
        
        this.branches[branchId] = {
            id: branchId,
            name: branchName,
            createdAt: Date.now(),
            fromPoint: fromPointId,
            events: [],
            parentBranch: sourcePoint.branchId
        };

        console.log(`🌳 BRANCH CREATED: ${branchName} from ${sourcePoint.action}`);
        this.broadcastEvent("branch-created", { branchId, branchName });

        return branchId;
    },

    switchBranch(branchId) {
        if (!this.branches[branchId] && branchId !== this.masterBranch) {
            console.error(`Branch not found: ${branchId}`);
            return;
        }

        console.log(`🔀 SWITCHING TO BRANCH: ${branchId}`);
        
        const branch = this.branches[branchId];
        this.currentTimePoint = this.timeline.find(p => p.id === branch?.fromPoint) || this.timeline[0];
        
        this.updateUI();
        this.broadcastEvent("branch-switch", { branchId });
    },

    // ===== STATE RECONSTRUCTION =====
    reconstructState(upToPointId) {
        const targetIndex = this.timeline.findIndex(p => p.id === upToPointId);
        if (targetIndex === -1) return {};

        const relevantEvents = this.timeline.slice(0, targetIndex + 1);
        
        let state = {
            messages: [],
            nodeStates: {},
            systemState: {}
        };

        for (const event of relevantEvents) {
            if (event.action === "message") {
                state.messages.push(event.data);
            } else if (event.action === "node-activity") {
                state.nodeStates[event.nodeId] = event.data;
            } else if (event.action === "system-update") {
                state.systemState = { ...state.systemState, ...event.data };
            }
        }

        return state;
    },

    // ===== REPLAY SYSTEM =====
    async replay(fromPointId, toPointId, speed = 1) {
        const fromIndex = this.timeline.findIndex(p => p.id === fromPointId);
        const toIndex = this.timeline.findIndex(p => p.id === toPointId);

        if (fromIndex === -1 || toIndex === -1) {
            console.error("Invalid replay range");
            return;
        }

        const events = this.timeline.slice(fromIndex, toIndex + 1);
        const interval = 1000 / speed;

        console.log(`▶️ REPLAY STARTED: ${events.length} events at ${speed}x speed`);

        for (const event of events) {
            this.scrubToPoint(event.id);
            await new Promise(resolve => setTimeout(resolve, interval));
        }

        console.log(`✅ REPLAY COMPLETED`);
    },

    // ===== TIMELINE VISUALIZATION =====
    createTimelineUI() {
        const container = document.createElement("div");
        container.id = "ae-timeline-ui";
        container.innerHTML = `
            <div class="timeline-panel">
                <div class="timeline-header">
                    <h2>⏱️ Æ-TIMELINE</h2>
                    <div class="timeline-controls">
                        <button class="timeline-btn" onclick="AeTimeline.scrubBackward()" title="Alt+←">⏮️ Back</button>
                        <button class="timeline-btn" onclick="AeTimeline.scrubForward()" title="Alt+→">⏭️ Forward</button>
                        <button class="timeline-btn" onclick="AeTimeline.toggleReplayUI()" title="Play">▶️ Replay</button>
                    </div>
                </div>

                <div class="timeline-scrubber">
                    <div class="timeline-track" id="timeline-track"></div>
                    <div class="timeline-playhead" id="timeline-playhead"></div>
                </div>

                <div class="timeline-info">
                    <div class="current-event" id="current-event">
                        <span class="event-time">--:--:--</span>
                        <span class="event-action">No event selected</span>
                    </div>
                </div>

                <div class="timeline-branches">
                    <h3>Branches</h3>
                    <div class="branch-list" id="branch-list">
                        <div class="branch-item active" onclick="AeTimeline.switchBranch('MASTER')">🌳 MASTER</div>
                    </div>
                    <button class="btn-new-branch" onclick="AeTimeline.showBranchCreator()">+ New Branch</button>
                </div>

                <div class="timeline-scroll" id="timeline-scroll"></div>
            </div>

            <div class="timeline-replay-modal" id="timeline-replay-modal" style="display:none;">
                <div class="replay-panel">
                    <h3>▶️ Replay Configuration</h3>
                    <div class="replay-controls">
                        <label>
                            Speed:
                            <input type="range" min="0.5" max="4" step="0.5" value="1" id="replay-speed" />
                            <span id="speed-display">1x</span>
                        </label>
                    </div>
                    <div class="replay-buttons">
                        <button class="btn-play" onclick="AeTimeline.startReplay()">▶️ Start Replay</button>
                        <button class="btn-close" onclick="AeTimeline.toggleReplayUI()">✕ Close</button>
                    </div>
                </div>
            </div>
        `;

        this.timelineUI = container;
        return container;
    },

    // ===== BRANCH CREATOR =====
    showBranchCreator() {
        const branchName = prompt("📌 Enter branch name:", "ALT_PATH_" + Date.now());
        if (!branchName) return;

        if (!this.currentTimePoint) {
            alert("⚠️ Select a timeline point first");
            return;
        }

        const branchId = this.createBranch(branchName, this.currentTimePoint.id);
        this.switchBranch(branchId);
        this.updateBranchList();
    },

    // ===== UI UPDATES =====
    updateUI() {
        if (!this.timelineUI) return;

        if (this.currentTimePoint) {
            const time = new Date(this.currentTimePoint.timestamp);
            const eventEl = this.timelineUI.querySelector("#current-event");
            eventEl.innerHTML = `
                <span class="event-time">${time.toLocaleTimeString()}</span>
                <span class="event-action">${this.currentTimePoint.action}</span>
            `;
        }

        // Update playhead position
        const progress = this.currentTimePoint 
            ? (this.timeline.indexOf(this.currentTimePoint) / Math.max(this.timeline.length - 1, 1)) * 100
            : 0;
        const playhead = this.timelineUI.querySelector("#timeline-playhead");
        if (playhead) {
            playhead.style.left = progress + "%";
        }
    },

    updateBranchList() {
        const branchList = this.timelineUI?.querySelector("#branch-list");
        if (!branchList) return;

        branchList.innerHTML = `<div class="branch-item active" onclick="AeTimeline.switchBranch('MASTER')">🌳 MASTER</div>`;

        for (const [branchId, branch] of Object.entries(this.branches)) {
            const div = document.createElement("div");
            div.className = "branch-item";
            div.innerHTML = `<span>${branch.name}</span>`;
            div.onclick = () => this.switchBranch(branchId);
            branchList.appendChild(div);
        }
    },

    toggleReplayUI() {
        const modal = this.timelineUI?.querySelector("#timeline-replay-modal");
        if (modal) {
            modal.style.display = modal.style.display === "none" ? "flex" : "none";
        }
    },

    startReplay() {
        const speedInput = this.timelineUI?.querySelector("#replay-speed");
        const speed = speedInput ? parseFloat(speedInput.value) : 1;

        if (this.timeline.length < 2) {
            alert("⚠️ Not enough events to replay");
            return;
        }

        this.replay(this.timeline[0].id, this.timeline[this.timeline.length - 1].id, speed);
        this.toggleReplayUI();
    },

    // ===== EVENT BROADCASTING =====
    broadcastEvent(event, data) {
        if (window.AesiBridge && window.AesiBridge.eventBus) {
            AesiBridge.eventBus.emit(event, data);
        }
    },

    // ===== HOTKEYS =====
    setupHotkeys() {
        document.addEventListener("keydown", (e) => {
            if (e.altKey) {
                if (e.key === "ArrowLeft") {
                    this.scrubBackward();
                }
                if (e.key === "ArrowRight") {
                    this.scrubForward();
                }
            }
        });

        console.log("🔑 Timeline hotkeys: Alt+← (back), Alt+→ (forward)");
    },

    // ===== GLOBAL STYLES =====
    injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
        #ae-timeline-ui {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 400px;
            max-height: 500px;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border: 2px solid #4F46E5;
            border-radius: 12px;
            color: #eaeaea;
            font-family: 'JetBrains Mono', monospace;
            z-index: 400;
            box-shadow: 0 20px 60px rgba(79, 70, 229, 0.2);
            overflow-y: auto;
        }

        .timeline-panel {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .timeline-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 1px solid #262626;
        }

        .timeline-header h2 {
            margin: 0;
            font-size: 14px;
            color: #4F46E5;
        }

        .timeline-controls {
            display: flex;
            gap: 6px;
        }

        .timeline-btn {
            background: #1a1a1a;
            border: 1px solid #262626;
            color: #eaeaea;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s;
        }

        .timeline-btn:hover {
            background: #262626;
            border-color: #4F46E5;
        }

        .timeline-scrubber {
            position: relative;
            height: 40px;
            background: #0a0a0a;
            border-radius: 6px;
            overflow: hidden;
            cursor: pointer;
        }

        .timeline-track {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #4F46E5 0%, #10B981 100%);
            opacity: 0.1;
        }

        .timeline-playhead {
            position: absolute;
            top: 0;
            left: 0;
            width: 2px;
            height: 100%;
            background: #4F46E5;
            box-shadow: 0 0 20px rgba(79, 70, 229, 0.8);
            transition: left 0.1s;
        }

        .timeline-info {
            padding: 8px;
            background: #0a0a0a;
            border-radius: 4px;
            border-left: 3px solid #4F46E5;
        }

        .current-event {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 11px;
        }

        .event-time {
            color: #10B981;
            font-weight: 700;
        }

        .event-action {
            color: #999;
        }

        .timeline-branches {
            padding: 8px;
            background: #0a0a0a;
            border-radius: 4px;
        }

        .timeline-branches h3 {
            margin: 0 0 8px 0;
            font-size: 11px;
            color: #999;
            text-transform: uppercase;
        }

        .branch-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 8px;
        }

        .branch-item {
            padding: 6px 8px;
            background: #1a1a1a;
            border: 1px solid #262626;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .branch-item:hover {
            background: #262626;
        }

        .branch-item.active {
            background: #4F46E5;
            border-color: #4F46E5;
        }

        .btn-new-branch {
            width: 100%;
            padding: 6px;
            background: #10B981;
            border: none;
            border-radius: 4px;
            color: white;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-new-branch:hover {
            background: #059669;
        }

        .timeline-replay-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #0a0a0a;
            border: 2px solid #4F46E5;
            border-radius: 12px;
            padding: 24px;
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .replay-panel {
            color: #eaeaea;
            font-family: 'JetBrains Mono', monospace;
        }

        .replay-controls {
            margin: 16px 0;
        }

        .replay-controls label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
        }

        .replay-controls input {
            width: 100px;
        }

        .replay-buttons {
            display: flex;
            gap: 8px;
            margin-top: 16px;
        }

        .btn-play, .btn-close {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 12px;
        }

        .btn-play {
            background: #10B981;
            color: white;
        }

        .btn-close {
            background: #ef4444;
            color: white;
        }

        #speed-display {
            color: #4F46E5;
            font-weight: 700;
        }
        `;

        document.head.appendChild(style);
    },

    // ===== INITIALIZATION =====
    async init() {
        console.log("⏱️ DIMENSION 3: Æ-TIMELINE initializing...");

        this.injectStyles();
        
        const ui = this.createTimelineUI();
        document.body.appendChild(ui);

        this.setupHotkeys();

        // Listen for events from other systems
        if (window.AesiBridge && window.AesiBridge.eventBus) {
            AesiBridge.eventBus.on("node-activity", (data) => {
                this.recordEvent("node-activity", data, data.nodeId);
            });

            AesiBridge.eventBus.on("message-sent", (data) => {
                this.recordEvent("message", data);
            });
        }

        console.log("✅ DIMENSION 3: Æ-TIMELINE ready");
        console.log("🎮 Timeline scrubbing: Alt+←/→, Branches: Right panel");
    }
};

window.AeTimeline = AeTimeline;
