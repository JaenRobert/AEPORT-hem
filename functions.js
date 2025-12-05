function create_module(name, title) {
  const portal = document.getElementById("portal");
  const div = document.createElement("div");
  div.className = "p-3 border border-green-400 rounded mb-2";
  div.innerHTML = `<h2>${title}</h2><p>Modul-ID: ${name}</p>`;
  portal.appendChild(div);
}

function update_theme(color, name) {
  document.body.style.backgroundColor = color;
  const logBox = document.getElementById("chat");
  logBox.innerHTML += `<div>🎨 Färgtema uppdaterat till ${name}</div>`;
}