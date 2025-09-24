const express = require('express');
const app = express();
const PORT = 4001;

app.get('/test', (req, res) => {
  res.json({ message: 'Basic test working' });
});

console.log('Starting basic server...');
app.listen(PORT, () => {
  console.log(`Basic server running on port ${PORT}`);
});
