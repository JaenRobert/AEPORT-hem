// Omega Gate client logic: simple resonance match using /pulse collective verify
const SigilGate = {
    openQuestion() {
        document.getElementById('question').style.display = 'block';
    },
    async submitIdentity() {
        const who = document.getElementById('who').value || '';
        if (!who) return alert('Skriv något kort');
        // send to /pulse for collective resonance check
        const payload = { node: '010', text: `Verify identity resonance of: ${who}`, collective_verify: true };
        try {
            const res = await fetch('/pulse', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
            const r = await res.json();
            if (r.verified) {
                // success
                await fetch('/api/log-event', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ event:'omega_gate_open', by:'DIRIGENTEN', subject: who, timestamp: new Date().toISOString() }) });
                window.location.href = '/index.html';
            } else {
                alert('Identification failed.');
            }
        } catch (e) {
            console.error(e);
            alert('Gate error');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sigil').addEventListener('click', () => SigilGate.openQuestion());
    document.getElementById('askBtn').addEventListener('click', () => SigilGate.submitIdentity());
});
