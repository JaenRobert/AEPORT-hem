import express from "express";
import fetch from "node-fetch";
import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const clients = new Set();
const wss = new WebSocketServer({ port: 8767 });
console.log("[ÆSI] LiveLink WebSocket online @ ws://127.0.0.1:8767");

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send("SERVER_LOG: Connected to ÆSI LiveLink Core.");
  ws.on("close", () => clients.delete(ws));
});

function broadcast(msg) {
  for (const client of clients) if (client.readyState === WebSocket.OPEN) client.send(msg);
}

router.post("/api/pulse", async (req, res) => {
  const { node, prompt, apiKey } = req.body;
  if (!prompt) return res.status(400).send("Missing prompt");
  try {
    broadcast("CHAT_MSG: Dirigent: " + prompt);
    let responseText = "";

    if (node === "Gemini") {
      const resp = await fetch(
        \https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\\,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      const data = await resp.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    } else if (node === "GPT") {
      responseText = "[E1TAN] (GPT): Placeholder integration – awaiting API key.";
    } else if (node === "Claude") {
      responseText = "[CLAUDE]: Placeholder integration.";
    }

    broadcast("CHAT_MSG: " + node + ": " + responseText);
    res.send("✅ Pulse sent to " + node);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error: " + e.message);
  }
});

export default router;
