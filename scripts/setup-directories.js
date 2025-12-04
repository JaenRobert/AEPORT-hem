import fs from 'fs';
const dirs = ['data','data/uploads','data/memory','data/book','data/ledger','server/routes','scripts','public/js'];
dirs.forEach(d => { if (!fs.existsSync(d)) { fs.mkdirSync(d, {recursive:true}); console.log('✅ Skapad: '+d);} else { console.log('✔️ Finns redan: '+d);} });
