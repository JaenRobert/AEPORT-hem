let listening=false;
let recognition;
if('webkitSpeechRecognition' in window){ recognition=new webkitSpeechRecognition(); }
else if('SpeechRecognition' in window){ recognition=new SpeechRecognition(); }

recognition.lang='sv-SE';
recognition.continuous=false;
recognition.onresult=async function(event){
  const transcript=event.results[0][0].transcript;
  document.getElementById('output').innerHTML+=\<div><b>🗣️ Du:</b> \</div>\;
  const node=document.getElementById('node').value;
  const apiKey=document.getElementById('apiKey').value;
  const res=await fetch('/api/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:transcript,node,apiKey})});
  document.getElementById('output').innerHTML+=\<div><b>⚙️ System:</b> Svar skickat till \</div>\;
  speakText('Förfrågan skickad till '+node);
};

function toggleVoice(){
  if(!recognition)return alert('Din webbläsare stöder inte SpeechRecognition.');
  if(!listening){ recognition.start(); listening=true; document.getElementById('micBtn').textContent='🎙️ Lyssnar...'; }
  else { recognition.stop(); listening=false; document.getElementById('micBtn').textContent='🎙️ Starta Lyssning'; }
}
function stopVoice(){ recognition.stop(); listening=false; document.getElementById('micBtn').textContent='🎙️ Starta Lyssning'; }
