/**
 * Code Deployment Route
 * Handles saving and deploying code from AI Console
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

async function deployCode(req, res) {
  try {
    const { code, filename = 'deployed-code.js' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }
    
    // Generate unique ID
    const id = crypto.randomBytes(8).toString('hex');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const safeFilename = `${timestamp}-${id}-${filename}`;
    
    // Save to data/deployed directory
    const deployDir = path.join(__dirname, '../../data/deployed');
    await fs.mkdir(deployDir, { recursive: true });
    
    const filepath = path.join(deployDir, safeFilename);
    await fs.writeFile(filepath, code, 'utf-8');
    
    // Log to ledger
    await logToLedger({
      type: 'code_deployed',
      filename: safeFilename,
      size: code.length,
      userId: req.user?.userId || 'anonymous'
    });
    
    res.json({
      success: true,
      filename: safeFilename,
      path: filepath,
      size: code.length
    });
    
  } catch (err) {
    console.error('Deploy code error:', err);
    res.status(500).json({ error: 'Deployment failed' });
  }
}

async function logToLedger(entry) {
  const ledgerPath = path.join(__dirname, '../../data/ledger/arvskedjan_d.jsonl');
  entry.timestamp = new Date().toISOString();
  entry.hash = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex').substring(0, 16);
  await fs.appendFile(ledgerPath, JSON.stringify(entry) + '\n', 'utf-8');
}

module.exports = { deployCode };
