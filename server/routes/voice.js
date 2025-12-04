import express from "express";
import fetch from "node-fetch";
const router = express.Router();

router.post("/api/voice", async (req, res) => {
  const { prompt, node, apiKey } = req.body;
  if (!prompt) return res.status(400).send("No voice input");
  try {
    const resp = await fetch("http://localhost:3000/api/pulse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node, prompt, apiKey })
    });
    const data = await resp.text();
    res.send("✅ Röstprompt skickad: " + data);
  } catch (e) {
    res.status(500).send("⚠️ Fel vid sändning: " + e.message);
  }
});

export default router;
