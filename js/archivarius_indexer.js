// ======================================================
// ARCHIVARIUS INDEXER v1.0
// Lightweight client-side extractor for text-like files
// Produces facts, events, relations, tags and simple entities
// ======================================================

const ArchivariusIndexer = {
    async extract(content, mime, name) {
        // Normalize content to string
        let text = '';
        if (typeof content === 'string') text = content;
        else if (content instanceof ArrayBuffer) text = new TextDecoder().decode(content);
        else if (content && content.data) text = String(content.data);

        // Simple heuristics
        const tags = this.extractTags(text);
        const sentences = this.splitSentences(text);
        const facts = sentences.filter(s => s.length > 10).map((s, i) => ({ id: `${name}_f_${i}`, text: s.trim(), confidence: this.estimateConfidence(s) }));
        const events = this.extractEvents(text);
        const relations = this.extractSimpleRelations(text);
        const people = this.extractPeople(text);
        const quotes = this.extractQuotes(text);

        return {
            name,
            mime,
            tags,
            facts,
            events,
            relations,
            people,
            quotes
        };
    },

    splitSentences(text) {
        return text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/g).map(s => s.trim()).filter(Boolean);
    },

    extractTags(text) {
        const tags = new Set();
        // words prefixed with #
        (text.match(/#\w+/g) || []).forEach(t => tags.add(t.replace('#', '')));
        // common keywords
        ['urgent','todo','meeting','decision','proposal','idea','report','error'].forEach(k => { if (text.toLowerCase().includes(k)) tags.add(k); });
        return Array.from(tags);
    },

    estimateConfidence(s) {
        const len = s.split(' ').length;
        return Math.min(1, len / 30);
    },

    extractEvents(text) {
        const events = [];
        const pattern = /(\b\w+\b)\s+(created|updated|deleted|fixed|launched|released|approved)\s+(\b[\w-]+\b)/gi;
        let m;
        while ((m = pattern.exec(text)) !== null) {
            events.push({ id: `ev_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, subject: m[1], action: m[2], object: m[3] });
        }
        return events;
    },

    extractSimpleRelations(text) {
        const relations = [];
        // Look for "X related to Y" or "X -> Y"
        const relPattern = /(\b[\w-]+\b)\s+(related to|->|is linked to|connected to)\s+(\b[\w-]+\b)/gi;
        let r;
        while ((r = relPattern.exec(text)) !== null) {
            relations.push({ id: `rel_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, a: r[1], type: r[2], b: r[3] });
        }
        return relations;
    },

    extractPeople(text) {
        const people = [];
        const names = (text.match(/\b[A-ZÄÖÅ][a-zäöå]+\s+[A-ZÄÖÅ][a-zäöå]+\b/g) || []);
        names.forEach(n => { if (!people.includes(n)) people.push(n); });
        return people.map(n => ({ name: n }));
    },

    extractQuotes(text) {
        const qs = [];
        const pattern = /"([^\"]{10,})"/g;
        let q;
        while ((q = pattern.exec(text)) !== null) {
            qs.push({ text: q[1] });
        }
        return qs;
    }
};

window.ArchivariusIndexer = ArchivariusIndexer;
