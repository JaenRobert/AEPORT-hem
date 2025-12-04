// Lägg detta i nexus.html innan du skapar WebSocket-anslutningen.
// Prioritet:
// 1) ?ws=... i URL
// 2) same-host + port 8765, med wss: om sidan servas via https

(function () {
  const params = new URLSearchParams(location.search);
  let WS_URL = params.get('ws');
  if (!WS_URL) {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = location.hostname || 'localhost';
    const port = 8765; // ändra om din publik server använder annan port
    WS_URL = `${proto}//${host}:${port}`;
  }
  // Exponera för debugging
  window.__aesi_ws_url = WS_URL;
})();