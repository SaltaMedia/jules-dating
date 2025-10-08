const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// Public analytics tracking endpoint (no auth required)
router.post('/track', (req, res) => {
  console.log('🔍 DEBUG: Public /track route called');
  return analyticsController.trackEvent(req, res);
});

// Apply authentication and admin middleware to all other analytics routes
router.use(auth);
router.use(isAdmin);

// Dashboard overview metrics
router.get('/dashboard', analyticsController.getDashboardMetrics);

// Time series data for charts
router.get('/time-series', analyticsController.getTimeSeriesData);

// User analytics
router.get('/users', analyticsController.getUserAnalytics);

// Chat analytics
router.get('/chat', analyticsController.getChatAnalytics);

// Feature usage analytics
router.get('/features', analyticsController.getFeatureUsageAnalytics);

// Error analytics
router.get('/errors', analyticsController.getErrorAnalytics);

// Page performance analytics
router.get('/performance', analyticsController.getPagePerformanceAnalytics);

// Real-time analytics
router.get('/realtime', analyticsController.getRealTimeAnalytics);

// Export analytics data
router.get('/export', analyticsController.exportAnalyticsData);

// Track analytics events from frontend (authenticated)
router.post('/track', (req, res) => {
  console.log('🔍 DEBUG: Authenticated /track route called');
  return analyticsController.trackEvent(req, res);
});

// Enhanced analytics endpoints
router.get('/onboarding-funnel', analyticsController.getOnboardingFunnel);
router.get('/conversion-rates', analyticsController.getConversionRates);
router.get('/drop-off-analysis', analyticsController.getDropOffAnalysis);
router.get('/chat-topics', analyticsController.getChatTopicAnalytics);
router.get('/feature-adoption', analyticsController.getFeatureAdoptionAnalytics);
router.get('/user-journey', analyticsController.getUserJourney);

// New specific analytics endpoints
router.get('/conversion-funnel', analyticsController.getConversionFunnel);
router.get('/user-list', analyticsController.getUserList);
router.get('/chat-logs', analyticsController.getChatLogs);
router.get('/active-users', analyticsController.getActiveUsers);

module.exports = router; 