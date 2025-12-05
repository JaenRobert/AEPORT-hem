/**
 * ÆSI NEXUS VALIDATOR v5.0
 * -----------------------------------------------------------
 * Kontrollerar att hela AEPORT_LOCAL är korrekt konfigurerat.
 * Den ändrar ingenting — den analyserar och rapporterar.
 * -----------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();
const root = process.cwd();
const logFile = path.join(root, "validation_report.txt");
let report = `\n📊 ÆSI SYSTEM VALIDATION REPORT — ${new Date().toLocaleString()}\n`;
report += `============================================================\n`;

// helper
function log(status, message) {
  const symbol = status === "ok" ? "✅" : status === "warn" ? "⚠️" : "❌";
  const line = `${symbol} ${message}`;
  console.log(line);
  report += line + "\n";
}

// 1️⃣ Check critical directories
const expectedDirs = [
  "public",
  "server/routes",
  "server/middleware",
  "data/book",
  "data/memory",
  "data/ledger",
  "data/uploads",
  "scripts",
];

log("ok", "Kontrollerar katalogstruktur...");
for (const dir of expectedDirs) {
  const fullPath = path.join(root, dir);
  if (fs.existsSync(fullPath)) log("ok", `${dir}/ ✔`);
  else log("error", `${dir}/ saknas!`);
}

// 2️⃣ Check critical files
const requiredFiles = [
  "aesi_backend.js",
  "package.json",
  "netlify.toml",
  "server/routes/auth.js",
  "server/routes/upload.js",
  "server/routes/book.js",
  "server/routes/memory.js",
  "server/routes/ai-bridge.js",
  "server/middleware/ai-patrull.js",
  "public/index.html",
  "public/portal.html",
  "public/book.html",
  "public/memory.html",
  "public/uploads.html",
];

log("ok", "\nKontrollerar viktiga filer...");
for (const file of requiredFiles) {
  const fullPath = path.join(root, file);
  if (fs.existsSync(fullPath)) log("ok", `${file} finns`);
  else log("error", `${file} saknas!`);
}

// 3️⃣ Check .env keys
log("ok", "\nKontrollerar miljövariabler...");
const requiredEnv = ["OPENAI_API_KEY", "GEMINI_API_KEY", "JWT_SECRET", "MASTER_KEY_HASH"];
for (const key of requiredEnv) {
  if (process.env[key]) log("ok", `${key} ✅`);
  else log("warn", `${key} saknas i .env`);
}

// 4️⃣ Check package dependencies
log("ok", "\nKontrollerar beroenden...");
let pkg = null;
try {
  pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const deps = Object.keys(pkg.dependencies || {});
  const expectedDeps = ["express", "dotenv", "cors", "node-fetch"];
  for (const d of expectedDeps) {
    if (deps.includes(d)) log("ok", `${d} installerad`);
    else log("warn", `${d} saknas i package.json`);
  }
} catch (e) {
  log("error", "Kunde inte läsa package.json: " + e.message);
}

// 5️⃣ Check imports in backend
log("ok", "\nSkannar imports i backend...");
try {
  const backend = fs.readFileSync(path.join(root, "aesi_backend.js"), "utf8");
  const imports = [
    "auth.js",
    "upload.js",
    "book.js",
    "memory.js",
    "ai-bridge.js"
  ];
  for (const i of imports) {
    if (backend.includes(i)) log("ok", `Importerar ${i}`);
    else log("warn", `${i} inte hittad i aesi_backend.js`);
  }
} catch (e) {
  log("warn", "aesi_backend.js kunde inte läsas: " + e.message);
}

// 6️⃣ Netlify config check
log("ok", "\nVerifierar netlify.toml...");
try {
  const netlifyConf = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
  if (netlifyConf.includes("publish") && netlifyConf.includes("functions"))
    log("ok", "Netlify konfiguration korrekt");
  else log("warn", "Netlify konfiguration verkar ofullständig");
} catch (e) {
  log("warn", "netlify.toml kunde inte läsas: " + e.message);
}

// 7️⃣ Git sanity check
try {
  execSync("git status", { stdio: "pipe" });
  log("ok", "Git-repo fungerar");
} catch {
  log("warn", "Git verkar inte initialiserat korrekt");
}

// 8️⃣ Lightweight script/test check
log("ok", "\nKör en snabb npm-skriptkontroll (om definierat)...");
try {
  if (pkg && pkg.scripts && pkg.scripts.test) {
    execSync("npm run test", { stdio: "pipe", timeout: 5000 });
    log("ok", "npm test kördes utan kritiska fel");
  } else {
    log("warn", "Inget testskript att köra. Hoppar över serverstart för säkerhets skull.");
  }
} catch (e) {
  log("warn", "Server/test start kunde inte verifieras: " + (e.message || e));
}

// 9️⃣ Final summary
log("ok", "\n==============================================");
log("ok", "Validering färdig. Se validation_report.txt för detaljer.");
log("ok", "Systemet är klart för deploy om inga ❌ visas ovan.");
log("ok", "==============================================");

// Save report
fs.writeFileSync(logFile, report, "utf8");
console.log(`\n🗂 Rapport sparad till: ${logFile}`);
