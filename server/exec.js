import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

app.post("/api/exec", (req, res) => {
  exec(req.body.command, { shell: "powershell.exe" }, (e, out, err) => res.send(out || "Klar"));
});

app.post("/api/build", (req, res) => {
    const { filename, content } = req.body;
    const projectRoot = path.join(__dirname, '..');
    const filePath = path.join(projectRoot, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Fil skapad:", filename);
    
    // Auto-Deploy
    exec("powershell .\\deploy_nimb.ps1", { cwd: projectRoot, shell: "powershell.exe" }, (e, out) => {
        res.send("Fil skapad + Deploy Live: " + out);
    });
});

app.listen(process.env.PORT || 3000, () => console.log("ÆSI Backend Ready"));
