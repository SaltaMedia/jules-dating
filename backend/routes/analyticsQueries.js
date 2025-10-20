const express = require('express');
const router = express.Router();
const analyticsQueries = require('../utils/analyticsQueries');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// Apply authentication and admin middleware to all analytics query routes
router.use(auth);
router.use(isAdmin);

// Get landing page statistics
router.get('/landing-page', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const stats = await analyticsQueries.getLandingPageStats(timeRange);
    res.json(stats);
  } catch (error) {
    console.error('Landing page stats error:', error);
    res.status(500).json({ error: 'Failed to get landing page statistics' });
  }
});

// Get user activity by feature
router.get('/user-activity', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const activity = await analyticsQueries.getUserActivityByFeature(timeRange);
    res.json(activity);
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ error: 'Failed to get user activity' });
  }
});

// Get user journey for specific user
router.get('/user-journey/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const journey = await analyticsQueries.getUserJourney(userId);
    
    if (!journey) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(journey);
  } catch (error) {
    console.error('User journey error:', error);
    res.status(500).json({ error: 'Failed to get user journey' });
  }
});

// Get conversion funnel data
router.get('/conversion-funnel', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const funnel = await analyticsQueries.getConversionFunnel(timeRange);
    res.json(funnel);
  } catch (error) {
    console.error('Conversion funnel error:', error);
    res.status(500).json({ error: 'Failed to get conversion funnel' });
  }
});

// Get daily activity trends
router.get('/daily-trends', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    const trends = await analyticsQueries.getDailyActivityTrends(timeRange);
    res.json(trends);
  } catch (error) {
    console.error('Daily trends error:', error);
    res.status(500).json({ error: 'Failed to get daily trends' });
  }
});

// Get comprehensive dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    
    const [
      landingPageStats,
      userActivity,
      conversionFunnel,
      dailyTrends
    ] = await Promise.all([
      analyticsQueries.getLandingPageStats(timeRange),
      analyticsQueries.getUserActivityByFeature(timeRange),
      analyticsQueries.getConversionFunnel(timeRange),
      analyticsQueries.getDailyActivityTrends('7d') // Last 7 days for trends
    ]);
    
    res.json({
      landingPage: landingPageStats,
      userActivity,
      conversionFunnel,
      dailyTrends,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

module.exports = router;
