require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 4001;

// Basic middleware
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Jules Style Backend API - Minimal Test',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Minimal test server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 