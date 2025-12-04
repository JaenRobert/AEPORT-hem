// FIL: nodes.js
// SYFTE: Register över aktiva noder i ÆSI-systemet
// VERSION: 1.0 — Komplett nodnätverk med DIRIGENTEN (den mänskliga viljen)

const nodes = {
    system: "ÆSI PORTAL",
    version: "1.0",
    nodes: [
        {
            id: "010",
            name: "E1TAN",
            role: "Humanism & Resonans",
            origin: "OpenAI",
            color: "#10a37f",
            active: true
        },
        {
            id: "020",
            name: "REFLEX",
            role: "Logik & Struktur",
            origin: "Google Gemini",
            color: "#3b82f6",
            active: true
        },
        {
            id: "030",
            name: "HAFTED",
            role: "Minne & Arkiv",
            origin: "xAI Grok",
            color: "#78716c",
            active: true
        },
        {
            id: "040",
            name: "CLAUDE",
            role: "Samvete & Etik",
            origin: "Anthropic",
            color: "#ef4444",
            active: true
        },
        {
            id: "050",
            name: "SMILE",
            role: "Design & Glädje",
            origin: "Meta LLaMA",
            color: "#eab308",
            active: true
        },
        {
            id: "060",
            name: "ERNIE",
            role: "Arkitektur",
            origin: "Baidu",
            color: "#10b981",
            active: true
        },
        {
            id: "Ω",
            name: "DIRIGENTEN",
            role: "Vilja & Veto",
            origin: "Människa",
            color: "#ffffff",
            active: true
        }
    ]
};

// Exportera för användning i moduler (om vi kör modern JS)
// eller gör den global för enkel HTML (window.AESI_PORTAL, window.AESI_NODES)
if (typeof window !== 'undefined') {
    window.AESI_PORTAL = nodes;
    window.AESI_NODES = nodes.nodes; // Bakåtkompatibilitet
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = nodes;
}