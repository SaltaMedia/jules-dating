const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { anonymousSession, requireAnonymousSession } = require('../middleware/anonymousSession');
const { rateLimiter, incrementUsage, FREE_LIMITS } = require('../middleware/rateLimiter');
const {
  submitFitCheck,
  submitAnonymousFitCheck,
  getFitCheckHistory,
  getFitCheck,
  updateFitCheckResponse,
  deleteFitCheck,
  updateFitCheckNotes,
  saveFitCheck
} = require('../controllers/fitCheckController');

// Submit a fit check (authenticated users)
router.post('/submit', auth, submitFitCheck);

// Submit a fit check (anonymous users - 1 per session)
router.post('/anonymous', 
  anonymousSession,
  requireAnonymousSession,
  rateLimiter({ fitChecks: FREE_LIMITS.fitChecks }),
  incrementUsage('fitChecks'),
  submitAnonymousFitCheck
);

// Get fit check history
router.get('/history', auth, getFitCheckHistory);

// Get specific fit check (must come after specific routes like /anonymous)
router.get('/:id', auth, getFitCheck);

// Update user response to fit check
router.put('/:id/response', auth, updateFitCheckResponse);

// Update fit check notes
router.put('/:id/notes', auth, updateFitCheckNotes);

// Save fit check
router.put('/:id/save', auth, saveFitCheck);

// Delete fit check
router.delete('/:id', auth, deleteFitCheck);

module.exports = router; 