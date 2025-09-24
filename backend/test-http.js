const http = require('http');

console.log('Testing native HTTP module...');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Native HTTP server working!' }));
});

server.listen(4001, '127.0.0.1', () => {
  console.log('Native HTTP server running on 127.0.0.1:4001');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
