const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const AnalyticsControllerV2 = require('../controllers/analyticsControllerV2');

// All routes require authentication and admin access
router.use(auth);
router.use(isAdmin);

// Dashboard metrics endpoint
router.get('/dashboard-v2', AnalyticsControllerV2.getDashboardMetrics);

// Export endpoints
router.get('/export/dashboard', AnalyticsControllerV2.exportDashboard);
router.get('/export/users', AnalyticsControllerV2.exportUsers);
router.get('/export/chat', AnalyticsControllerV2.exportChat);
router.get('/export/profile-pic', AnalyticsControllerV2.exportProfilePic);
router.get('/export/fit-check', AnalyticsControllerV2.exportFitCheck);

module.exports = router;
