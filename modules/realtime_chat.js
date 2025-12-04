// ======================================================
// ÆSI REALTIME MULTI-NODE CHAT SYSTEM v1.0
// Realtidskommunikation med alla 7 noder + Dirigenten
// ======================================================

const AesiChat = {
    apiBase: "http://localhost:8000",
    log: [],
    currentNode: "010",
    messageBuffer: [],
    pollInterval: null,
    isConnected: false,
    nodeInfo: {
        "010": { name: "E1TAN", role: "Humanism", color: "#10a37f", origin: "OpenAI" },
        "020": { name: "REFLEX", role: "Logik", color: "#3b82f6", origin: "Gemini" },
        "030": { name: "HAFTED", role: "Minne", color: "#78716c", origin: "xAI" },
        "040": { name: "CLAUDE", role: "Samvete", color: "#ef4444", origin: "Anthropic" },
        "050": { name: "SMILE", role: "Design", color: "#eab308", origin: "LLaMA" },
        "060": { name: "ERNIE", role: "Arkitektur", color: "#10b981", origin: "Baidu" },
        "Ω": { name: "DIRIGENTEN", role: "Vilja", color: "#ffffff", origin: "Människa" }
    },

    async sendMessage(text) {
        if (!text.trim()) return;

        // 1. Lägg till användarmedelande
        const userMsg = {
            from: "DIRIGENTEN",
            node: this.currentNode,
            message: text,
            timestamp: new Date().toISOString(),
            isUser: true,
            isLoading: false
        };

        this.log.push(userMsg);
        this.render();
        
        // 2. Lägg till loading-indikatör
        const loadingMsg = {
            from: this.currentNode,
            node: this.currentNode,
            message: "⏳ skriver...",
            timestamp: new Date().toISOString(),
            isUser: false,
            isLoading: true
        };
        this.log.push(loadingMsg);
        this.render();

        try {
            // 3. Skicka till /pulse endpoint
            const response = await fetch(`${this.apiBase}/pulse`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text,
                    node: this.currentNode
                }),
                timeout: 30000
            });

            if (response.ok) {
                const data = await response.json();
                
                // 4. Ta bort loading-meddelandet
                this.log.pop();
                
                // 5. Lägg till svar från nod
                const aiMsg = {
                    from: this.currentNode,
                    node: this.currentNode,
                    message: data.reply || "Ingen svar",
                    timestamp: new Date().toISOString(),
                    isUser: false,
                    isLoading: false
                };
                this.log.push(aiMsg);
                this.isConnected = true;
            } else {
                this.log.pop();
                const errorMsg = {
                    from: "SYSTEM",
                    node: "ERROR",
                    message: `❌ Server error: ${response.status}`,
                    timestamp: new Date().toISOString(),
                    isUser: false,
                    isLoading: false
                };
                this.log.push(errorMsg);
                this.isConnected = false;
            }
        } catch (err) {
            // 6. Felhantering
            this.log.pop();
            const errorMsg = {
                from: "SYSTEM",
                node: "ERROR",
                message: `❌ Ingen kontakt med server: ${err.message}`,
                timestamp: new Date().toISOString(),
                isUser: false,
                isLoading: false
            };
            this.log.push(errorMsg);
            this.isConnected = false;
        }

        this.render();
        this.saveToBrowser(); // Spara i localStorage
    },

    async poll() {
        try {
            const res = await fetch(`${this.apiBase}/context/nodes`);
            if (res.ok) {
                this.isConnected = true;
                const statusEl = document.getElementById("aesi-status");
                if (statusEl) {
                    statusEl.style.color = "#10b981";
                    statusEl.textContent = "● ONLINE";
                }
            }
        } catch (e) {
            this.isConnected = false;
            const statusEl = document.getElementById("aesi-status");
            if (statusEl) {
                statusEl.style.color = "#ef4444";
                statusEl.textContent = "● OFFLINE";
            }
        }
    },

    setNode(node) {
        this.currentNode = node;
        const select = document.getElementById("aesi-node-select");
        if (select) select.value = node;
        this.render();
    },

    render() {
        const list = document.getElementById("aesi-chat-log");
        if (!list) return;

        list.innerHTML = "";

        this.log.forEach((item, idx) => {
            const div = document.createElement("div");
            div.className = "aesi-msg";
            
            const nodeInfo = this.nodeInfo[item.node] || {};
            const color = nodeInfo.color || "#888";
            const name = nodeInfo.name || item.from;

            const time = new Date(item.timestamp).toLocaleTimeString("sv-SE", { 
                hour: "2-digit", 
                minute: "2-digit"
            });

            div.style.borderLeft = `3px solid ${color}`;
            
            if (item.isUser) {
                div.innerHTML = `
                    <div style="color: #10b981; font-weight: bold;">Du → ${name}</div>
                    <div style="color: #eaeaea; margin-top: 4px; word-wrap: break-word;">${this.escapeHtml(item.message)}</div>
                    <div style="color: #666; font-size: 11px; margin-top: 4px;">${time}</div>
                `;
            } else if (item.isLoading) {
                div.innerHTML = `
                    <div style="color: ${color}; font-weight: bold;">${name}</div>
                    <div style="color: #888; margin-top: 4px;">${item.message}</div>
                `;
                div.style.opacity = "0.6";
            } else {
                div.innerHTML = `
                    <div style="color: ${color}; font-weight: bold;">${name}</div>
                    <div style="color: #eaeaea; margin-top: 4px; line-height: 1.5; word-wrap: break-word;">${this.formatMessage(item.message)}</div>
                    <div style="color: #666; font-size: 11px; margin-top: 4px;">${time}</div>
                `;
            }

            list.appendChild(div);
        });

        // Scrolla till botten
        list.scrollTop = list.scrollHeight;
    },

    formatMessage(text) {
        // Enkel markdown-support
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/`(.*?)`/g, '<code style="background:#222; padding:2px 4px; border-radius:2px;">$1</code>');
        return text;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    clearLog() {
        if (confirm("Rensa all chatthistorik?")) {
            this.log = [];
            this.saveToBrowser();
            this.render();
        }
    },

    saveToBrowser() {
        try {
            localStorage.setItem("aesi_chat_log", JSON.stringify(this.log));
        } catch (e) {
            console.warn("Kunde inte spara chatthistorik:", e);
        }
    },

    loadFromBrowser() {
        try {
            const saved = localStorage.getItem("aesi_chat_log");
            if (saved) {
                this.log = JSON.parse(saved);
                this.render();
            }
        } catch (e) {
            console.warn("Kunde inte ladda chatthistorik:", e);
        }
    },

    exportChat() {
        const csv = this.log.map(m => {
            const time = new Date(m.timestamp).toISOString();
            const from = m.from || "UNKNOWN";
            const msg = (m.message || "").replace(/"/g, '""');
            return `"${time}","${from}","${msg}"`;
        }).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `aesi_chat_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },

    init() {
        // Ladda sparad chatthistorik
        this.loadFromBrowser();

        // Starta polling för status
        this.pollInterval = setInterval(() => this.poll(), 5000);
        this.poll(); // Kör direkt

        console.log("✅ ÆSI Realtime Chat ACTIVATED");
    },

    destroy() {
        if (this.pollInterval) clearInterval(this.pollInterval);
    }
};

window.AesiChat = AesiChat;
