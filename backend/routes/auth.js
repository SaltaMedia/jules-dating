const express = require('express');
const router = express.Router();
const passport = require('passport');
const auth = require('../middleware/auth');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const ChatLog = require('../models/ChatLog');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { 
  validateLogin, 
  validateRegister, 
  validateUserProfile 
} = require('../middleware/validation');
const { 
  register, 
  login, 
  forgotPassword,
  resetPassword,
  googleCallback, 
  getCurrentUser, 
  updateProfile, 
  logout 
} = require('../controllers/authController');

// Local authentication routes
// Temporarily disable validation to test password issue
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/logout', logout);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account' // Force account selection
}));

router.get('/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', { 
      failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:3002') + '/login?error=oauth_failed' 
    }, (err, user, info) => {
      if (err) {
        console.error('OAuth authentication error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
        return res.redirect(`${frontendUrl}/login?error=oauth_error`);
      }
      if (!user) {
        console.log('OAuth authentication failed:', info);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
        return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

// User profile routes (protected)
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, validateUserProfile, updateProfile);

// GDPR Data Subject Rights (protected)
router.get('/gdpr/data', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get user's data for export
    const userProfile = await UserProfile.findOne({ userId: req.user.id.toString() });
    const chatLogs = await ChatLog.find({ userId: req.user.id }).limit(50).sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: {
        user: user,
        profile: userProfile,
        recentChats: chatLogs,
        exportDate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Delete user data (Right to Erasure)
router.delete('/gdpr/delete', auth, async (req, res) => {
  try {
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE_MY_DATA') {
      return res.status(400).json({ error: 'Confirmation required' });
    }

    const userId = req.user.id;
    
    // Anonymize user data
    await User.findByIdAndUpdate(userId, {
      email: `deleted_${Date.now()}@anonymized.com`,
      name: 'Deleted User',
      password: null,
      googleId: null,
      deletedAt: new Date()
    });

    // Delete related data
    await UserProfile.deleteOne({ userId: userId.toString() });
    await ChatLog.deleteMany({ userId });
    await AnalyticsEvent.deleteMany({ userId: userId.toString() });

    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// Update consent preferences
router.put('/gdpr/consent', auth, async (req, res) => {
  try {
    const { consentPreferences } = req.body;
    
    await User.findByIdAndUpdate(req.user.id, {
      consentPreferences: {
        ...consentPreferences,
        lastUpdated: new Date()
      }
    });

    res.json({ success: true, message: 'Consent updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

// Test endpoints - only available in development, require auth in production
if (process.env.NODE_ENV !== 'production') {
  // Development-only test endpoint for user data (no auth required)
  router.get('/test-user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const User = require('../models/User');
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ user });
    } catch (error) {
      console.error('Error fetching test user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Development-only test endpoint for settings page (no auth required)
  router.get('/test-settings/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const User = require('../models/User');
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching test settings:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
} else {
  // Production fallback - require authentication for any test-like endpoints
  router.get('/test-user/:userId', auth, (req, res) => {
    res.status(403).json({ error: 'Test endpoints are not available in production' });
  });
  
  router.get('/test-settings/:userId', auth, (req, res) => {
    res.status(403).json({ error: 'Test endpoints are not available in production' });
  });
}

module.exports = router; 