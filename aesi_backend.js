```javascript
// ...existing code...

const PORT = process.env.PORT || 3000;

// ...existing code...

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('⚡ ÆSI BACKEND SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Status: READY`);
  console.log('');
  console.log('📡 Available endpoints:');
  console.log(`   • POST /api/build            - Build frontend`);
  console.log(`   • POST /api/vision-update    - Vision-guided updates`);
  console.log(`   • POST /api/exec             - Execute commands`);
  console.log(`   • GET  /api/health           - Health check`);
  console.log('');
  console.log('📂 Serving static files from current directory');
  console.log(`📝 Ledger: arvskedjan_d.jsonl (append-only)`);
  console.log('');
  console.log('Press Ctrl+C to stop server');
  console.log('='.repeat(60) + '\n');
  
  // Auto-open browser if not disabled by environment variable
  if (process.env.NO_BROWSER !== '1') {
    const url = `http://localhost:${PORT}/index.html`;
    const start = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    
    // Small delay to ensure server is ready
    setTimeout(() => {
      require('child_process').exec(`${start} ${url}`, (err) => {
        if (!err) {
          console.log(`🌐 Browser opened: ${url}\n`);
        }
      });
    }, 1000);
  }
});

// ...existing code...
```