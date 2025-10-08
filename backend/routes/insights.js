const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// All insights routes require authentication
router.use(auth);

// Generate weekly insights (admin only)
router.get('/weekly', isAdmin, insightsController.generateWeeklyInsights);

// Get insights for a specific user (admin only)
router.get('/user/:userId', isAdmin, insightsController.getUserInsights);

// Get community insights (admin only)
router.get('/community', isAdmin, insightsController.getCommunityInsights);

module.exports = router;
