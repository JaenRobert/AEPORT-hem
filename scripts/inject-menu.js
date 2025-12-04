/**
 * ÆSI Menu Injector v1.0
 * Date: 2024-12-28
 * Purpose: Automatically inject menu.js into all HTML files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

// Menu script tag to inject
const MENU_SCRIPT = '<script src="/js/menu.js"></script>';

// Files to skip
const SKIP_FILES = ['login.html']; // Login page handles navigation differently

// Check if file already has menu script
const hasMenuScript = (content) => {
  return content.includes(MENU_SCRIPT) || content.includes('src="/js/menu.js"');
};

// Inject menu script into HTML
const injectMenu = (filepath) => {
  try {
    let content = fs.readFileSync(filepath, 'utf-8');
    
    // Skip if already has menu
    if (hasMenuScript(content)) {
      console.log(`  ⏭️  Already has menu: ${path.basename(filepath)}`);
      return false;
    }
    
    // Find best injection point (before </head> or after <head>)
    if (content.includes('</head>')) {
      content = content.replace('</head>', `  ${MENU_SCRIPT}\n</head>`);
    } else if (content.includes('<head>')) {
      content = content.replace('<head>', `<head>\n  ${MENU_SCRIPT}`);
    } else {
      console.log(`  ⚠️  No <head> tag found in: ${path.basename(filepath)}`);
      return false;
    }
    
    // Write back
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`  ✅ Injected menu: ${path.basename(filepath)}`);
    return true;
    
  } catch (err) {
    console.error(`  ❌ Error processing ${filepath}:`, err.message);
    return false;
  }
};

// Process all HTML files in a directory
const processDirectory = (dir) => {
  let injectedCount = 0;
  let skippedCount = 0;
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filepath = path.join(dir, file);
      const stat = fs.statSync(filepath);
      
      // Skip directories
      if (stat.isDirectory()) {
        continue;
      }
      
      // Only process HTML files
      if (!file.endsWith('.html')) {
        continue;
      }
      
      // Skip certain files
      if (SKIP_FILES.includes(file)) {
        console.log(`  ⏭️  Skipping: ${file}`);
        skippedCount++;
        continue;
      }
      
      // Inject menu
      if (injectMenu(filepath)) {
        injectedCount++;
      } else {
        skippedCount++;
      }
    }
    
  } catch (err) {
    console.error(`Error processing directory ${dir}:`, err.message);
  }
  
  return { injectedCount, skippedCount };
};

// Main execution
console.log('='.repeat(60));
console.log('🎯 ÆSI MENU INJECTOR');
console.log('='.repeat(60));
console.log('');

// Process public directory
console.log('📂 Processing public/ directory...');
const publicStats = processDirectory(publicDir);

// Process root HTML files
console.log('');
console.log('📂 Processing root HTML files...');
const rootFiles = fs.readdirSync(projectRoot)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(projectRoot, f));

let rootInjected = 0;
let rootSkipped = 0;

for (const filepath of rootFiles) {
  const filename = path.basename(filepath);
  
  if (SKIP_FILES.includes(filename)) {
    console.log(`  ⏭️  Skipping: ${filename}`);
    rootSkipped++;
    continue;
  }
  
  if (injectMenu(filepath)) {
    rootInjected++;
  } else {
    rootSkipped++;
  }
}

// Summary
console.log('');
console.log('='.repeat(60));
console.log('✅ MENU INJECTION COMPLETE');
console.log('='.repeat(60));
console.log(`📊 Public directory: ${publicStats.injectedCount} injected, ${publicStats.skippedCount} skipped`);
console.log(`📊 Root directory: ${rootInjected} injected, ${rootSkipped} skipped`);
console.log(`📊 Total: ${publicStats.injectedCount + rootInjected} files updated`);
console.log('');
