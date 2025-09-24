console.log('Testing HTTP module...');

const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World');
});

console.log('About to start HTTP server...');

server.listen(4001, () => {
  console.log('HTTP server started successfully on port 4001');
  server.close(() => {
    console.log('HTTP server closed successfully');
    process.exit(0);
  });
});

server.on('error', (err) => {
  console.error('HTTP server error:', err);
  process.exit(1);
});
