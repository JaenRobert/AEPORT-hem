import React, { useState } from "react";
import PulseIndicator from "./js/PulseIndicator";
import { startLoop } from "./js/engine";

export default function App() {
  const [active, setActive] = useState(false);
  const start = () => { setActive(true); startLoop(); };

  return (
    <div style={{ padding: 40, fontFamily: "Inter", color: "#eee" }}>
      <h1>ÆPORT — Local Portal</h1>
      <PulseIndicator running={active} />
      {!active && (
        <button onClick={start}
          style={{ padding:"12px 20px", background:"#444", border:"1px solid #666", color:"#fff", marginTop:20 }}>
          Starta Pulsloop
        </button>
      )}
    </div>
  );
}