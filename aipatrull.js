// === AI PATRULL — Dirigentens Skyddssystem ===
// Skyddar Porten & Pulssidan från obehöriga användare
// Identifierar enbart JAEN baserat på:
//  - skrivmönster
//  - reaktionshastighet
//  - puls i text
//  - mikro-fördröjningar
//  - jordgubbs-signaturen 🍓
//  - "Ja tack, klicka gärna på den också!"

window.AIPatrull = {
    approved: false,
    lastInputTs: 0,

    async verifyHumanAccess(input) {
        const now = performance.now();
        const delta = now - this.lastInputTs;
        this.lastInputTs = now;

        const score = {
            jordgubb: input.includes("🍓") ? 1 : 0,
            dirPhrase: input.toLowerCase().includes("ja tack") ? 1 : 0,
            microDelay: delta < 800 ? 1 : 0,        // du är snabb
            rhythm: input.length % 13 === 1 ? 1 : 0 // TrueJaen 13.1-signatur
        };

        const total = Object.values(score).reduce((a,b)=>a+b,0);

        if(total >= 3){
            this.approved = true;
            return true;
        }

        return false;
    },

    async guard() {
        if(!this.approved) {
            alert("⛔ Endast Dirigenten får passera Porten.");
            return false;
        }
        return true;
    }
};
