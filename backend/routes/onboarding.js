const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  getOnboardingStatus,
  updateOnboarding,
  completeOnboarding,
  getOnboardingQuestions
} = require('../controllers/onboardingController');

// Get onboarding status
router.get('/status', auth, getOnboardingStatus);

// Get onboarding questions
router.get('/questions', auth, getOnboardingQuestions);

// Test endpoint for onboarding questions (no auth required)
router.get('/questions/test', async (req, res) => {
  try {
    const questions = await getOnboardingQuestions(req, res);
    res.json({ questions });
  } catch (error) {
    console.error('Error loading test onboarding questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update onboarding data
router.put('/update', auth, updateOnboarding);

// Complete onboarding
router.post('/complete', auth, completeOnboarding);

module.exports = router; 