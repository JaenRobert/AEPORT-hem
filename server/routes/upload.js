import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import crypto from "crypto";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "data", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure upload directory exists
fs.promises.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [".txt", ".md", ".json", ".pdf", ".png", ".jpg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error("Otillåten filtyp"));
    cb(null, true);
  }
});

router.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Ingen fil mottagen.");
    const filepath = req.file.path;
    console.log("Fil mottagen:", filepath);

    const { filename, content, metadata = {} } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content required' });
    }

    // Validate file size
    const size = Buffer.byteLength(content, 'utf8');
    if (size > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File too large (max 10MB)' });
    }

    // Generate unique ID
    const id = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(filename);
    const safeName = `${id}${ext}`;

    // Save file
    const fileSavePath = path.join(uploadDir, safeName);
    await fs.promises.writeFile(fileSavePath, content, 'utf8');

    // Save metadata
    const metaFile = {
      id,
      originalName: filename,
      storedName: safeName,
      size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.userId || 'anonymous',
      metadata
    };

    const metaPath = path.join(uploadDir, `${id}.meta.json`);
    await fs.promises.writeFile(metaPath, JSON.stringify(metaFile, null, 2));

    // Log to ledger
    await logToLedger({
      type: 'file_upload',
      fileId: id,
      filename,
      size,
      userId: req.user?.userId
    });

    // Starta backup
    exec("powershell ./scripts/proton_backup.ps1", { shell: "powershell.exe" });
    return res.send("✅ Filen laddades upp och backup triggas!");
  } catch (e) {
    res.status(500).send("Fel: " + e.message);
  }
});

async function logToLedger(entry) {
  const ledgerPath = path.join(__dirname, '../../data/ledger/arvskedjan_d.jsonl');
  entry.timestamp = new Date().toISOString();
  entry.hash = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex').substring(0, 16);
  await fs.promises.appendFile(ledgerPath, JSON.stringify(entry) + '\n', 'utf-8');
}

export default router;
