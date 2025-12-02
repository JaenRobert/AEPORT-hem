export async function askPulse(text){
  const res = await fetch("http://localhost:8000/pulse", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ text })
  });
  const data = await res.json();
  return data.reply;
}