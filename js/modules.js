// Simple module loader for ÆSI modules
const modulesContainer = document.getElementById('modules');
const MODULE_LIST = ['claude','reflex','hafted','smile','ernie','chatgpt'];

async function loadModule(name){
  try{
    const res = await fetch(`/modules/${name}.html`);
    if(!res.ok) throw new Error('Not found');
    const html = await res.text();
    const div = document.createElement('div');
    div.innerHTML = html;
    modulesContainer.appendChild(div.firstElementChild);
  }catch(err){
    console.warn('Could not load module', name, err);
  }
}

function initModules(){
  if(!modulesContainer) return;
  MODULE_LIST.forEach(loadModule);
}

document.addEventListener('DOMContentLoaded', initModules);
