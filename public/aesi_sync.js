// ÆSI WebCore - Synkmodul (ES6)
/* Synkhantering mellan Book, Memory, Uploads, Arkivarius */
window.AesiSync = {
  queue: [],
  isOnline: navigator.onLine,
  syncInterval: 60000,

  init() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("🌐 ÆSI Sync: Back online - flushing queue");
      this.flushQueue();
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("📴 ÆSI Sync: Offline mode - queueing changes");
    });
    this.autoSync();
  },

  async syncModules() {
    try {
      const book = await AesiCore.getAll("book");
      const memory = await AesiCore.getAll("memory");
      const uploads = await AesiCore.getAll("uploads");
      
      console.log("✅ ÆSI Sync: Modules synced", {
        book: book.length,
        memory: memory.length,
        uploads: uploads.length,
      });

      await AesiCore.save("logs", {
        type: "sync",
        info: "Modules synced successfully",
        time: new Date().toISOString(),
        online: this.isOnline,
      });

      // Sync to Netlify if online
      if (this.isOnline) {
        await this.syncToNetlify(book, memory, uploads);
      }
    } catch (err) {
      console.error("❌ ÆSI Sync Error:", err);
      await AesiCore.save("logs", {
        type: "sync_error",
        info: err.message,
        time: new Date().toISOString(),
      });
    }
  },

  async syncToNetlify(book, memory, uploads) {
    try {
      // Mock sync to Netlify endpoints
      await Promise.all([
        fetch("/.netlify/functions/book", {
          method: "POST",
          body: JSON.stringify({ data: book }),
        }).catch(e => console.log("Book sync:", e.message)),
        fetch("/.netlify/functions/memory", {
          method: "POST",
          body: JSON.stringify({ data: memory }),
        }).catch(e => console.log("Memory sync:", e.message)),
        fetch("/.netlify/functions/upload", {
          method: "POST",
          body: JSON.stringify({ data: uploads }),
        }).catch(e => console.log("Upload sync:", e.message)),
      ]);
      console.log("🔄 ÆSI Sync: Netlify sync complete");
    } catch (err) {
      console.warn("⚠️ Netlify sync failed (offline?):", err.message);
    }
  },

  enqueue(action, data) {
    this.queue.push({ action, data, time: Date.now() });
    console.log("📦 Queued:", action);
  },

  async flushQueue() {
    if (!this.isOnline || this.queue.length === 0) return;
    console.log(`⏳ Flushing ${this.queue.length} queued actions...`);
    const batch = [...this.queue];
    this.queue = [];
    for (const item of batch) {
      await AesiCore.save("logs", {
        type: "queued_action",
        action: item.action,
        time: item.time,
      });
    }
    console.log("✅ Queue flushed");
  },

  autoSync() {
    this.syncModules();
    setInterval(() => this.syncModules(), this.syncInterval);
  },
};

AesiSync.init();
