import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "data", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

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

router.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Ingen fil mottagen.");
    const filepath = req.file.path;
    console.log("Fil mottagen:", filepath);

    // Starta backup
    exec("powershell ./scripts/proton_backup.ps1", { shell: "powershell.exe" });
    return res.send("✅ Filen laddades upp och backup triggas!");
  } catch (e) {
    res.status(500).send("Fel: " + e.message);
  }
});

export default router;
