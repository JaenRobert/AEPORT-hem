import jwt from "jsonwebtoken";
const secret = process.env.JWT_SECRET || "AESI_LOCAL_SECRET";

export function aiPatrull(req, res, next) {
  const openMethods = ["GET", "OPTIONS"];
  if (openMethods.includes(req.method)) return next();

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("❌ Ingen token skickad");

  try {
    jwt.verify(token, secret);
    next();
  } catch {
    res.status(403).send("🚫 Ogiltig eller utgången token");
  }
}
