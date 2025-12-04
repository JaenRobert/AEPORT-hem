const pages = [
  { name:'🏠 Start', link:'index.html' },
  { name:'📊 Dashboard', link:'dashboard.html' },{ name:'🛰️ LiveLink', link:'livelink.html' },{ name:'🗣️ VoiceChain', link:'voicechain.html' },
  { name:'💬 Nexus', link:'nexus.html' },
  { name:'👁️ Vision', link:'vision-builder.html' },
  { name:'📤 Upload', link:'uploads.html' },
  { name:'💾 Memory', link:'memory.html' },
  { name:'📖 Book', link:'book.html' },
  { name:'🔐 Login', link:'login.html' }
];
function buildNav(){
 const token=localStorage.getItem('aesi_token');
 let nav=document.createElement('nav');
 nav.className='flex flex-wrap gap-3 justify-center p-3 bg-gray-900 border-b border-green-800';
 pages.forEach(p=>{
  if(p.name==='🔐 Login'&&token)return;
  const a=document.createElement('a');
  a.href=p.link;a.textContent=p.name;a.className='text-green-400 hover:text-green-200';
  nav.appendChild(a);
 });
 if(token){
  const logout=document.createElement('button');
  logout.textContent='🚪 Logout';
  logout.onclick=()=>{localStorage.removeItem('aesi_token');location.reload();};
  logout.className='text-red-400 hover:text-red-200';
  nav.appendChild(logout);
 }
 document.body.prepend(nav);
}
document.addEventListener('DOMContentLoaded',buildNav);


