const express = require('express');
const app = express();
const PORT = 4001;
const HOST = '127.0.0.1';

console.log('Starting server with explicit host...');

app.get('/test', (req, res) => {
  res.json({ message: 'Host test working' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
