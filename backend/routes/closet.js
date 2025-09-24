const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getClosetItems,
  addClosetItem,
  updateClosetItem,
  deleteClosetItem,
  getClosetItem,
  buildFit,
  getClosetStats,
  searchClosetItems,
  removeFitCheck
} = require('../controllers/closetController');

// Get all closet items
router.get('/', auth, getClosetItems);

// Search closet items
router.get('/search', auth, searchClosetItems);

// Get closet statistics
router.get('/stats', auth, getClosetStats);

// Add item to closet
router.post('/', auth, addClosetItem);

// Build a fit
router.post('/build-fit', auth, buildFit);

// Get specific closet item
router.get('/:id', auth, getClosetItem);

// Update closet item
router.put('/:id', auth, updateClosetItem);

// Remove fit check from closet item
router.put('/:id/remove-fit-check', auth, removeFitCheck);

// Delete closet item
router.delete('/:id', auth, deleteClosetItem);

module.exports = router; 