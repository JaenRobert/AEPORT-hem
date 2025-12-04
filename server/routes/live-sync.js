/**
 * Live Code Sync System
 * Real-time code synchronization via WebSocket
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

// Store active connections
const clients = new Set();
let wss = null;

/**
 * Initialize WebSocket Server
 */
function initWebSocketServer(server) {
  wss = new WebSocket.Server({ server, path: '/ws/live-sync' });
  
  wss.on('connection', (ws) => {
    console.log('🔗 Live sync client connected');
    clients.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Live sync enabled',
      timestamp: new Date().toISOString()
    }));
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(ws, message);
      } catch (err) {
        console.error('Live sync message error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          error: err.message
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 Live sync client disconnected');
      clients.delete(ws);
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      clients.delete(ws);
    });
  });
  
  console.log('🌐 Live sync WebSocket server started');
}

/**
 * Handle incoming messages
 */
async function handleMessage(ws, message) {
  const { type, data } = message;
  
  switch (type) {
    case 'code-update':
      await handleCodeUpdate(ws, data);
      break;
      
    case 'code-request':
      await handleCodeRequest(ws, data);
      break;
      
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Unknown message type'
      }));
  }
}

/**
 * Handle code update (save to file)
 */
async function handleCodeUpdate(ws, data) {
  try {
    const { code, filename = 'live_code.js', projectId } = data;
    
    // Create live directory if not exists
    const liveDir = path.join(__dirname, '../../data/live');
    await fs.mkdir(liveDir, { recursive: true });
    
    // Save code
    const filepath = path.join(liveDir, filename);
    await fs.writeFile(filepath, code, 'utf-8');
    
    // Broadcast to all clients except sender
    const response = {
      type: 'code-synced',
      filename,
      projectId,
      timestamp: new Date().toISOString(),
      size: code.length
    };
    
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(response));
      }
    });
    
    // Confirm to sender
    ws.send(JSON.stringify({
      type: 'save-confirmed',
      ...response
    }));
    
    console.log(`💾 Live sync: ${filename} saved (${code.length} bytes)`);
    
  } catch (err) {
    console.error('Code update error:', err);
    ws.send(JSON.stringify({
      type: 'error',
      error: err.message
    }));
  }
}

/**
 * Handle code request (load from file)
 */
async function handleCodeRequest(ws, data) {
  try {
    const { filename = 'live_code.js' } = data;
    const filepath = path.join(__dirname, '../../data/live', filename);
    
    const code = await fs.readFile(filepath, 'utf-8');
    
    ws.send(JSON.stringify({
      type: 'code-loaded',
      code,
      filename,
      timestamp: new Date().toISOString()
    }));
    
  } catch (err) {
    // File doesn't exist yet - that's ok
    ws.send(JSON.stringify({
      type: 'code-loaded',
      code: '',
      filename: data.filename,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Broadcast message to all clients
 */
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

module.exports = {
  initWebSocketServer,
  broadcast
};
