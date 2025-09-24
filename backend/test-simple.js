console.log('Starting simple test...');

const server = require('net').createServer();

server.listen(4001, () => {
  console.log('Simple TCP server listening on port 4001');
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
}); 