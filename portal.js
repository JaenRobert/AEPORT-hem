// FIL: portal.js

// 1. DOM-element
const logo = document.getElementById('ae-logo');
const portalScreen = document.getElementById('portal-screen');
const chatScreen = document.getElementById('chat-screen');
const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const header = document.getElementById('chat-header'); // Vi lägger menyn här

// 2. Initiera Noder (från nodes.js)
function initNodes() {
    // Skapa en select-meny om den inte finns
    let select = document.getElementById('node-select');
    if (!select) {
        select = document.createElement('select');
        select.id = 'node-select';
        header.appendChild(select);
    }
    
    // Töm och fyll på från globala AESI_NODES
    select.innerHTML = '';
    if (typeof window.AESI_NODES !== 'undefined') {
        window.AESI_NODES.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = `${node.name} (${node.platform})`;
            option.style.color = node.color; // Lite styling i listan
            select.appendChild(option);
        });
    } else {
        console.error("nodes.js verkar saknas eller laddades inte korrekt.");
    }

    // Lyssna på ändring för att byta tema? (Överkurs, men snyggt)
    select.addEventListener('change', () => {
        const selectedId = select.value;
        const node = window.AESI_NODES.find(n => n.id === selectedId);
        if(node) {
            inputField.style.borderColor = node.color;
            sendBtn.style.backgroundColor = node.color;
        }
    });
    
    // Sätt startfärg
    if(window.AESI_NODES && window.AESI_NODES.length > 0) {
        sendBtn.style.backgroundColor = window.AESI_NODES[0].color;
    }
}

// 3. Växlings-logik (Logga -> Chatt)
function openPortal() {
    portalScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    initNodes(); // Ladda noderna när porten öppnas
}

logo.addEventListener('click', openPortal);

// Mobil-rotation trigger
window.addEventListener("orientationchange", () => {
    // Enkel koll: Om vi roterar, visa chatten (förenklad logik för demo)
    openPortal(); 
});

// 4. Chat-funktion (Mockup -> Backend redo)
function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    // Hitta vald nod
    const select = document.getElementById('node-select');
    const nodeId = select ? select.value : "Unknown";
    const nodeObj = window.AESI_NODES ? window.AESI_NODES.find(n => n.id === nodeId) : {name: "AI", color: "#fff"};

    // 1. Visa ditt meddelande
    chatBox.innerHTML += `<div class="msg user"><b>Du:</b> ${text}</div>`;
    inputField.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // 2. Simulera svar (Här kopplar vi in aesi_core.py senare)
    setTimeout(() => {
        chatBox.innerHTML += `<div class="msg ai" style="border-left: 3px solid ${nodeObj.color}">
                                <b style="color:${nodeObj.color}">${nodeObj.name}:</b> 
                                Mottaget. Signalen loggad i Arvskedjan.
                              </div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 400);
}

sendBtn.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});