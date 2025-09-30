const express = require('express');
const multer = require('multer');
const router = express.Router();
const { chat, chatWithImage } = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { validateChatMessage } = require('../middleware/validation');
const chatSessionsRoutes = require('./chatSessions');
const { anonymousSession, requireAnonymousSession } = require('../middleware/anonymousSession');
const { rateLimiter, incrementUsage, FREE_LIMITS } = require('../middleware/rateLimiter');

// Configure Cloudinary
const cloudinary = require('cloudinary').v2;
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ url: process.env.CLOUDINARY_URL });
}

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB field size limit
    fieldNameSize: 100, // Field name size limit
    fields: 10, // Number of fields limit
    files: 1, // Number of files limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.post('/', auth, chat);

// Anonymous chat removed - unauthenticated users only get profile-pic-review, not chat

// Test routes removed - all chat should go through regular routes

// Chat with image analysis route
router.post('/with-image', 
  auth,
  upload.single('image'),
  (req, res, next) => {
    next();
  },
  async (req, res, next) => {
    try {
      
      // If image is uploaded, process it and add imageUrl to body
      if (req.file) {
        
        // Use the already configured cloudinary instance
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'jules-dating-chat-images'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
        
        // Generate lightweight thumbnail for context storage
        const thumbnailUrl = result.secure_url.replace('/upload/', '/upload/w_150,h_150,c_fill,q_auto,f_auto/');
        
        req.body.imageUrl = result.secure_url;
        req.body.thumbnailUrl = thumbnailUrl;
      }
      
      next();
    } catch (error) {
      console.error('🚨 IMAGE UPLOAD ERROR:', error);
      console.error('🚨 ERROR MESSAGE:', error.message);
      console.error('🚨 ERROR STACK:', error.stack);
      res.status(500).json({ error: 'Failed to upload image', details: error.message });
    }
  },
  chatWithImage
);


// Chat sessions routes (GET, POST, PUT, DELETE for managing chat history)
router.use('/', chatSessionsRoutes);

module.exports = router;