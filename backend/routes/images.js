const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { anonymousSession, requireAnonymousSession } = require('../middleware/anonymousSession');
const { rateLimiter, FREE_LIMITS } = require('../middleware/rateLimiter');
const { uploadImage, uploadAnonymousImage, deleteImage, getImageInfo, upload } = require('../controllers/imagesController');

// Upload image - requires authentication and full validation
router.post('/upload', auth, upload.single('image'), uploadImage);

// Upload image for anonymous users (for fit checks)
router.post('/anonymous', 
  anonymousSession,
  requireAnonymousSession,
  rateLimiter({ fitChecks: FREE_LIMITS.fitChecks }),
  upload.single('image'), 
  uploadAnonymousImage
);

// Delete image - requires authentication
router.delete('/:publicId', auth, deleteImage);

// Get image info - requires authentication
router.get('/:publicId', auth, getImageInfo);

module.exports = router; 