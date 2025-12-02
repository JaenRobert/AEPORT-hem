import React from "react";
export default function PulseIndicator({ running }){
  return (
    <div style={{ marginTop:20 }}>
      {running ? (
        <div style={{
          width:20, height:20, borderRadius:"50%", background:"#0f0",
          animation:"pulse 1s infinite"
        }} />
      ) : <p>Puls inaktiv</p>}
      <style>{`@keyframes pulse{0%{opacity:.3;}50%{opacity:1;}100%{opacity:.3;}}`}</style>
    </div>
  );
}