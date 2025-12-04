const { verifyToken } = require('../routes/auth');
const fs = require('fs').promises;
const path = require('path');

/**
 * AI-PATRULL: Access Control Middleware
 * 
 * Rules:
 * - GET requests: Public (allow all)
 * - POST/PUT/DELETE: Require valid JWT
 * - All access logged to ledger
 */

async function logAccess(req, allowed, reason = '') {
  try {
    const entry = {
      type: 'access_log',
      method: req.method,
      path: req.path,
      ip: req.ip,
      allowed,
      reason,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']
    };
    
    const ledgerPath = path.join(__dirname, '../../data/ledger/arvskedjan_d.jsonl');
    await fs.appendFile(ledgerPath, JSON.stringify(entry) + '\n', 'utf-8');
    
  } catch (err) {
    console.error('Failed to log access:', err);
  }
}

/**
 * Main AI-Patrull middleware
 */
async function aiPatrull(req, res, next) {
  const method = req.method.toUpperCase();
  
  // GET requests are always allowed (public read access)
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    await logAccess(req, true, 'public_read');
    return next();
  }
  
  // Write operations require authentication
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      await logAccess(req, false, 'no_auth_header');
      return res.status(401).json({
        error: 'Authentication required',
        message: '🛡️ AI-PATRULL: Skrivrättigheter kräver inloggning'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    
    if (!payload) {
      await logAccess(req, false, 'invalid_token');
      return res.status(403).json({
        error: 'Invalid or expired token',
        message: '🛡️ AI-PATRULL: Ogiltig eller utgången session'
      });
    }
    
    // Token valid - allow request
    req.user = payload;
    await logAccess(req, true, `authenticated_${payload.userId}`);
    return next();
  }
  
  // Unknown method - block
  await logAccess(req, false, 'unknown_method');
  res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Rate limiting middleware
 */
const requestCounts = new Map();

function rateLimit(maxRequests = 100, windowMs = 60000) {
  return async (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, []);
    }
    
    const requests = requestCounts.get(ip);
    
    // Remove old requests outside window
    const filtered = requests.filter(time => now - time < windowMs);
    
    if (filtered.length >= maxRequests) {
      await logAccess(req, false, 'rate_limit_exceeded');
      return res.status(429).json({
        error: 'Too many requests',
        message: '🛡️ AI-PATRULL: För många förfrågningar, försök igen senare'
      });
    }
    
    filtered.push(now);
    requestCounts.set(ip, filtered);
    
    next();
  };
}

// Clean up rate limit data every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of requestCounts.entries()) {
    const filtered = requests.filter(time => now - time < 60000);
    if (filtered.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, filtered);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  aiPatrull,
  rateLimit
};
