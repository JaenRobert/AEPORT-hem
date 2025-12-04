import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const bookDir = path.join(process.cwd(), "data", "book");
const memoryDir = path.join(process.cwd(), "data", "memory");

if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir, { recursive: true });

// GET /api/book - Hämta hela boken
router.get("/api/book", (req, res) => {
  const files = fs.readdirSync(bookDir).filter(f => f.endsWith(".json"));
  let chapters = [];
  for (const f of files) {
    const content = JSON.parse(fs.readFileSync(path.join(bookDir, f), "utf8"));
    chapters.push(content);
  }
  res.json(chapters);
});

// POST /api/book/chapter - Skapa nytt kapitel från Tunnan
router.post("/api/book/chapter", (req, res) => {
  try {
    const { title } = req.body;
    const date = new Date().toISOString().split("T")[0];
    const memoryFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith(".json"));
    let combined = [];

    for (const file of memoryFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(memoryDir, file), "utf8"));
      combined = combined.concat(data);
    }

    const chapter = {
      id: Date.now(),
      title: title || "Kapitel från " + date,
      date,
      content: combined,
      metadata: { count: combined.length }
    };

    fs.writeFileSync(path.join(bookDir, date + ".json"), JSON.stringify(chapter, null, 2));
    res.send("✅ Nytt kapitel skapat: " + chapter.title);
  } catch (e) {
    res.status(500).send("Fel vid skapande: " + e.message);
  }
});

// DELETE /api/book/:date - Radera kapitel
router.delete("/api/book/:date", (req, res) => {
  const file = path.join(bookDir, req.params.date + ".json");
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.send("🗑️ Kapitel raderat: " + req.params.date);
});

export default router;
