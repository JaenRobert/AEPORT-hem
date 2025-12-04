import express from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const router = express.Router();
const bookDir = path.join(process.cwd(), "data", "book");
const bookIndex = path.join(bookDir, "index.json");

// Ensure book directory exists
fs.mkdir(bookDir, { recursive: true }).catch(console.error);

// GET /api/book - Hämta hela boken
router.get("/api/book", async (req, res) => {
  try {
    const indexContent = await fs.readFile(bookIndex, "utf8").catch(() => '{"chapters":[]}');
    const index = JSON.parse(indexContent);
    
    // Load all chapters
    const chapters = await Promise.all(
      index.chapters.map(async (chapterRef) => {
        const chapterPath = path.join(bookDir, `${chapterRef.id}.json`);
        const content = await fs.readFile(chapterPath, "utf8");
        return JSON.parse(content);
      })
    );
    
    res.json({ 
      book: {
        title: "ÆSI NEXUS - Boken",
        created: index.created || new Date().toISOString(),
        chapters
      }
    });
    
  } catch (err) {
    console.error("Get book error:", err);
    res.status(500).json({ error: "Failed to get book" });
  }
});

// POST /api/book/chapter - Skapa nytt kapitel från Tunnan
router.post("/api/book/chapter", async (req, res) => {
  try {
    const { title, content, tags = [], metadata = {} } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content required" });
    }
    
    const id = crypto.randomBytes(16).toString("hex");
    
    const chapter = {
      id,
      title,
      content,
      tags,
      metadata,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.userId || "anonymous",
      aiNodes: metadata.aiNodes || []
    };
    
    // Save chapter
    const chapterPath = path.join(bookDir, `${id}.json`);
    await fs.writeFile(chapterPath, JSON.stringify(chapter, null, 2));
    
    // Update index
    const indexContent = await fs.readFile(bookIndex, "utf8").catch(() => '{"chapters":[]}');
    const index = JSON.parse(indexContent);
    
    if (!index.chapters) index.chapters = [];
    if (!index.created) index.created = new Date().toISOString();
    
    index.chapters.push({ id, title, createdAt: chapter.createdAt });
    index.updated = new Date().toISOString();
    
    await fs.writeFile(bookIndex, JSON.stringify(index, null, 2));
    
    // Log to ledger
    await logToLedger({
      type: "book_chapter_added",
      chapterId: id,
      title,
      userId: req.user?.userId
    });
    
    res.json({ success: true, chapter });
    
  } catch (err) {
    console.error("Add chapter error:", err);
    res.status(500).json({ error: "Failed to add chapter" });
  }
});

// DELETE /api/book/:id - Radera kapitel
router.delete("/api/book/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete chapter file
    const chapterPath = path.join(bookDir, `${id}.json`);
    await fs.unlink(chapterPath);
    
    // Update index
    const index = JSON.parse(await fs.readFile(bookIndex, "utf8"));
    index.chapters = index.chapters.filter(c => c.id !== id);
    index.updated = new Date().toISOString();
    await fs.writeFile(bookIndex, JSON.stringify(index, null, 2));
    
    await logToLedger({
      type: "book_chapter_deleted",
      chapterId: id,
      userId: req.user?.userId
    });
    
    res.json({ success: true });
    
  } catch (err) {
    console.error("Delete chapter error:", err);
    res.status(500).json({ error: "Failed to delete chapter" });
  }
});

// Export book as markdown
router.get("/api/book/export", async (req, res) => {
  try {
    const indexContent = await fs.readFile(bookIndex, "utf8");
    const index = JSON.parse(indexContent);
    
    let markdown = `# ÆSI NEXUS - Boken\n\nGenerad: ${new Date().toISOString()}\n\n---\n\n`;
    
    for (const chapterRef of index.chapters) {
      const chapterPath = path.join(bookDir, `${chapterRef.id}.json`);
      const chapter = JSON.parse(await fs.readFile(chapterPath, "utf8"));
      
      markdown += `## ${chapter.title}\n\n`;
      markdown += `*Skapad: ${chapter.createdAt}*\n\n`;
      markdown += `${chapter.content}\n\n---\n\n`;
    }
    
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", 'attachment; filename="aesi-boken.md"');
    res.send(markdown);
    
  } catch (err) {
    console.error("Export book error:", err);
    res.status(500).json({ error: "Failed to export book" });
  }
});

async function logToLedger(entry) {
  const ledgerPath = path.join(__dirname, "../../data/ledger/arvskedjan_d.jsonl");
  entry.timestamp = new Date().toISOString();
  entry.hash = crypto.createHash("sha256").update(JSON.stringify(entry)).digest("hex").substring(0, 16);
  await fs.appendFile(ledgerPath, JSON.stringify(entry) + "\n", "utf-8");
}

export default router;
