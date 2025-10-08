/**
 * Simple endpoint to generate weekly insights
 * Call this from your browser or curl to get weekly insights
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const insightsController = require('./controllers/insightsController');
const auth = require('./middleware/auth');
const { isAdmin } = require('./middleware/admin');

const app = express();
app.use(cors());
app.use(express.json());

// Simple auth check for Steve
const checkSteveAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  // Simple token check - you can replace this with your actual auth
  if (token === 'steve-jules-insights-2025') {
    req.user = { id: 'steve', isAdmin: true };
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Use token: steve-jules-insights-2025' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Weekly Insights API is running' });
});

// Generate weekly insights endpoint
app.get('/generate-weekly-insights', checkSteveAuth, async (req, res) => {
  try {
    console.log('📊 Generating weekly insights for Steve...');
    
    const result = await insightsController.generateWeeklyInsights(req, res);
    
    // If we get here, the response was already sent by the controller
    // But we can also log it for debugging
    console.log('✅ Weekly insights generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate weekly insights',
      message: error.message
    });
  }
});

// Get community insights
app.get('/community-insights', checkSteveAuth, async (req, res) => {
  try {
    await insightsController.getCommunityInsights(req, res);
  } catch (error) {
    console.error('❌ Error getting community insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get community insights'
    });
  }
});

// Start server
const PORT = process.env.INSIGHTS_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Weekly Insights API running on port ${PORT}`);
  console.log(`📊 Generate insights: GET http://localhost:${PORT}/generate-weekly-insights`);
  console.log(`🔑 Auth token: steve-jules-insights-2025`);
  console.log(`💡 Usage: curl -H "Authorization: Bearer steve-jules-insights-2025" http://localhost:${PORT}/generate-weekly-insights`);
});
