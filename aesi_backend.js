```javascript
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";
import codeDeploy from "./server/routes/code-deploy.js";
import { initWebSocket } from "./server/websocket.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static("public"));
app.use(codeDeploy);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    version: "5.0.0",
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
initWebSocket(server);

// Auto-deploy on start if enabled
if (process.env.AUTO_DEPLOY_ON_START === "true" && process.env.NETLIFY_BUILD_HOOK) {
  setTimeout(() => {
    console.log("🌐 Triggering Netlify auto-deploy...");
    fetch(process.env.NETLIFY_BUILD_HOOK, { method: "POST" })
      .then(() => console.log("✅ Netlify build triggered successfully"))
      .catch((err) => console.log("⚠️  Could not trigger Netlify build:", err.message));
  }, 3000);
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("");
  console.log("=".repeat(60));
  console.log("⚡ ÆSI NEXUS V5.0 - AUTONOMOUS CORE ONLINE");
  console.log("=".repeat(60));
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 Status: PRODUCTION READY`);
  console.log(`🔗 WebSocket: Active`);
  console.log(`🚀 Auto-Deploy: ${process.env.AUTO_DEPLOY_ON_START === "true" ? "Enabled" : "Disabled"}`);
  console.log("=".repeat(60));
  console.log("");
  
  // Auto-open browser if enabled
  if (process.env.AUTO_OPEN_BROWSER === "true") {
    const url = `http://localhost:${PORT}/ai_console.html`;
    const start = process.platform === "darwin" ? "open" :
                  process.platform === "win32" ? "start" : "xdg-open";
    
    setTimeout(() => {
      require("child_process").exec(`${start} ${url}`, (err) => {
        if (!err) {
          console.log(`🌐 Browser opened: ${url}\n`);
        }
      });
    }, 2000);
  }
});
```