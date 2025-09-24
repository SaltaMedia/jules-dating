const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getPersonalizedPicks,
  likeProduct,
  dislikeProduct,
  getMoreProducts,
  resetUserPreferences
} = require('../controllers/personalizedPicksController');

// Get personalized picks for the authenticated user
router.get('/', auth, getPersonalizedPicks);

// Like a product
router.post('/:productId/like', auth, likeProduct);

// Dislike a product
router.post('/:productId/dislike', auth, dislikeProduct);

// Get more products for a category
router.get('/more/:category', auth, getMoreProducts);

// Reset user preferences for testing
router.post('/reset-preferences', auth, resetUserPreferences);

module.exports = router; 