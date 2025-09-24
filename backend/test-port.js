const express = require('express');
const app = express();
const PORT = 3000;

console.log('Starting server on port 3000...');

app.get('/test', (req, res) => {
  res.json({ message: 'Port test working' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});
