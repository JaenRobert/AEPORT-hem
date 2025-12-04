/**
 * ÆSI NEXUS V3.1 - The Living IDE
 * Integrated AI chat with live code editor and preview
 */

// ============================================
// CHAT SYSTEM
// ============================================

const chatBox = document.getElementById("chat-messages");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const nodeSelector = document.getElementById("nodeSelector");

// Send message
sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;
  
  appendMessage("user", text);
  input.value = "";
  input.focus();
  
  try {
    const node = nodeSelector.value;
    const res = await fetch("/api/pulse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, node })
    });
    
    const data = await res.json();
    const reply = data.reply || data.response || "(inget svar)";
    appendMessage("ai", reply, node);
    
    // Auto-insert code if detected
    if (reply.includes("```") && editor) {
      const codeMatch = reply.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeMatch) {
        const insertConfirm = confirm("AI har genererat kod. Vill du lägga in den i editorn?");
        if (insertConfirm) {
          editor.setValue(codeMatch[1].trim());
        }
      }
    }
  } catch (err) {
    appendMessage("ai", `Fel: ${err.message}`, "SYSTEM");
  }
  
  autoScroll();
};

// Enter to send
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// Append message with Markdown support
function appendMessage(role, text, sender = "AI") {
  const div = document.createElement("div");
  div.className = "chat-msg chat-" + role;
  
  if (role === "user") {
    div.innerHTML = marked.parse(text);
  } else {
    div.innerHTML = marked.parse(`**${sender}:** ${text}`);
  }
  
  chatBox.appendChild(div);
}

// Auto-scroll chat
function autoScroll() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Clear chat
document.getElementById("clearChat").onclick = () => {
  if (confirm("Rensa hela chatten?")) {
    chatBox.innerHTML = "";
    appendMessage("ai", "Chat rensad. Ny konversation påbörjad.", "SYSTEM");
  }
};

// Save chat to Tunnan
document.getElementById("saveChat").onclick = async () => {
  const messages = [...chatBox.querySelectorAll(".chat-msg")]
    .map(msg => msg.textContent)
    .join("\n\n");
  
  try {
    const token = localStorage.getItem("aesi_token");
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        text: messages,
        node: "CONSOLE",
        response: "Chat session saved"
      })
    });
    
    if (res.ok) {
      appendMessage("ai", "💾 Chat sparad i Tunnan!", "SYSTEM");
    }
  } catch (err) {
    appendMessage("ai", `Kunde inte spara: ${err.message}`, "SYSTEM");
  }
  
  autoScroll();
};

// ============================================
// EDITOR SYSTEM
// ============================================

let editor;
let projects = [
  {
    name: "Projekt 1",
    code: "<!DOCTYPE html>\n<html>\n<head>\n  <title>ÆSI NEXUS</title>\n</head>\n<body>\n  <h1>Hello from The Living IDE!</h1>\n  <script>\n    console.log('ÆSI ONLINE');\n  </script>\n</body>\n</html>",
    language: "html"
  }
];
let currentProject = 0;

// Initialize Monaco Editor
require.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs"
  }
});

require(["vs/editor/editor.main"], () => {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: projects[0].code,
    language: "html",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    wordWrap: "on"
  });
  
  // Auto-save with live sync
  editor.onDidChangeModelContent(() => {
    projects[currentProject].code = editor.getValue();
    
    // Update status
    updateEditorStatus("saving");
    
    // Sync to server if live sync enabled
    if (liveSyncEnabled) {
      syncCodeToServer(projects[currentProject].code);
    } else {
      // Just local save
      setTimeout(() => {
        updateEditorStatus("saved");
        setTimeout(() => updateEditorStatus("ready"), 1000);
      }, 500);
    }
  });
  
  // Initial preview
  updatePreview();
  
  // Initialize live sync
  initLiveSync();
});

// Language selector
document.getElementById("languageSelector").onchange = (e) => {
  const lang = e.target.value;
  if (editor) {
    monaco.editor.setModelLanguage(editor.getModel(), lang);
    projects[currentProject].language = lang;
  }
};

// ============================================
// LIVE SYNC SYSTEM
// ============================================

let liveSyncWs = null;
let liveSyncEnabled = false;
let syncTimeout = null;

function initLiveSync() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/live-sync`;
  
  try {
    liveSyncWs = new WebSocket(wsUrl);
    
    liveSyncWs.onopen = () => {
      console.log('🔗 Live sync connected');
      liveSyncEnabled = true;
      updateEditorStatus('synced');
      appendMessage('ai', '🔗 Live sync aktiv! Dina ändringar sparas automatiskt.', 'SYSTEM');
      autoScroll();
    };
    
    liveSyncWs.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleLiveSyncMessage(message);
    };
    
    liveSyncWs.onerror = (error) => {
      console.error('Live sync error:', error);
      liveSyncEnabled = false;
    };
    
    liveSyncWs.onclose = () => {
      console.log('🔌 Live sync disconnected');
      liveSyncEnabled = false;
      
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect live sync...');
        initLiveSync();
      }, 5000);
    };
    
  } catch (err) {
    console.error('Failed to initialize live sync:', err);
    liveSyncEnabled = false;
  }
}

function handleLiveSyncMessage(message) {
  const { type, code, filename, timestamp } = message;
  
  switch (type) {
    case 'connected':
      console.log('Live sync session established');
      break;
      
    case 'code-synced':
      console.log(`Code synced: ${filename} at ${timestamp}`);
      break;
      
    case 'save-confirmed':
      console.log(`Save confirmed: ${filename}`);
      updateEditorStatus('saved');
      setTimeout(() => updateEditorStatus('ready'), 2000);
      break;
      
    case 'code-loaded':
      if (code && editor) {
        editor.setValue(code);
        console.log(`Code loaded: ${filename}`);
      }
      break;
      
    case 'error':
      console.error('Live sync error:', message.error);
      break;
      
    case 'pong':
      // Keepalive response
      break;
  }
}

function syncCodeToServer(code) {
  if (!liveSyncEnabled || !liveSyncWs) return;
  
  // Debounce - wait 1 second after last change
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    const message = {
      type: 'code-update',
      data: {
        code,
        filename: `project_${currentProject}.html`,
        projectId: currentProject
      }
    };
    
    liveSyncWs.send(JSON.stringify(message));
    updateEditorStatus('syncing');
  }, 1000);
}

// Keepalive ping every 30 seconds
setInterval(() => {
  if (liveSyncWs && liveSyncWs.readyState === WebSocket.OPEN) {
    liveSyncWs.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);

// Update editor status
function updateEditorStatus(status) {
  const badge = document.getElementById("editorStatus");
  badge.className = "status-badge";
  
  switch (status) {
    case "syncing":
      badge.classList.add("saving");
      badge.textContent = "🔄 Syncing...";
      break;
    case "synced":
      badge.classList.add("saved");
      badge.textContent = "☁️ Synced";
      break;
    case "saving":
      badge.classList.add("saving");
      badge.textContent = "💾 Saving...";
      break;
    case "saved":
      badge.classList.add("saved");
      badge.textContent = "✓ Saved";
      break;
    case "error":
      badge.classList.add("error");
      badge.textContent = "❌ Error";
      break;
    default:
      badge.textContent = "Ready";
  }
}

// Update preview
function updatePreview() {
  if (!editor) return;
  
  const iframe = document.getElementById("preview");
  const code = editor.getValue();
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  
  doc.open();
  doc.write(code);
  doc.close();
}

// Auto-update preview
setInterval(updatePreview, 1000);

// Manual refresh
document.getElementById("refreshPreview").onclick = updatePreview;

// Fullscreen preview
document.getElementById("fullscreenPreview").onclick = () => {
  const iframe = document.getElementById("preview");
  if (iframe.requestFullscreen) {
    iframe.requestFullscreen();
  }
};

// Save code
document.getElementById("saveCode").onclick = () => {
  const code = editor.getValue();
  localStorage.setItem(`aesi_project_${currentProject}`, code);
  appendMessage("ai", `💾 Projekt "${projects[currentProject].name}" sparat!`, "SYSTEM");
  autoScroll();
};

// Deploy code
document.getElementById("deployCode").onclick = async () => {
  const code = editor.getValue();
  
  try {
    const token = localStorage.getItem("aesi_token");
    const res = await fetch("/api/deploy-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        code,
        filename: `${projects[currentProject].name}.html`
      })
    });
    
    if (res.ok) {
      appendMessage("ai", "🚀 Kod deployad!", "SYSTEM");
    } else {
      appendMessage("ai", "Deployment misslyckades", "SYSTEM");
    }
  } catch (err) {
    appendMessage("ai", `Deploy-fel: ${err.message}`, "SYSTEM");
  }
  
  autoScroll();
};

// ============================================
// PROJECT TABS
// ============================================

function switchProject(index) {
  // Save current
  if (editor) {
    projects[currentProject].code = editor.getValue();
  }
  
  // Switch
  currentProject = index;
  
  // Update UI
  document.querySelectorAll(".tab").forEach((tab, i) => {
    if (tab.dataset.project !== undefined) {
      tab.classList.toggle("active", i === index);
    }
  });
  
  // Load new project
  if (editor) {
    editor.setValue(projects[index].code);
    monaco.editor.setModelLanguage(editor.getModel(), projects[index].language);
  }
}

function newProject() {
  const name = prompt("Projektnamn:", `Projekt ${projects.length + 1}`);
  if (!name) return;
  
  projects.push({
    name,
    code: "// " + name + "\n",
    language: "javascript"
  });
  
  const index = projects.length - 1;
  const tab = document.createElement("button");
  tab.className = "tab";
  tab.dataset.project = index;
  tab.innerHTML = `📄 ${name} <span class="tab-close" onclick="closeTab(event, ${index})">×</span>`;
  tab.onclick = () => switchProject(index);
  
  const newBtn = document.querySelector(".tabs button:last-child");
  newBtn.parentNode.insertBefore(tab, newBtn);
  
  switchProject(index);
}

function closeTab(event, index) {
  event.stopPropagation();
  
  if (projects.length === 1) {
    alert("Kan inte stänga sista projektet!");
    return;
  }
  
  if (confirm(`Stäng "${projects[index].name}"?`)) {
    projects.splice(index, 1);
    
    // Rebuild tabs
    const tabsContainer = document.getElementById("projectTabs");
    tabsContainer.innerHTML = "";
    
    projects.forEach((proj, i) => {
      const tab = document.createElement("button");
      tab.className = "tab" + (i === 0 ? " active" : "");
      tab.dataset.project = i;
      tab.innerHTML = `📄 ${proj.name} <span class="tab-close" onclick="closeTab(event, ${i})">×</span>`;
      tab.onclick = () => switchProject(i);
      tabsContainer.appendChild(tab);
    });
    
    const newBtn = document.createElement("button");
    newBtn.className = "tab";
    newBtn.textContent = "➕ Ny";
    newBtn.onclick = newProject;
    tabsContainer.appendChild(newBtn);
    
    // Switch to first project
    currentProject = 0;
    switchProject(0);
  }
}

// Add click handlers to existing tabs
document.querySelectorAll(".tab[data-project]").forEach((tab, index) => {
  tab.onclick = () => switchProject(index);
});

// Initialize
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: function(code, lang) {
    return code;
  }
});

appendMessage("ai", "👋 Välkommen till The Living IDE! Jag kan hjälpa dig koda, förklara koncept och bygga projekt.", "SYSTEM");
