/* Æ-PATRULL — skyddar porten, känner igen Dirigenten */

let unlocked = false;
let pressCount = 0;

console.log("Æ-PATRULL 🛟 Aktiv");

window.addEventListener("deviceorientation", (e) => {
    if (unlocked) return;
    const tilt = Math.abs(e.beta);
    if (tilt > 150) {
        showUnlockPrompt();
    }
});

function showUnlockPrompt(){
    const sig = document.getElementById("sigill");
    sig.style.boxShadow = "0 0 35px rgba(250,250,250,0.9)";
    sig.innerText = "Æ";

    sig.onclick = () => {
        pressCount++;
        if(pressCount >= 2){
            unlocked = true;
            window.location.href = "/panel.html";
        }
        setTimeout(()=> pressCount = 0, 1200);
    };
}

(async ()=> {
    const fp = await generateFingerprint();
    const res = await fetch("/api/patrull/check",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({fingerprint:fp})
    });
    try {
        const out = await res.json();
        if(!out.allowed){
            document.getElementById("sigill").innerText = "⛔";
        }
    } catch(e){}
})();

function generateFingerprint(){
    return btoa(navigator.userAgent + "|" + screen.width + "|" + screen.height + "|" + Date.now());
}
