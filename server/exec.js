import express from "express";
import { exec } from "child_process";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// === [1] /api/exec  ===
app.post("/api/exec", (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).send("⚠️ Inget kommando angivet.");
  exec(command, { shell: "powershell.exe" }, (e, out, err) => {
    if (e) return res.send(`❌ Fel: ${e.message}`);
    if (err) return res.send(`⚙️ ${err}`);
    res.send(out || "✅ Klar");
  });
});

// === [2] /api/build ===
app.post("/api/build", (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) return res.status(400).send("⚠️ Saknar filnamn eller innehåll.");

  const projectRoot = path.join(__dirname, "..");
  const filePath = path.join(projectRoot, filename);

  try {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("📄 Fil skapad:", filename);

    exec("powershell .\\deploy_nimb.ps1", { cwd: projectRoot, shell: "powershell.exe" }, (e, out, err) => {
      if (e) return res.send(`✅ Fil skapad men deploy misslyckades: ${err}`);
      res.send(`✅ Fil skapad + Deploy Live: ${out}`);
    });
  } catch (err) {
    res.status(500).send(`❌ Kunde inte skriva filen: ${err.message}`);
  }
});

// === [3] /api/vision-update ===
app.post("/api/vision-update", async (req, res) => {
  const { prompt, apiKey, targetFile } = req.body;
  if (!prompt || !apiKey || !targetFile)
    return res.status(400).send("⚠️ Missing prompt, apiKey or targetFile");

  try {
    console.log(`🤖 Skickar vision till Gemini för fil: ${targetFile}`);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Uppdatera denna fil (${targetFile}) baserat på följande vision: "${prompt}". Returnera endast filens fulla kod.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const newCode = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!newCode) return res.status(500).send("Inget kodinnehåll returnerades från Gemini.");

    fs.writeFileSync(targetFile, newCode, "utf8");
    console.log("🧠 Vision tillämpad på:", targetFile);

    res.send(`✅ Filen ${targetFile} har uppdaterats via Gemini.`);
  } catch (e) {
    console.error(e);
    res.status(500).send("❌ Fel vid kodgenerering: " + e.message);
  }
});

app.listen(PORT, () =>
  console.log(`⚡ ÆSI Backend Ready på port ${PORT} — (Build + Vision + Exec aktiv)`)
);
