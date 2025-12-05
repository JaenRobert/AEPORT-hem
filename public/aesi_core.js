// ÆSI Core: Backend-emulator (lokal i browsern)

class AesiCore {
  constructor() {
    this.dbName = "ÆSI_CORE_DB";
    this.dbVersion = 1;
    this.ready = this.initDB();
    console.log("ÆSI Core: Initialized local backend");
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        ["uploads", "book", "memory", "logs"].forEach((store) => {
          if (!db.objectStoreNames.contains(store))
            db.createObjectStore(store, { keyPath: "id", autoIncrement: true });
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = (err) => reject(err);
    });
  }

  async save(store, data) {
    const db = await this.ready;
    return new Promise((resolve) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).add({ ...data, date: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
    });
  }

  async getAll(store) {
    const db = await this.ready;
    return new Promise((resolve) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
    });
  }

  async uploadFile(file) {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = async () => {
        await this.save("uploads", {
          name: file.name,
          type: file.type,
          content: reader.result,
        });
        await this.log("upload", `Fil sparad: ${file.name}`);
        resolve({ status: 200, message: "✅ Fil sparad lokalt i ÆSI Tunnan" });
      };
      reader.readAsDataURL(file);
    });
  }

  async addBookChapter(title, content) {
    await this.save("book", { title, content });
    await this.log("book", `Kapitel tillagt: ${title}`);
    return { status: 200, message: "✅ Kapitel sparat i Boken" };
  }

  async addMemoryEntry(text, node = "REFLEX") {
    await this.save("memory", { text, node });
    await this.log("memory", `Memory: ${text.substring(0, 50)}...`);
    return { status: 200, message: "✅ Sparad i Tunnan" };
  }

  async log(action, message) {
    await this.save("logs", { action, message });
  }

  async getLogs() {
    return this.getAll("logs");
  }

  async getUploads() {
    return this.getAll("uploads");
  }

  async getBook() {
    return this.getAll("book");
  }

  async getMemory() {
    return this.getAll("memory");
  }
}

window.AesiCore = new AesiCore();
