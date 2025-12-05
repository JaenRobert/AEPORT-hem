// ÆSI WebCore - Modulindexering (ES6)
(function () {
  const files = [
    "index.html", "portal.html", "book.html", "memory.html", "uploads.html", "archivarius.html",
    "js/navigation_hub.js", "js/menu.js", "aesi_core.js", "aesi_menu.js", "aesi_sync.js", "aesi_index.js",
    "README.md", "package.json", "aesi_core.py",
    "scripts/CLEAN_AND_DEPLOY.ps1", "scripts/VALIDATION.ps1", "scripts/DEPLOY_NOW.ps1", "scripts/SYSTEM_COMPLETE.ps1"
  ];
  const index = [];
  let done = 0;
  const progress = document.createElement("div");
  progress.style.position = "fixed";
  progress.style.bottom = "10px";
  progress.style.left = "10px";
  progress.style.background = "#222";
  progress.style.color = "#00ffe0";
  progress.style.padding = "6px 18px";
  progress.style.borderRadius = "8px";
  progress.style.zIndex = "9999";
  progress.innerText = "Indexerar moduler...";
  document.body.appendChild(progress);

  files.forEach((file, i) => {
    fetch(file, { method: "HEAD" }).then(resp => {
      const size = resp.headers.get("content-length") || "-";
      const updated = resp.headers.get("last-modified") || "-";
      index.push({
        name: file,
        type: file.split(".").pop(),
        path: file,
        updated,
        size
      });
    }).catch(() => {
      index.push({ name: file, type: "unknown", path: file, updated: "-", size: "-" });
    }).finally(() => {
      done++;
      progress.innerText = `Indexerar moduler... (${done}/${files.length})`;
      if (done === files.length) {
        localStorage.setItem("aesi_module_index", JSON.stringify(index));
        progress.innerText = "Indexering klar!";
        setTimeout(() => progress.remove(), 1500);
      }
    });
  });
})();

/* Modulindexering och progress */
class AesiIndex {
  constructor() {
    this.modules = [];
    this.scan();
  }

  async scan() {
    const paths = [
      "book.html", "memory.html", "uploads.html", "portal.html",
      "arkivarius.html"
    ];
    let progress = 0;
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    document.body.append(bar);
    for (const path of paths) {
      this.modules.push({ name: path, updated: Date.now() });
      progress += 20;
      bar.style.width = progress + "%";
      await new Promise(r => setTimeout(r, 150));
    }
    localStorage.setItem("aesi_index", JSON.stringify(this.modules));
    bar.remove();
    console.log("🧩 Index complete:", this.modules);
  }
}
window.INDEX = new AesiIndex();

const barStyle = document.createElement("style");
barStyle.textContent = `
.progress-bar {
  position:fixed;top:0;left:0;height:4px;background:#00ffe0;
  width:0;transition:width 0.3s;z-index:9999;
}`;
document.head.append(barStyle);

window.AesiIndex = {
  modules: ["book", "memory", "uploads", "logs"],
  indexData: {},
  updateInterval: 30000,

  async generateIndex() {
    try {
      this.showProgress("Indexerar moduler...", 0);
      const data = {};
      let progress = 0;
      const step = 100 / this.modules.length;

      for (const mod of this.modules) {
        data[mod] = await AesiCore.getAll(mod);
        progress += step;
        this.showProgress(`Indexerar: ${mod}`, progress);
      }

      this.indexData = data;
      localStorage.setItem("ÆSI_MODULE_INDEX", JSON.stringify(data));
      
      console.log("✅ ÆSI Index: Module data indexed", {
        book: data.book.length,
        memory: data.memory.length,
        uploads: data.uploads.length,
        logs: data.logs.length,
        timestamp: new Date().toISOString(),
      });

      this.showProgress("Indexering klar", 100);
      setTimeout(() => this.hideProgress(), 1500);
    } catch (err) {
      console.error("❌ Indexering failed:", err);
      this.showProgress("Indexering misslyckades", 0);
    }
  },

  showProgress(msg, percent) {
    let bar = document.getElementById("aesi-progress-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "aesi-progress-bar";
      bar.style.cssText = `
        position: fixed;
        top: 50px;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #00ffe0, #00bfa0);
        z-index: 9998;
        box-shadow: 0 0 10px rgba(0, 255, 224, 0.6);
      `;
      document.body.appendChild(bar);
    }
    bar.style.width = percent + "%";
    bar.title = msg;
  },

  hideProgress() {
    const bar = document.getElementById("aesi-progress-bar");
    if (bar) bar.remove();
  },

  async autoUpdateIndex() {
    this.generateIndex();
    setInterval(() => this.generateIndex(), this.updateInterval);
  },

  getIndexData() {
    const stored = localStorage.getItem("ÆSI_MODULE_INDEX");
    return stored ? JSON.parse(stored) : this.indexData;
  },
};

document.addEventListener("DOMContentLoaded", () => {
  AesiIndex.autoUpdateIndex();
});
