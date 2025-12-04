/**
 * ÆSI Data Migration Script v1.0
 * Date: 2024-12-28
 * Purpose: Migrate local data files to structured data/ directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localRoot = path.join(__dirname, '..');
const dataRoot = path.join(localRoot, 'data');

// Ensure data directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
};

// Migrate files from source to target
const migrate = (source, target, description) => {
  console.log(`\n📦 Migrating ${description}...`);
  
  if (!fs.existsSync(source)) {
    console.log(`⚠️  Source not found: ${source}`);
    return 0;
  }
  
  ensureDir(target);
  
  let count = 0;
  
  if (fs.statSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    for (const file of files) {
      const srcPath = path.join(source, file);
      const destPath = path.join(target, file);
      
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ ${file}`);
        count++;
      }
    }
  } else {
    // Single file
    const filename = path.basename(source);
    const destPath = path.join(target, filename);
    fs.copyFileSync(source, destPath);
    console.log(`  ✓ ${filename}`);
    count++;
  }
  
  console.log(`✅ Migrated ${count} file(s)`);
  return count;
};

// Validate JSON files
const validateJSON = (filepath) => {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      JSON.parse(line); // Validate each line
    }
    
    return true;
  } catch (err) {
    console.error(`❌ Validation failed for ${filepath}:`, err.message);
    return false;
  }
};

// Main migration
console.log('='.repeat(60));
console.log('🚀 ÆSI DATA MIGRATION SCRIPT');
console.log('='.repeat(60));

// Ensure base data directories
ensureDir(dataRoot);
ensureDir(path.join(dataRoot, 'memory'));
ensureDir(path.join(dataRoot, 'book'));
ensureDir(path.join(dataRoot, 'uploads'));
ensureDir(path.join(dataRoot, 'ledger'));

let totalMigrated = 0;

// Migrate memory files
totalMigrated += migrate(
  path.join(localRoot, 'memory'),
  path.join(dataRoot, 'memory'),
  'Memory conversations'
);

// Migrate book files
totalMigrated += migrate(
  path.join(localRoot, 'book'),
  path.join(dataRoot, 'book'),
  'Book chapters'
);

// Migrate ledger
const ledgerSource = path.join(localRoot, 'arvskedjan_d.jsonl');
if (fs.existsSync(ledgerSource)) {
  console.log('\n📋 Migrating ledger...');
  const ledgerDest = path.join(dataRoot, 'ledger', 'arvskedjan_d.jsonl');
  fs.copyFileSync(ledgerSource, ledgerDest);
  
  // Validate ledger
  if (validateJSON(ledgerDest)) {
    console.log('  ✓ arvskedjan_d.jsonl (validated)');
    totalMigrated++;
  }
}

// Create migration log
const logPath = path.join(dataRoot, 'migration_log.txt');
const logContent = `
ÆSI Data Migration Log
Date: ${new Date().toISOString()}
Total files migrated: ${totalMigrated}
Directories created:
  - data/memory/
  - data/book/
  - data/uploads/
  - data/ledger/

Status: SUCCESS
`;

fs.writeFileSync(logPath, logContent);

console.log('\n' + '='.repeat(60));
console.log(`✅ MIGRATION COMPLETE - ${totalMigrated} files migrated`);
console.log(`📝 Log saved to: ${logPath}`);
console.log('='.repeat(60));
console.log('');
