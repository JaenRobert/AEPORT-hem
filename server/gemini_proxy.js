import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config({ path: "./config/.env" });

export async function askGemini(prompt) {
  const key = process.env.GEMINI_API_KEY || "";
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + key,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini svarade inte.";
}