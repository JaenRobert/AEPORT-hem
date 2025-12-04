import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const memoryDir = path.join(process.cwd(), "data", "memory");
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });

// Hjälpfunktion för att läsa JSON-fil
function readMemory(date) {
  const filePath = path.join(memoryDir, date + ".json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// GET /api/memory - lista alla konversationer
router.get("/api/memory", (req, res) => {
  const files = fs.readdirSync(memoryDir).filter(f => f.endsWith(".json"));
  let all = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(memoryDir, f), "utf8"));
    all = all.concat(data);
  }
  res.json(all);
});

// POST /api/memory - spara ny konversation
router.post("/api/memory", (req, res) => {
  try {
    const entry = req.body;
    if (!entry || !entry.text) return res.status(400).send("Saknar innehåll.");

    const date = new Date().toISOString().split("T")[0];
    const filePath = path.join(memoryDir, date + ".json");
    const existing = readMemory(date);
    existing.push({ id: Date.now(), ...entry });
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    res.send("✅ Sparat i Tunnan (" + date + ")");
  } catch (e) {
    res.status(500).send("Fel vid lagring: " + e.message);
  }
});

// DELETE /api/memory/:id - ta bort specifik post
router.delete("/api/memory/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const date = new Date().toISOString().split("T")[0];
  const existing = readMemory(date);
  const updated = existing.filter(e => e.id !== id);
  fs.writeFileSync(path.join(memoryDir, date + ".json"), JSON.stringify(updated, null, 2));
  res.send("🗑️ Inlägg raderat: " + id);
});

export default router;
