const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { anonymousSession, requireAnonymousSession } = require('../middleware/anonymousSession');
const { rateLimiter, incrementUsage, FREE_LIMITS } = require('../middleware/rateLimiter');
const {
  submitProfilePicReview,
  submitAnonymousProfilePicReview,
  getProfilePicReviewHistory,
  getProfilePicReview,
  deleteProfilePicReview,
  updateProfilePicReviewNotes,
  saveProfilePicReview
} = require('../controllers/profilePicReviewController');

// Submit a profile pic review (authenticated users)
router.post('/submit', auth, submitProfilePicReview);

// Submit a profile pic review (anonymous users - 1 per session)
router.post('/anonymous', 
  anonymousSession,
  requireAnonymousSession,
  rateLimiter({ profilePicReviews: FREE_LIMITS.profilePicReviews }),
  incrementUsage('profilePicReviews'),
  submitAnonymousProfilePicReview
);

// Get profile pic review history
router.get('/history', auth, getProfilePicReviewHistory);

// Get specific profile pic review (must come after specific routes like /anonymous)
router.get('/:id', auth, getProfilePicReview);

// Update profile pic review notes
router.put('/:id/notes', auth, updateProfilePicReviewNotes);

// Save profile pic review
router.put('/:id/save', auth, saveProfilePicReview);

// Delete profile pic review
router.delete('/:id', auth, deleteProfilePicReview);

module.exports = router;
