const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getWardrobeItems,
  addWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem,
  getWardrobeItem,
  searchWardrobeItems,
  getWardrobeStats,
  getUploadUrl,
  ingestItem,
  autoTagItem,
  analyzeImage
} = require('../controllers/wardrobeController');

// Get all wardrobe items with filters
router.get('/', auth, getWardrobeItems);

// Search wardrobe items
router.get('/search', auth, searchWardrobeItems);

// Get wardrobe statistics
router.get('/stats', auth, getWardrobeStats);

// Get upload URL for direct upload
router.post('/upload-url', auth, getUploadUrl);

// Ingest uploaded item and trigger auto-tagging
router.post('/ingest', auth, ingestItem);

// Analyze image using AI
router.post('/analyze-image', auth, analyzeImage);

// Auto-tag an item (for background processing)
router.post('/auto-tag/:itemId', auth, autoTagItem);

// Get specific wardrobe item
router.get('/:id', auth, getWardrobeItem);

// Update wardrobe item
router.put('/:id', auth, updateWardrobeItem);

// Delete wardrobe item
router.delete('/:id', auth, deleteWardrobeItem);

module.exports = router; 