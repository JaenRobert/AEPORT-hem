import express from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const router = express.Router();

// 🔧 Uppdatera filer direkt från AI Console
router.post("/api/code-deploy", (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) return res.status(400).send("Missing filename or content");
  
  const filePath = path.join(process.cwd(), "public", filename);
  fs.writeFileSync(filePath, content, "utf8");
  
  // Kör Netlify build i bakgrunden
  exec("npm run build", { shell: "powershell.exe" }, (err) => {
    if (err) console.error("Build error:", err);
    else console.log("✅ Build complete for", filename);
  });

  res.send("✅ File updated and build started for " + filename);
});

export default router;
