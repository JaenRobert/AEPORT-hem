// ======================================================
// DIMENSION 5: Æ-JSON STANDARD
// Human-machine JSON format (versionerad, signerad, länkad, tidsstämplad)
// ======================================================

const AeJsonStandard = {
    version: "1.0.0",
    spec: "ÆSI_JSON_V1",
    schema: {},
    signatures: {},
    chains: {},

    // ===== ÆJSON DOCUMENT FORMAT =====
    createDocument(type, content, metadata = {}) {
        return {
            // Standard Header
            æ: "1.0",
            type,
            id: this.generateId(),
            created: new Date().toISOString(),
            modified: new Date().toISOString(),

            // Content
            content,

            // Metadata
            metadata: {
                author: metadata.author || "ÆSYSTEM",
                source: metadata.source || "PORTAL",
                version: metadata.version || "1.0.0",
                tags: metadata.tags || [],
                description: metadata.description || ""
            },

            // Integrity
            signature: null, // Will be populated by sign()
            hash: null,      // Will be populated by hash()

            // Linking
            links: {
                parent: metadata.parentId || null,
                children: [],
                references: metadata.references || []
            },

            // Sealing
            sealed: false,
            sealedAt: null
        };
    },

    // ===== ID GENERATOR =====
    generateId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `Æ${timestamp}-${random}`;
    },

    // ===== HASHING =====
    hash(doc) {
        const str = JSON.stringify(doc.content);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).toUpperCase();
    },

    // ===== SIGNING =====
    sign(doc, signer = "ÆSYSTEM") {
        doc.hash = this.hash(doc);
        doc.signature = {
            signer,
            timestamp: new Date().toISOString(),
            hash: doc.hash,
            verified: true
        };
        doc.modified = new Date().toISOString();
        return doc;
    },

    // ===== SEALING =====
    seal(doc) {
        this.sign(doc);
        doc.sealed = true;
        doc.sealedAt = new Date().toISOString();
        console.log(`🔐 Document sealed: ${doc.id}`);
        return doc;
    },

    // ===== LINKING & CHAINING =====
    createChain(parentId) {
        const chainId = this.generateId();
        this.chains[chainId] = {
            id: chainId,
            parent: parentId,
            documents: [],
            createdAt: new Date().toISOString()
        };
        return chainId;
    },

    addToChain(chainId, doc) {
        if (!this.chains[chainId]) {
            console.error(`Chain not found: ${chainId}`);
            return;
        }

        const chain = this.chains[chainId];
        if (chain.documents.length > 0) {
            const lastDoc = chain.documents[chain.documents.length - 1];
            doc.links.parent = lastDoc.id;
            lastDoc.links.children.push(doc.id);
        }

        this.sign(doc);
        chain.documents.push(doc);

        console.log(`🔗 Added to chain ${chainId}: ${doc.id}`);
        return doc;
    },

    // ===== COMPOSITE DOCUMENT =====
    createComposite(type, parts) {
        const doc = this.createDocument(type, null);
        doc.composite = {
            parts: parts.map(p => ({
                id: p.id,
                type: p.type,
                hash: this.hash(p)
            })),
            assembled: new Date().toISOString()
        };
        this.seal(doc);
        return doc;
    },

    // ===== VERSIONING =====
    createVersion(doc, changes) {
        const newDoc = JSON.parse(JSON.stringify(doc));
        newDoc.metadata.version = this.incrementVersion(newDoc.metadata.version);
        newDoc.modified = new Date().toISOString();
        newDoc.links.parent = doc.id;
        doc.links.children.push(newDoc.id);

        newDoc.content = { ...doc.content, ...changes };
        this.sign(newDoc);

        console.log(`📝 New version: ${newDoc.metadata.version}`);
        return newDoc;
    },

    incrementVersion(versionStr) {
        const parts = versionStr.split(".").map(Number);
        parts[2]++;
        return parts.join(".");
    },

    // ===== EXPORT FORMATS =====
    exportJson(doc) {
        return JSON.stringify(doc, null, 2);
    },

    exportCompact(doc) {
        return JSON.stringify({
            æ: doc.æ,
            id: doc.id,
            type: doc.type,
            hash: doc.hash,
            created: doc.created
        });
    },

    exportHuman(doc) {
        return `
═══════════════════════════════════════════════════
  ÆSI JSON DOCUMENT
═══════════════════════════════════════════════════
  
  Document ID: ${doc.id}
  Type: ${doc.type}
  Created: ${doc.created}
  Modified: ${doc.modified}
  
  Hash: ${doc.hash}
  Signature: ${doc.signature ? "✓ SIGNED" : "✗ UNSIGNED"}
  Sealed: ${doc.sealed ? "✓ SEALED" : "○ OPEN"}
  
  Author: ${doc.metadata.author}
  Source: ${doc.metadata.source}
  Version: ${doc.metadata.version}
  
  Tags: ${doc.metadata.tags.join(", ") || "(none)"}
  Description: ${doc.metadata.description || "(none)"}
  
═══════════════════════════════════════════════════
`;
    },

    // ===== BATCH OPERATIONS =====
    createBatch(type, documents) {
        const batch = this.createDocument("BATCH", {
            count: documents.length,
            documentIds: documents.map(d => d.id)
        });

        batch.content.documents = documents;
        this.seal(batch);

        return batch;
    },

    // ===== QUERY BUILDER =====
    query() {
        return new AeJsonQuery(this);
    },

    // ===== PERSISTENCE =====
    saveToStorage(doc) {
        if (!window.localStorage) return false;
        localStorage.setItem(`æjson_${doc.id}`, this.exportJson(doc));
        return true;
    },

    loadFromStorage(docId) {
        if (!window.localStorage) return null;
        const data = localStorage.getItem(`æjson_${docId}`);
        return data ? JSON.parse(data) : null;
    },

    // ===== UI INSPECTOR =====
    createInspectorUI() {
        const container = document.createElement("div");
        container.id = "ae-json-inspector";
        container.innerHTML = `
            <div class="ae-json-panel">
                <div class="ae-json-header">
                    <h2>📄 Æ-JSON Inspector</h2>
                    <button class="close-btn" onclick="document.getElementById('ae-json-inspector').style.display='none'">✕</button>
                </div>
                
                <div class="ae-json-tabs">
                    <button class="tab-btn active" onclick="AeJsonStandard.switchTab('create')">Create</button>
                    <button class="tab-btn" onclick="AeJsonStandard.switchTab('view')">View</button>
                    <button class="tab-btn" onclick="AeJsonStandard.switchTab('export')">Export</button>
                </div>

                <div class="ae-json-content">
                    <div class="tab-content" id="tab-create">
                        <div class="form-group">
                            <label>Type:</label>
                            <input type="text" id="doc-type" placeholder="e.g., MESSAGE, EVENT, DOCUMENT" />
                        </div>
                        <div class="form-group">
                            <label>Content (JSON):</label>
                            <textarea id="doc-content" placeholder='{"key": "value"}' rows="6"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Author:</label>
                            <input type="text" id="doc-author" placeholder="Author name" />
                        </div>
                        <button class="btn-create" onclick="AeJsonStandard.createAndSeal()">Create & Seal Document</button>
                    </div>

                    <div class="tab-content hidden" id="tab-view">
                        <div class="form-group">
                            <label>Document ID:</label>
                            <input type="text" id="view-doc-id" placeholder="Æ..." />
                            <button onclick="AeJsonStandard.loadAndView()">Load</button>
                        </div>
                        <div id="view-result" style="margin-top: 12px;"></div>
                    </div>

                    <div class="tab-content hidden" id="tab-export">
                        <div class="form-group">
                            <label>Export Format:</label>
                            <select id="export-format">
                                <option value="json">Full JSON</option>
                                <option value="compact">Compact</option>
                                <option value="human">Human-Readable</option>
                            </select>
                        </div>
                        <button onclick="AeJsonStandard.exportDocument()">Export</button>
                        <pre id="export-result"></pre>
                    </div>
                </div>
            </div>
        `;

        return container;
    },

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll(".tab-content").forEach(tab => {
            tab.classList.add("hidden");
        });
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        // Show selected tab
        document.getElementById(`tab-${tabName}`).classList.remove("hidden");
        event.target.classList.add("active");
    },

    createAndSeal() {
        const type = document.getElementById("doc-type").value;
        const contentStr = document.getElementById("doc-content").value;
        const author = document.getElementById("doc-author").value;

        if (!type || !contentStr) {
            alert("⚠️ Fill in Type and Content");
            return;
        }

        try {
            const content = JSON.parse(contentStr);
            const doc = this.createDocument(type, content, { author });
            this.seal(doc);

            alert(`✅ Document created: ${doc.id}`);
            this.saveToStorage(doc);

            // Clear form
            document.getElementById("doc-type").value = "";
            document.getElementById("doc-content").value = "";
            document.getElementById("doc-author").value = "";
        } catch (e) {
            alert(`❌ Invalid JSON: ${e.message}`);
        }
    },

    loadAndView() {
        const docId = document.getElementById("view-doc-id").value;
        const doc = this.loadFromStorage(docId);

        if (!doc) {
            document.getElementById("view-result").innerHTML = `<p style="color: #ef4444;">❌ Document not found: ${docId}</p>`;
            return;
        }

        document.getElementById("view-result").innerHTML = `
            <pre style="background: #0a0a0a; padding: 12px; border-radius: 6px; color: #10B981; font-size: 11px; overflow-x: auto;">
${this.exportHuman(doc)}
            </pre>
        `;
    },

    exportDocument() {
        const format = document.getElementById("export-format").value;
        const docId = document.getElementById("view-doc-id").value;
        const doc = this.loadFromStorage(docId);

        if (!doc) {
            alert("⚠️ Load a document first");
            return;
        }

        let exported = "";
        if (format === "json") {
            exported = this.exportJson(doc);
        } else if (format === "compact") {
            exported = this.exportCompact(doc);
        } else {
            exported = this.exportHuman(doc);
        }

        document.getElementById("export-result").textContent = exported;
    },

    // ===== GLOBAL STYLES =====
    injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
        #ae-json-inspector {
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 500px;
            max-height: 600px;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border: 2px solid #10B981;
            border-radius: 12px;
            color: #eaeaea;
            font-family: 'JetBrains Mono', monospace;
            z-index: 300;
            box-shadow: 0 20px 60px rgba(16, 185, 129, 0.2);
            overflow-y: auto;
        }

        .ae-json-panel {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .ae-json-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 1px solid #262626;
        }

        .ae-json-header h2 {
            margin: 0;
            font-size: 14px;
            color: #10B981;
        }

        .close-btn {
            background: none;
            border: none;
            color: #666;
            font-size: 16px;
            cursor: pointer;
        }

        .ae-json-tabs {
            display: flex;
            gap: 8px;
            border-bottom: 1px solid #262626;
        }

        .tab-btn {
            background: none;
            border: none;
            color: #666;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 11px;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .tab-btn:hover {
            color: #10B981;
        }

        .tab-btn.active {
            color: #10B981;
            border-bottom-color: #10B981;
        }

        .ae-json-content {
            flex: 1;
            overflow-y: auto;
        }

        .tab-content {
            display: block;
        }

        .tab-content.hidden {
            display: none;
        }

        .form-group {
            margin-bottom: 12px;
        }

        .form-group label {
            display: block;
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
            text-transform: uppercase;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            background: #0a0a0a;
            border: 1px solid #262626;
            color: #eaeaea;
            padding: 8px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            box-sizing: border-box;
        }

        .form-group button {
            margin-top: 4px;
        }

        .btn-create {
            width: 100%;
            background: #10B981;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 11px;
            margin-top: 8px;
        }

        .btn-create:hover {
            background: #059669;
        }

        #export-result {
            background: #0a0a0a;
            color: #10B981;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #262626;
            margin-top: 8px;
            max-height: 300px;
            overflow-y: auto;
            font-size: 10px;
            line-height: 1.4;
        }
        `;

        document.head.appendChild(style);
    },

    // ===== INITIALIZATION =====
    init() {
        console.log("📄 DIMENSION 5: Æ-JSON STANDARD initializing...");

        this.injectStyles();
        
        const ui = this.createInspectorUI();
        document.body.appendChild(ui);

        // Hotkey to open inspector
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "j") {
                const inspector = document.getElementById("ae-json-inspector");
                if (inspector) {
                    inspector.style.display = inspector.style.display === "none" ? "block" : "none";
                }
            }
        });

        console.log("✅ DIMENSION 5: Æ-JSON STANDARD ready");
        console.log("🎮 Press Ctrl+J to open JSON Inspector");
    }
};

// ===== QUERY BUILDER =====
class AeJsonQuery {
    constructor(standard) {
        this.standard = standard;
        this.filters = [];
        this.results = [];
    }

    byType(type) {
        this.filters.push(doc => doc.type === type);
        return this;
    }

    bySigner(signer) {
        this.filters.push(doc => doc.signature && doc.signature.signer === signer);
        return this;
    }

    sealed() {
        this.filters.push(doc => doc.sealed === true);
        return this;
    }

    execute() {
        // Get all documents from localStorage
        const docs = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("æjson_")) {
                const data = localStorage.getItem(key);
                docs.push(JSON.parse(data));
            }
        }

        // Apply filters
        return docs.filter(doc => 
            this.filters.every(filter => filter(doc))
        );
    }
}

window.AeJsonStandard = AeJsonStandard;
