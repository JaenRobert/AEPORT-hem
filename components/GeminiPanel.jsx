import React, { useState, useEffect } from "react";

export default function GeminiPanel() {
  const [content, setContent] = useState(
    localStorage.getItem("aesi_v3_content") || "Skriv här, Dirigent..."
  );
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("aesi_v3_content", content);
      setSaved(true);
    }, 1000);
    setSaved(false);
    return () => clearTimeout(handler);
  }, [content]);

  return (
    <div className="console-container">
      <header className="header">
        <h1>ÆSI CONSOLE — v3.3</h1>
        <div className="save-indicator">
          <span className={saved ? "dot saved" : "dot unsaved"}></span>
          {saved ? "SPARAT" : "SPARAR..."}
        </div>
      </header>

      <main className="main-area">
        <aside className="sidebar-left">
          <h3>Noder</h3>
          <ul>
            <li>🟣 E1tan</li>
            <li>🔵 Reflex</li>
            <li>🔴 Claude</li>
            <li>⚫ Hafted</li>
            <li>🟡 Smile</li>
            <li>🟢 Ernie</li>
          </ul>
        </aside>

        <section className="editor">
          <div
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: content }}
          ></div>
        </section>

        <aside className="sidebar-right">
          <h3>AI-Panel</h3>
          <textarea
            id="aiInput"
            placeholder="Skriv till systemet..."
            className="ai-input"
          ></textarea>
          <button className="ai-btn">Skicka</button>
          <div id="aiOutput" className="ai-output"></div>
        </aside>
      </main>
    </div>
  );
}
