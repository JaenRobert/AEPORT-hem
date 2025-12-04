const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// JWT secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_VIA_ENV';
const JWT_EXPIRY = '1h';

// In-memory session store (replace with Redis in production)
const sessions = new Map();

/**
 * Generate secure JWT token
 */
function generateToken(userId, metadata = {}) {
  const payload = {
    userId,
    iat: Date.now(),
    ...metadata
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Hash private key for storage
 */
function hashPrivateKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Generate challenge for WebAuthn
 */
function generateChallenge() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * POST /api/auth/login
 * Login with private key
 */
async function login(req, res) {
  try {
    const { privateKey, username } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key required' });
    }
    
    // Hash the key for comparison (never store plaintext)
    const hashedKey = hashPrivateKey(privateKey);
    
    // In production, check against database
    // For now, check against environment variable
    const masterKeyHash = process.env.MASTER_KEY_HASH;
    
    if (!masterKeyHash) {
      return res.status(500).json({ error: 'Server not configured' });
    }
    
    if (hashedKey !== masterKeyHash) {
      // Log failed attempt to ledger
      await logToLedger({
        type: 'auth_failed',
        ip: req.ip,
        username: username || 'anonymous',
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const userId = username || 'master';
    const token = generateToken(userId, { username });
    
    // Store session
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions.set(sessionId, {
      userId,
      username,
      createdAt: Date.now(),
      ip: req.ip
    });
    
    // Log successful login
    await logToLedger({
      type: 'auth_success',
      userId,
      username,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      token,
      sessionId,
      expiresIn: JWT_EXPIRY,
      user: { userId, username }
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * POST /api/auth/webauthn/register
 * Register WebAuthn credential
 */
async function webauthnRegister(req, res) {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    const challenge = generateChallenge();
    const userId = crypto.randomBytes(16).toString('hex');
    
    // Store challenge temporarily
    sessions.set(`challenge_${userId}`, {
      challenge,
      username,
      createdAt: Date.now()
    });
    
    // WebAuthn registration options
    const options = {
      challenge: challenge,
      rp: {
        name: "ÆSI NEXUS",
        id: process.env.WEBAUTHN_RP_ID || "localhost"
      },
      user: {
        id: userId,
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },  // ES256
        { type: "public-key", alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "direct"
    };
    
    res.json({ success: true, options });
    
  } catch (err) {
    console.error('WebAuthn register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * POST /api/auth/webauthn/verify
 * Verify WebAuthn credential
 */
async function webauthnVerify(req, res) {
  try {
    const { userId, credential } = req.body;
    
    if (!userId || !credential) {
      return res.status(400).json({ error: 'Missing data' });
    }
    
    const challengeData = sessions.get(`challenge_${userId}`);
    
    if (!challengeData) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }
    
    // In production, verify credential with WebAuthn library
    // For now, accept if challenge exists
    
    // Generate JWT token
    const token = generateToken(userId, { 
      username: challengeData.username,
      method: 'webauthn'
    });
    
    // Clean up challenge
    sessions.delete(`challenge_${userId}`);
    
    // Log successful authentication
    await logToLedger({
      type: 'auth_webauthn_success',
      userId,
      username: challengeData.username,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      token,
      expiresIn: JWT_EXPIRY,
      user: { userId, username: challengeData.username }
    });
    
  } catch (err) {
    console.error('WebAuthn verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
}

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
async function logout(req, res) {
  try {
    const { sessionId } = req.body;
    
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      sessions.delete(sessionId);
      
      await logToLedger({
        type: 'auth_logout',
        userId: session.userId,
        username: session.username,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ success: true });
    
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
}

/**
 * GET /api/auth/verify
 * Verify if token is still valid
 */
function verifyTokenEndpoint(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ valid: false });
  }
  
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ valid: false });
  }
  
  res.json({
    valid: true,
    user: {
      userId: payload.userId,
      username: payload.username
    }
  });
}

/**
 * Helper: Log to arvskedjan
 */
async function logToLedger(entry) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const crypto = require('crypto');
    
    const ledgerPath = path.join(__dirname, '../../data/ledger/arvskedjan_d.jsonl');
    
    // Add hash
    const entryStr = JSON.stringify(entry);
    entry.hash = crypto.createHash('sha256').update(entryStr).digest('hex').substring(0, 16);
    
    // Append to ledger
    await fs.appendFile(ledgerPath, JSON.stringify(entry) + '\n', 'utf-8');
    
  } catch (err) {
    console.error('Failed to log to ledger:', err);
  }
}

// Clean up expired sessions every hour
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  
  for (const [key, value] of sessions.entries()) {
    if (now - value.createdAt > maxAge) {
      sessions.delete(key);
    }
  }
}, 60 * 60 * 1000);

module.exports = {
  login,
  logout,
  verifyTokenEndpoint,
  webauthnRegister,
  webauthnVerify,
  verifyToken,
  generateToken
};
