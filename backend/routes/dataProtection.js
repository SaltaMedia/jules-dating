const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const DataProtectionMonitor = require('../middleware/dataProtection');

// All routes require authentication and admin access
router.use(auth);
router.use(isAdmin);

// Get deletion statistics
router.get('/stats', (req, res) => {
  try {
    const stats = DataProtectionMonitor.instance.getDeletionStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting deletion stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deletion statistics'
    });
  }
});

// Get recent alerts
router.get('/alerts', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Alert = mongoose.model('Alert', new mongoose.Schema({
      type: String,
      timestamp: Date,
      severity: String,
      details: Object,
      environment: String,
      server: String
    }));

    const alerts = await Alert.find()
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

// Test alert system
router.post('/test-alert', (req, res) => {
  try {
    DataProtectionMonitor.instance.sendAlert('TEST_ALERT', {
      message: 'This is a test alert',
      timestamp: new Date(),
      test: true
    });

    res.json({
      success: true,
      message: 'Test alert sent'
    });
  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test alert'
    });
  }
});

module.exports = router;
