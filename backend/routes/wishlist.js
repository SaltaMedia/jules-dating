const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getWishlistItems,
  addWishlistItem,
  updateWishlistItem,
  moveToCloset,
  removeWishlistItem,
  getWishlistStats
} = require('../controllers/wishlistController');

// Get all wishlist items
router.get('/', auth, getWishlistItems);



// Get wishlist statistics
router.get('/stats', auth, getWishlistStats);

// Add item to wishlist
router.post('/', auth, addWishlistItem);

// Update wishlist item
router.put('/:id', auth, updateWishlistItem);

// Move item from wishlist to closet
router.post('/:id/move-to-closet', auth, moveToCloset);

// Remove item from wishlist
router.delete('/:id', auth, removeWishlistItem);

module.exports = router; 