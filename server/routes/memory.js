import express from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const router = express.Router();
const MEMORY_DIR = path.join(process.cwd(), "data", "memory");

// Ensure memory directory exists
fs.mkdir(MEMORY_DIR, { recursive: true }).catch(console.error);

async function listConversations(req, res) {
  try {
    const files = await fs.readdir(MEMORY_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const conversations = await Promise.all(
      jsonFiles.map(async (f) => {
        const content = await fs.readFile(path.join(MEMORY_DIR, f), 'utf8');
        const data = JSON.parse(content);
        return {
          id: path.basename(f, '.json'),
          ...data,
          preview: data.entries?.[0]?.text?.substring(0, 100) + '...'
        };
      })
    );
    
    // Sort by date, newest first
    conversations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ conversations });
    
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
}

async function getConversation(req, res) {
  try {
    const { id } = req.params;
    const filepath = path.join(MEMORY_DIR, `${id}.json`);
    const content = await fs.readFile(filepath, 'utf8');
    const conversation = JSON.parse(content);
    
    res.json({ conversation });
    
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(404).json({ error: 'Conversation not found' });
  }
}

async function saveConversation(req, res) {
  try {
    const { text, node, response, metadata = {} } = req.body;
    
    if (!text || !node) {
      return res.status(400).json({ error: 'Text and node required' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const filepath = path.join(MEMORY_DIR, `${today}.json`);
    
    // Load existing or create new
    let conversation;
    try {
      const existing = await fs.readFile(filepath, 'utf8');
      conversation = JSON.parse(existing);
    } catch {
      conversation = {
        date: today,
        entries: []
      };
    }
    
    // Add new entry
    conversation.entries.push({
      timestamp: new Date().toISOString(),
      node,
      text,
      response,
      metadata,
      userId: req.user?.userId
    });
    
    // Save
    await fs.writeFile(filepath, JSON.stringify(conversation, null, 2));
    
    // Log to ledger
    await logToLedger({
      type: 'memory_saved',
      date: today,
      node,
      userId: req.user?.userId
    });
    
    res.json({ success: true, id: today });
    
  } catch (err) {
    console.error('Save conversation error:', err);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
}

async function deleteConversation(req, res) {
  try {
    const { id } = req.params;
    const filepath = path.join(MEMORY_DIR, `${id}.json`);
    
    await fs.unlink(filepath);
    
    await logToLedger({
      type: 'memory_deleted',
      conversationId: id,
      userId: req.user?.userId
    });
    
    res.json({ success: true });
    
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
}

async function logToLedger(entry) {
  const ledgerPath = path.join(process.cwd(), 'data', 'ledger', 'arvskedjan_d.jsonl');
  entry.timestamp = new Date().toISOString();
  entry.hash = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex').substring(0, 16);
  await fs.appendFile(ledgerPath, JSON.stringify(entry) + '\n', 'utf-8');
}

router.get("/api/memory", listConversations);
router.get("/api/memory/:id", getConversation);
router.post("/api/memory", saveConversation);
router.delete("/api/memory/:id", deleteConversation);

export default router;
