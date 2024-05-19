const { createServer } = require('http');
const next = require('next');
const path = require('path');

const port = process.env.PORT || 3000;
const nextApp = next({ dev: process.env.NODE_ENV !== 'production', dir: path.join(__dirname, '../') });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const server = createServer((req, res) => {
    nextHandler(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    process.send('ready');
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      process.exit(1);
    } else {
      console.error('Server error:', err);
      throw err;
    }
  });
});