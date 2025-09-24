const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path'); // Added for file extension validation

// Configure Cloudinary
if (process.env.NODE_ENV !== 'production') {
  console.log('Environment variables check:');
  console.log('- CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'Set' : 'Not set');
  console.log('- CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set');
  console.log('- CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set');
  console.log('- CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set');
}

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    url: process.env.CLOUDINARY_URL
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cloudinary configured with URL');
  }
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cloudinary configured with individual credentials');
  }
} else {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cloudinary configuration is required in production');
  }
  console.warn('Cloudinary not configured - image uploads will fail');
}

// Enhanced file validation function
const validateFile = (file) => {
  // Check file size (50MB max for modern phone photos)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum allowed: ${maxSize / (1024 * 1024)}MB`);
  }

  // Strict MIME type validation
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed');
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('Invalid file extension');
  }

  // Validate file extension matches MIME type
  const mimeToExt = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
  };

  if (!mimeToExt[file.mimetype].includes(fileExtension)) {
    throw new Error('File extension does not match MIME type');
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /[<>:"|?*]/, // Invalid characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names
    /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|dll|so|dylib)$/i // Executable files
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.originalname)) {
      throw new Error('Suspicious filename detected');
    }
  }

  return true;
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for modern phone photos
    files: 1, // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    try {
      validateFile(file);
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  }
});

// Upload image to Cloudinary
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Use streaming upload for better performance (no base64 conversion)
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'jules-style',
          resource_type: 'image', // Explicitly set to image
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ],
          // Security options
          overwrite: false, // Prevent overwriting existing images
          unique_filename: true, // Generate unique filenames
          use_filename: false, // Don't use original filename for security
          // User-specific folder for better organization
          folder: `jules-style/${req.user.id || 'anonymous'}`
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Pipe the file buffer directly to Cloudinary
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Better error handling for validation failures
    if (error.message.includes('File size too large') || 
        error.message.includes('Invalid file type') ||
        error.message.includes('Invalid file extension') ||
        error.message.includes('Suspicious filename')) {
      return res.status(400).json({ 
        message: 'File validation failed',
        error: error.message 
      });
    }
    
    res.status(500).json({ message: 'Error uploading image' });
  }
};

// Upload image for anonymous users (for fit checks)
const uploadAnonymousImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Use streaming upload for better performance (no base64 conversion)
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'jules-style/anonymous',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ],
          // Security options
          overwrite: false,
          unique_filename: true,
          use_filename: false,
          // Anonymous-specific folder
          public_id: `anonymous_${req.anonymousId}_${Date.now()}`
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Stream the file buffer directly to Cloudinary
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Error uploading anonymous image:', error);
    
    // Better error handling for validation failures
    if (error.message.includes('File size too large') || 
        error.message.includes('Invalid file type') ||
        error.message.includes('Invalid file extension') ||
        error.message.includes('Suspicious filename')) {
      return res.status(400).json({ 
        message: 'File validation failed',
        error: error.message 
      });
    }
    
    res.status(500).json({ message: 'Error uploading image' });
  }
};

// Delete image from Cloudinary
const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    // Basic validation of public ID format
    if (!publicId.match(/^[a-zA-Z0-9_-]+$/)) {
      return res.status(400).json({ message: 'Invalid public ID format' });
    }

    // Check if user owns this image (basic check - could be enhanced)
    if (publicId.includes(`jules-style/${req.user.id}`)) {
      const result = await cloudinary.uploader.destroy(publicId);
      res.json({
        message: 'Image deleted successfully',
        result
      });
    } else {
      res.status(403).json({ message: 'Access denied to this image' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
};

// Get image info from Cloudinary
const getImageInfo = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    // Basic validation of public ID format
    if (!publicId.match(/^[a-zA-Z0-9_-]+$/)) {
      return res.status(400).json({ message: 'Invalid public ID format' });
    }

    // Check if user owns this image (basic check - could be enhanced)
    if (publicId.includes(`jules-style/${req.user.id}`)) {
      const result = await cloudinary.api.resource(publicId);
      res.json({
        imageInfo: result
      });
    } else {
      res.status(403).json({ message: 'Access denied to this image' });
    }
  } catch (error) {
    console.error('Error getting image info:', error);
    res.status(500).json({ message: 'Error getting image info' });
  }
};

module.exports = {
  uploadImage,
  uploadAnonymousImage,
  deleteImage,
  getImageInfo,
  upload
}; 