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
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File size is ${sizeMB}MB. Maximum allowed is 50MB. Please compress your image or choose a smaller file.`);
  }

  // Strict MIME type validation - including HEIC/HEIF support
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/octet-stream' // Some devices send HEIC as this
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`File type '${file.mimetype}' is not supported. Please use JPEG, PNG, GIF, WebP, or HEIC images.`);
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error(`File extension '${fileExtension}' is not supported. Please use .jpg, .png, .gif, .webp, or .heic files.`);
  }

  // Validate file extension matches MIME type (relaxed for HEIC which may have different MIME types)
  const mimeToExt = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/heic': ['.heic', '.heif'],
    'image/heif': ['.heic', '.heif'],
    'application/octet-stream': ['.heic', '.heif', '.jpg', '.jpeg', '.png'] // Allow HEIC sent as octet-stream
  };

  if (mimeToExt[file.mimetype] && !mimeToExt[file.mimetype].includes(fileExtension)) {
    throw new Error(`File extension '${fileExtension}' does not match the file type. Please make sure your image file is not corrupted.`);
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
      throw new Error('Invalid filename. Please rename your file and try again.');
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
          folder: `jules-style/${req.user.id || 'anonymous'}`,
          resource_type: 'auto', // Auto-detect resource type (handles HEIC)
          format: 'jpg', // Convert all images to JPG (including HEIC)
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' }, // Allow larger images but limit max size
            { quality: 'auto:good' }, // Auto quality with good baseline
            { fetch_format: 'auto' } // Automatically serve best format for browser
          ],
          // Security options
          overwrite: false, // Prevent overwriting existing images
          unique_filename: true, // Generate unique filenames
          use_filename: false, // Don't use original filename for security
          // Additional options for better image handling
          invalidate: true // Invalidate CDN cache if updating
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Image upload failed: ${error.message || 'Unknown error'}`));
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
    if (error.message.includes('File size') || 
        error.message.includes('file type') ||
        error.message.includes('file extension') ||
        error.message.includes('filename') ||
        error.message.includes('does not match')) {
      return res.status(400).json({ 
        message: error.message
      });
    }
    
    // Cloudinary-specific errors
    if (error.message.includes('Image upload failed')) {
      return res.status(500).json({ 
        message: error.message
      });
    }
    
    res.status(500).json({ message: 'Error uploading image. Please try again.' });
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
          resource_type: 'auto', // Auto-detect resource type (handles HEIC)
          format: 'jpg', // Convert all images to JPG (including HEIC)
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' }, // Allow larger images but limit max size
            { quality: 'auto:good' }, // Auto quality with good baseline
            { fetch_format: 'auto' } // Automatically serve best format for browser
          ],
          // Security options
          overwrite: false,
          unique_filename: true,
          use_filename: false,
          // Anonymous-specific folder
          public_id: `anonymous_${req.anonymousId}_${Date.now()}`,
          invalidate: true
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Image upload failed: ${error.message || 'Unknown error'}`));
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
    if (error.message.includes('File size') || 
        error.message.includes('file type') ||
        error.message.includes('file extension') ||
        error.message.includes('filename') ||
        error.message.includes('does not match')) {
      return res.status(400).json({ 
        message: error.message
      });
    }
    
    // Cloudinary-specific errors
    if (error.message.includes('Image upload failed')) {
      return res.status(500).json({ 
        message: error.message
      });
    }
    
    res.status(500).json({ message: 'Error uploading image. Please try again.' });
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