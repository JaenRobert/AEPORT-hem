// Æ-GATEKEEPER v1.0
// Implements passwordless node-based verification by sending /pulse requests

const AeGatekeeper = {
    nodes: [
        { id: '010', name: 'E1TAN' },
        { id: '020', name: 'REFLEX' },
        { id: '030', name: 'HAFTED' },
        { id: '040', name: 'CLAUDE' },
        { id: '050', name: 'SMILE' },
        { id: '060', name: 'ERNIE' }
    ],

    timeoutMs: 10000,

    open() {
        document.getElementById('gatekeeperOverlay').classList.add('open');
    },

    close() {
        document.getElementById('gatekeeperOverlay').classList.remove('open');
    },

    updateNodeIndicator(nodeId, status) {
        const dot = document.getElementById(`node-${nodeId}-verify`);
        const statusText = dot?.parentElement?.querySelector('.node-verify-status');
        if (!dot) return;
        dot.classList.remove('pending','verified','failed');
        if (status === 'pending') dot.classList.add('pending');
        if (status === 'verified') dot.classList.add('verified');
        if (status === 'failed') dot.classList.add('failed');
        if (statusText) statusText.textContent = status;
    },

    async requestAccess(purpose = '') {
        // Reset UI
        this.nodes.forEach(n => this.updateNodeIndicator(n.id, 'pending'));

        // Build pulse payload (collective verification)
        const payload = { node: '010', text: 'Verify identity of incoming operator.', purpose, collective_verify: true };

        // Send pulse to server (collective fan-out)
        try {
            const res = await fetch('/pulse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Pulse failed');
            // Expect server to fan-out to nodes and return aggregated status
            const result = await res.json();

            // result expected: { nodes: { '010': { verified: true }, ... }, verified: true }
            const nodes = result.nodes || {};
            let allVerified = true;
            this.nodes.forEach(n => {
                const r = nodes[n.id];
                if (r && r.verified) {
                    this.updateNodeIndicator(n.id, 'verified');
                } else {
                    this.updateNodeIndicator(n.id, 'failed');
                    allVerified = false;
                }
            });

            if (allVerified) {
                // Log with Æ-time
                const ae = window.AeTimeCalc ? AeTimeCalc.createAeTimeObject() : { 'Æ-TID': 'n/a' };
                // Append to arvskedjan_d.jsonl via API
                await fetch('/api/log-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'gate_opened', by: 'DIRIGENTEN', ae_time: ae, timestamp: new Date().toISOString() }) });

                // Redirect to main portal
                window.location.href = 'index.html';
            } else {
                alert('Verification failed by one or more nodes.');
            }

        } catch (e) {
            console.error('Gate request failed', e);
            alert('Gatekeeper error: ' + String(e));
            this.nodes.forEach(n => this.updateNodeIndicator(n.id, 'failed'));
        }
    }
};

function openGatekeeper() { AeGatekeeper.open(); }
function closeGatekeeper() { AeGatekeeper.close(); }
function requestGateAccess() { const purpose = document.getElementById('gatekeeperInput').value || ''; AeGatekeeper.requestAccess(purpose); }

window.AeGatekeeper = AeGatekeeper;
