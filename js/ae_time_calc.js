// ======================================================
// Æ-TIME CALCULATOR v1.0
// Swedish time-based indexing system
// Start point: 2025-11-18 20:25:00 (Swedish time)
// ======================================================

const AeTimeCalc = {
    // Portal start: 2025-11-18 20:25:00 Swedish time
    AE_TID_START: new Date('2025-11-18T20:25:00+01:00').getTime(),
    
    // Get current Æ-time offset in hours with fractions
    getCurrentOffset() {
        const now = Date.now();
        const diffMs = now - this.AE_TID_START;
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours;
    },

    // Format Æ-time index
    // Returns: "+72.32h" or "-105.88h" format
    formatAeTime(offsetHours) {
        const sign = offsetHours >= 0 ? '+' : '';
        return `${sign}${offsetHours.toFixed(2)}h`;
    },

    // Get current Æ-time in standard format
    getAeTime() {
        return this.formatAeTime(this.getCurrentOffset());
    },

    // Create Æ-time object for any data structure
    createAeTimeObject(dataId = null) {
        const offset = this.getCurrentOffset();
        return {
            'Æ-TID_START': '2025111820.25',
            'Æ-TID_INDEX': this.formatAeTime(offset),
            'Æ-TID_TAG': offset >= 0 ? '(+)' : '(-)',
            'timestamp': new Date().toISOString(),
            'id': dataId || crypto.randomUUID()
        };
    },

    // Log event with Æ-time
    logWithAeTime(event, data = {}) {
        const aeTime = this.createAeTimeObject();
        return {
            ...aeTime,
            event: event,
            data: data
        };
    }
};

window.AeTimeCalc = AeTimeCalc;
