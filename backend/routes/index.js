const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const chatRoutes = require('./chat');
const authRoutes = require('./auth');
const productsRoutes = require('./products');
const imagesRoutes = require('./images');
const onboardingRoutes = require('./onboarding');
const fitCheckRoutes = require('./fitCheck');
const outfitsRoutes = require('./outfits');
const profilePicReviewRoutes = require('./profilePicReview');
const analyticsRoutes = require('./analytics');
const analyticsV2Routes = require('./analytics-v2');
const chatSessionsRoutes = require('./chatSessions');
const anonymousRoutes = require('./anonymous');
const monitoringRoutes = require('./monitoring');
const feedbackRoutes = require('./feedback');
const dataProtectionRoutes = require('./dataProtection');
const insightsRoutes = require('./insights');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    app: 'jules-dating'
  });
});

// Debug endpoint to check database connection
router.get('/debug-db', async (req, res) => {
  try {
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'Not connected';
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    
    res.json({
      databaseName: dbName,
      steveExists: !!steve,
      steveAdmin: steve ? steve.isAdmin : null,
      stevePasswordHash: steve ? steve.password : null,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// MongoDB connection test endpoint
router.get('/mongodb-test', (req, res) => {
  const mongoose = require('mongoose');
  const connectionState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    mongodb: {
      status: states[connectionState] || 'unknown',
      readyState: connectionState,
      connected: connectionState === 1,
      database: mongoose.connection.name,
      host: mongoose.connection.host
    },
    timestamp: new Date().toISOString()
  });
});

// Core routes for Jules Dating App
// Auth routes
router.use('/auth', authRoutes);

// Chat routes
router.use('/chat', chatRoutes);

// Chat sessions routes
router.use('/chat-sessions', chatSessionsRoutes);

// Products routes (for shopping recommendations)
router.use('/products', productsRoutes);

// Images routes (for profile pic uploads)
router.use('/images', imagesRoutes);

// Onboarding routes
router.use('/onboarding', onboardingRoutes);

// Fit check routes (for outfit advice)
router.use('/fit-check', fitCheckRoutes);

// Outfits routes (for outfit management)
router.use('/outfits', outfitsRoutes);

// Profile pic review routes (for dating profile optimization)
router.use('/profile-pic-review', profilePicReviewRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Analytics V2 routes (new dashboard)
router.use('/analytics-v2', analyticsV2Routes);

// Anonymous routes (for free user flow)
router.use('/anonymous', anonymousRoutes);

// Monitoring routes (for production monitoring)
router.use('/monitoring', monitoringRoutes);

// Feedback routes
router.use('/feedback', feedbackRoutes);

// Data protection routes
router.use('/data-protection', dataProtectionRoutes);

// Insights routes (for weekly reports and user insights)
router.use('/insights', insightsRoutes);

// Development test endpoint - must be last
if (process.env.NODE_ENV !== 'production') {
  router.get('/test-dating', (req, res) => {
    console.log('Test dating endpoint hit!');
    res.json({
      message: 'Jules Dating API is working!',
      features: ['chat', 'fit-check', 'profile-pic-review'],
      timestamp: new Date().toISOString()
    });
  });
}

module.exports = router;