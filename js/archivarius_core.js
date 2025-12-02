// ======================================================
// ÆRCHIVARIUS ENGINE v1.0
// Universellt arkiv-, tid-, och kunskapssystem
// Ingenting får någonsin glömmas bort
// ======================================================

const ÆRCHIVARIUS = {
    // Portalens officiella tidspunkt (2025-11-18 20:25)
    Æ_TIME_ORIGIN: new Date("2025-11-18T20:25:00Z"),
    Æ_TIME_ORIGIN_UNIX: 1747605900000,
    
    // Arkiv
    archive: [],
    database: {},
    relations: {},
    indices: {},
    
    // Statistik
    stats: {
        documentsProcessed: 0,
        factsExtracted: 0,
        relationsCreated: 0,
        timePointsIndexed: 0,
        nodesInvolved: new Set(),
        projectsCovered: new Set()
    },

    // ===== Æ-TID SYSTEM =====
    
    /**
     * Beräknar Æ-tid från millisekunder eller datum
     * Returnerar: "+HH.FF" (timmar + fraktioner) eller "-HH.FF" (före origin)
     */
    calculateAeTime(timestamp) {
        if (typeof timestamp === 'string') {
            timestamp = new Date(timestamp).getTime();
        }
        if (!(timestamp instanceof Date)) {
            // Behandla som millisekunder
            const ms = timestamp;
            const delta = ms - this.Æ_TIME_ORIGIN_UNIX;
            const hours = delta / (1000 * 60 * 60);
            const sign = delta >= 0 ? '+' : '-';
            return `${sign}${Math.abs(hours).toFixed(2)}h`;
        }
    },

    /**
     * Skapar Æ-tid tag för ett objekt
     */
    createAeTimeTag(date) {
        const delta = new Date(date).getTime() - this.Æ_TIME_ORIGIN_UNIX;
        const hours = delta / (1000 * 60 * 60);
        const sign = delta >= 0 ? '+' : '-';
        const absHours = Math.abs(hours);
        const h = Math.floor(absHours);
        const minutes = Math.round((absHours - h) * 60);
        
        return {
            Æ_TIME_START: "2025111820.25",
            Æ_TIME_INDEX: `${sign}${h}h${minutes}m`,
            Æ_TIME_TAG: sign,
            timestamp: new Date(date).toISOString(),
            readable: `${h} timmar ${minutes} minuter ${sign === '-' ? 'före' : 'efter'} origin`
        };
    },

    // ===== UNIVERSAL FILINLÄSNING =====

    /**
     * Läser alla filtyper automatiskt
     */
    async readUniversalFile(file) {
        console.log(`📂 Reading file: ${file.name}`);

        let content = null;
        const type = file.type || file.name.split('.').pop().toLowerCase();

        try {
            // Text-baserade format
            if (['txt', 'md', 'json', 'html', 'csv'].includes(type) || file.name.endsWith('.log')) {
                content = await this.readAsText(file);
            }
            
            // PDF (simplified - behövs pdf.js i produktion)
            else if (type === 'pdf' || file.name.endsWith('.pdf')) {
                content = `[PDF] ${file.name} (${file.size} bytes)`;
            }
            
            // DOCX (simplified)
            else if (type === 'docx' || file.name.endsWith('.docx')) {
                content = `[DOCX] ${file.name} (${file.size} bytes)`;
            }
            
            // Images (OCR placeholder)
            else if (type.startsWith('image')) {
                content = `[IMAGE-OCR] ${file.name} - Text extraction available`;
            }
            
            // ZIP/archives
            else if (['zip', 'rar', '7z'].includes(type)) {
                content = `[ARCHIVE] ${file.name} (${file.size} bytes)`;
            }
            
            // Default
            else {
                content = await this.readAsText(file);
            }

            const entry = {
                id: this.generateArchiveId(),
                filename: file.name,
                type: type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                aeTime: this.createAeTimeTag(new Date()),
                content: content,
                processed: false,
                hash: await this.generateHash(content)
            };

            this.archive.push(entry);

            // Trigger event on available event buses
            if (window.AesiBridge && AesiBridge.eventBus) {
                try { AesiBridge.eventBus.emit('archivarius-file-added', entry); } catch (e) {}
            }
            if (window.AesiRealtime && AesiRealtime.emit) {
                try { AesiRealtime.emit('archivarius-file-added', entry); } catch (e) {}
            }

            console.log(`✅ File processed: ${file.name}`);
            return entry;

        } catch (error) {
            console.error(`❌ Error reading file: ${error.message}`);
            return null;
        }
    },

    async readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    // ===== AUTONOM FAKTAEXTRAKTION =====

    /**
     * Extraherar strukturerad data från innehål
     */
    async extractFacts(archiveEntry) {
        console.log(`🔍 Extracting facts from: ${archiveEntry.filename}`);

        const content = archiveEntry.content;
        const facts = {
            archiveId: archiveEntry.id,
            extractedAt: new Date().toISOString(),
            aeTime: archiveEntry.aeTime,
            facts: [],
            events: [],
            context: [],
            relations: [],
            quotes: [],
            people: [],
            nodes: [],
            projects: [],
            importanceScore: 0,
            entities: {}
        };

        // Extract facts (sentence-based)
        const sentences = content.split(/[.!?]\s+/);
        facts.facts = sentences
            .filter(s => s.length > 10)
            .map((fact, i) => ({
                id: `fact_${archiveEntry.id}_${i}`,
                text: fact.trim(),
                type: this.classifyFact(fact),
                confidence: this.calculateConfidence(fact)
            }));

        // Extract events (pattern: [action] [subject] [object])
        facts.events = this.extractEvents(content);

        // Extract quotes
        facts.quotes = this.extractQuotes(content);

        // Extract people/entities
        facts.people = this.extractPeople(content);

        // Extract node references
        facts.nodes = this.extractNodeReferences(content);

        // Extract project references
        facts.projects = this.extractProjectReferences(content);

        // Calculate importance
        facts.importanceScore = this.calculateImportance(facts);

        this.stats.factsExtracted += facts.facts.length;

        // Store in database
        if (!this.database[archiveEntry.id]) {
            this.database[archiveEntry.id] = [];
        }
        this.database[archiveEntry.id].push(facts);

        return facts;
    },

    classifyFact(text) {
        const lower = text.toLowerCase();
        if (/är|är en|kallas|benämns/i.test(lower)) return 'definition';
        if (/happened|created|built|skapad|byggd/i.test(lower)) return 'event';
        if (/said|säger|told|sa|skriver/i.test(lower)) return 'statement';
        if (/connected|related|kopplad|länkad/i.test(lower)) return 'relation';
        return 'fact';
    },

    calculateConfidence(text) {
        // Längre text = högre confidence
        return Math.min(1, text.split(' ').length / 20);
    },

    extractEvents(content) {
        const eventPatterns = [
            /(\w+)\s+(created|created|skapade)\s+(\w+)/gi,
            /(\w+)\s+(implemented|implemented|implementerade)\s+(\w+)/gi,
            /(\w+)\s+(discovered|discovered|descobriu)\s+(\w+)/gi,
        ];

        const events = [];
        eventPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                events.push({
                    id: `event_${Date.now()}_${Math.random()}`,
                    subject: match[1],
                    action: match[2],
                    object: match[3],
                    aeTime: this.createAeTimeTag(new Date())
                });
            }
        });

        return events;
    },

    extractQuotes(content) {
        const quotePattern = /[""]([^""]{10,})[""]|«([^»]{10,})»/g;
        const quotes = [];
        let match;

        while ((match = quotePattern.exec(content)) !== null) {
            quotes.push({
                id: `quote_${Date.now()}_${Math.random()}`,
                text: match[1] || match[2],
                source: 'extracted'
            });
        }

        return quotes;
    },

    extractPeople(content) {
        const peoplePattern = /(Jaen|Claude|ChatGPT|E1TAN|REFLEX|HAFTED|CLAUDE|SMILE|ERNIE|DIRIGENTEN)/g;
        const people = new Set();
        let match;

        while ((match = peoplePattern.exec(content)) !== null) {
            people.add(match[1]);
        }

        return Array.from(people).map(p => ({
            name: p,
            mentions: (content.match(new RegExp(p, 'g')) || []).length
        }));
    },

    extractNodeReferences(content) {
        const nodes = ['E1TAN', 'REFLEX', 'HAFTED', 'CLAUDE', 'SMILE', 'ERNIE', 'DIRIGENTEN'];
        const found = [];

        nodes.forEach(node => {
            if (content.includes(node)) {
                found.push({
                    node: node,
                    mentions: (content.match(new RegExp(node, 'g')) || []).length
                });
                this.stats.nodesInvolved.add(node);
            }
        });

        return found;
    },

    extractProjectReferences(content) {
        const projectPattern = /project[s]?:\s*([^\n,]+)/gi;
        const projects = [];
        let match;

        while ((match = projectPattern.exec(content)) !== null) {
            projects.push({
                name: match[1].trim(),
                mentions: 1
            });
            this.stats.projectsCovered.add(match[1].trim());
        }

        return projects;
    },

    calculateImportance(facts) {
        let score = 0;
        score += facts.events.length * 10;
        score += facts.quotes.length * 5;
        score += facts.people.length * 3;
        score += facts.nodes.length * 8;
        score += facts.projects.length * 7;
        score = Math.min(100, score);
        return score;
    },

    // ===== RELATIONSDATABAS =====

    /**
     * Bygger relation mellan extraherade data
     */
    buildRelations(archiveEntry, facts) {
        console.log(`🔗 Building relations for: ${archiveEntry.filename}`);

        // Relation: File -> Facts
        facts.facts.forEach(fact => {
            const relationId = `rel_${archiveEntry.id}_fact`;
            this.relations[relationId] = {
                id: relationId,
                type: 'contains_fact',
                from: archiveEntry.filename,
                to: fact.id,
                strength: fact.confidence,
                aeTime: this.createAeTimeTag(new Date())
            };
        });

        // Relation: File -> People
        facts.people.forEach(person => {
            const relationId = `rel_person_${person.name}`;
            if (!this.relations[relationId]) {
                this.relations[relationId] = {
                    id: relationId,
                    type: 'mentions_person',
                    person: person.name,
                    documents: [],
                    totalMentions: 0
                };
            }
            this.relations[relationId].documents.push(archiveEntry.filename);
            this.relations[relationId].totalMentions += person.mentions;
        });

        // Relation: File -> Nodes
        facts.nodes.forEach(node => {
            const relationId = `rel_node_${node.node}`;
            if (!this.relations[relationId]) {
                this.relations[relationId] = {
                    id: relationId,
                    type: 'mentions_node',
                    node: node.node,
                    documents: [],
                    totalMentions: 0
                };
            }
            this.relations[relationId].documents.push(archiveEntry.filename);
            this.relations[relationId].totalMentions += node.mentions;
        });

        this.stats.relationsCreated += Object.keys(this.relations).length;
    },

    // ===== TIMELINE INTEGRATION =====

    /**
     * Matar in extraherade data i Æ-Timeline
     */
    integrateWithTimeline(archiveEntry, facts) {
        console.log(`⏱️ Integrating with Æ-Timeline...`);

        if (window.AeTimeline) {
            // Lägg till arkivpunkt
            AeTimeline.recordEvent('archive-entry', {
                filename: archiveEntry.filename,
                type: archiveEntry.type,
                facts: facts.facts.length,
                importance: facts.importanceScore
            });

            // Lägg till varje betydelsefull event
            facts.events.forEach(event => {
                AeTimeline.recordEvent('extracted-event', {
                    subject: event.subject,
                    action: event.action,
                    object: event.object
                });
            });

            // Lägg till nodaktiviteter
            facts.nodes.forEach(node => {
                AeTimeline.recordEvent('node-mentioned', {
                    node: node.node,
                    mentions: node.mentions
                });
            });
        }

        this.stats.timePointsIndexed += facts.events.length + facts.nodes.length;
    },

    // ===== INDEXERING =====

    /**
     * Bygger sökbara index
     */
    buildIndices() {
        console.log(`📇 Building search indices...`);

        // Full-text index
        this.indices.fullText = {};
        Object.entries(this.database).forEach(([archiveId, facts]) => {
            facts.forEach(fact => {
                const words = fact.facts
                    .map(f => f.text.toLowerCase().split(/\s+/))
                    .flat();

                words.forEach(word => {
                    if (!this.indices.fullText[word]) {
                        this.indices.fullText[word] = [];
                    }
                    this.indices.fullText[word].push(archiveId);
                });
            });
        });

        // Node index
        this.indices.nodes = {};
        Object.entries(this.relations).forEach(([relId, relation]) => {
            if (relation.type === 'mentions_node') {
                if (!this.indices.nodes[relation.node]) {
                    this.indices.nodes[relation.node] = [];
                }
                this.indices.nodes[relation.node].push(relation.documents);
            }
        });

        // Timeline index
        this.indices.timeline = Object.entries(this.archive).map(([_, entry]) => ({
            filename: entry.filename,
            aeTime: entry.aeTime,
            importance: this.database[entry.id]?.[0]?.importanceScore || 0
        })).sort((a, b) => {
            const aHours = parseFloat(a.aeTime.Æ_TIME_INDEX);
            const bHours = parseFloat(b.aeTime.Æ_TIME_INDEX);
            return aHours - bHours;
        });
    },

    // ===== EXPORT FUNCTIONS =====

    exportDatabase() {
        return JSON.stringify(this.database, null, 2);
    },

    exportRelations() {
        return JSON.stringify(this.relations, null, 2);
    },

    exportIndices() {
        return JSON.stringify(this.indices, null, 2);
    },

    exportStatistics() {
        return {
            documentsProcessed: this.stats.documentsProcessed,
            factsExtracted: this.stats.factsExtracted,
            relationsCreated: this.stats.relationsCreated,
            timePointsIndexed: this.stats.timePointsIndexed,
            nodesInvolved: Array.from(this.stats.nodesInvolved),
            projectsCovered: Array.from(this.stats.projectsCovered),
            archiveSize: this.archive.length,
            æOrigin: "2025111820.25",
            generated: new Date().toISOString()
        };
    },

    // ===== UTILITIES =====

    generateArchiveId() {
        return `ARC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    async generateHash(content) {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    },

    // ===== INITIALIZATION =====

    async init() {
        console.log("🏛️ ÆRCHIVARIUS ENGINE v1.0 initializing...");
        console.log(`📅 Æ-TIME ORIGIN: 2025-11-18T20:25:00Z`);

        this.setupDragDrop();
        this.setupEventListeners();

        console.log("✅ ÆRCHIVARIUS ENGINE ready");
        console.log("🎯 MISSION: Nothing forgotten. Everything indexed. All times known.");
    },

    setupDragDrop() {
        const dropZone = document.createElement("div");
        dropZone.id = "archivarius-drop-zone";
        dropZone.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 60px;
            width: 120px;
            height: 120px;
            border: 2px dashed #10B981;
            border-radius: 12px;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(16, 185, 129, 0.1);
            color: #10B981;
            font-weight: bold;
            font-size: 11px;
            text-align: center;
            z-index: 100;
            transition: all 0.2s;
            cursor: pointer;
        `;
        dropZone.innerHTML = "📂<br>Drop files";
        document.body.appendChild(dropZone);

        // Drag and drop
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.display = 'flex';
            dropZone.style.borderColor = '#10B981';
            dropZone.style.background = 'rgba(16, 185, 129, 0.2)';
        });

        document.addEventListener('dragleave', () => {
            dropZone.style.display = 'none';
        });

        document.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.style.display = 'none';

            const files = Array.from(e.dataTransfer.files);
            for (const file of files) {
                const entry = await this.readUniversalFile(file);
                if (entry) {
                    const facts = await this.extractFacts(entry);
                    this.buildRelations(entry, facts);
                    this.integrateWithTimeline(entry, facts);
                    this.stats.documentsProcessed++;
                }
            }

            this.buildIndices();
            this.displayStatistics();
        });
    },

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'a') {
                // Show archive stats
                this.displayStatistics();
            }
        });
    },

    displayStatistics() {
        const stats = this.exportStatistics();
        console.log("📊 ÆRCHIVARIUS STATISTICS:");
        console.log(stats);

        // Show in UI
        const alert = `
╔═══════════════════════════════════════════╗
║     ÆRCHIVARIUS ENGINE STATISTICS         ║
╚═══════════════════════════════════════════╝

📁 Documents Processed: ${stats.documentsProcessed}
📝 Facts Extracted: ${stats.factsExtracted}
🔗 Relations Created: ${stats.relationsCreated}
⏱️ Time Points Indexed: ${stats.timePointsIndexed}

🧠 Nodes Involved: ${stats.nodesInvolved.join(', ')}
📦 Projects Covered: ${stats.projectsCovered.join(', ')}

🏛️ Æ-TIME ORIGIN: ${stats.æOrigin}
✅ Status: OPERATIONAL

═══════════════════════════════════════════
        `;

        alert && console.log(alert);
    }
};

window.ÆRCHIVARIUS = ÆRCHIVARIUS;
