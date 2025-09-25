const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Enhanced sanitization function to prevent XSS
const sanitizeHtml = (value) => {
  if (typeof value !== 'string') return value;
  
  // Remove potentially dangerous HTML/script tags
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Authentication validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .customSanitizer(sanitizeHtml)
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .customSanitizer(sanitizeHtml)
    .matches(/^[a-zA-Z0-9\s\-'\.]+$/)
    .withMessage('Name must be between 2 and 50 characters and contain only letters, numbers, spaces, hyphens, apostrophes, and periods'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .customSanitizer(sanitizeHtml)
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

// Enhanced chat validation rules with better XSS protection
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .customSanitizer(sanitizeHtml)
    .escape()
    .withMessage('Message contains invalid characters'),
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('context')
    .optional()
    .isArray()
    .withMessage('Context must be an array'),
  body('context.*')
    .optional()
    .customSanitizer(sanitizeHtml)
    .escape(),
  handleValidationErrors
];

// Enhanced product search validation
const validateProductSearch = [
  body('query')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Search query must be between 1 and 500 characters')
    .customSanitizer(sanitizeHtml)
    .escape()
    .withMessage('Search query contains invalid characters'),
  body('category')
    .optional()
    .isIn(['shirts', 'pants', 'shoes', 'accessories', 'outerwear'])
    .withMessage('Invalid category'),
  body('priceRange')
    .optional()
    .isObject()
    .withMessage('Price range must be an object'),
  body('priceRange.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  body('priceRange.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  handleValidationErrors
];

// Enhanced image search validation
const validateImageSearch = [
  body('query')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Image search query must be between 1 and 300 characters')
    .customSanitizer(sanitizeHtml)
    .escape()
    .withMessage('Image search query contains invalid characters'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Image count must be between 1 and 20'),
  body('style')
    .optional()
    .isIn(['casual', 'formal', 'streetwear', 'vintage', 'minimalist'])
    .withMessage('Invalid style preference'),
  handleValidationErrors
];

// Enhanced user profile validation with better sanitization
const validateUserProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .customSanitizer(sanitizeHtml)
    .matches(/^[a-zA-Z0-9\s\-'\.]+$/)
    .withMessage('Name must be between 2 and 50 characters and contain only letters, numbers, spaces, hyphens, apostrophes, and periods'),
  body('stylePreferences.brands')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Brands must be an array with maximum 20 items'),
  body('stylePreferences.brands.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .customSanitizer(sanitizeHtml)
    .matches(/^[a-zA-Z0-9\s\-'\.&]+$/)
    .withMessage('Each brand must be between 1 and 50 characters and contain only letters, numbers, spaces, hyphens, apostrophes, periods, and ampersands'),
  body('bodyInfo.height')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .customSanitizer(sanitizeHtml)
    .matches(/^[0-9\s'"]+$/)
    .withMessage('Height must be between 1 and 20 characters and contain only numbers, spaces, apostrophes, and quotes'),
  body('bodyInfo.weight')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .customSanitizer(sanitizeHtml)
    .matches(/^[0-9\s'"]+$/)
    .withMessage('Weight must be between 1 and 20 characters and contain only numbers, spaces, apostrophes, and quotes'),
  body('lifestyle.aboutMe')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .customSanitizer(sanitizeHtml)
    .escape()
    .withMessage('About me must be less than 1000 characters'),
  handleValidationErrors
];

// Enhanced file upload validation
const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('No file uploaded');
      }
      
      // File size will be handled by Cloudinary resizing
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
      }
      
      // Check file extension
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('Invalid file extension');
      }
      
      return true;
    }),
  handleValidationErrors
];

// Enhanced URL parameter validation
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Enhanced query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['asc', 'desc', 'newest', 'oldest', 'price-low', 'price-high'])
    .withMessage('Invalid sort parameter'),
  handleValidationErrors
];

// Enhanced sanitization for all inputs
const sanitizeInput = [
  body('*').customSanitizer(sanitizeHtml).trim().escape(),
  query('*').customSanitizer(sanitizeHtml).trim().escape(),
  param('*').customSanitizer(sanitizeHtml).trim().escape(),
  (req, res, next) => next()
];

// New: Comprehensive input sanitization middleware
const comprehensiveSanitization = [
  (req, res, next) => {
    // Sanitize body (exclude sensitive fields like passwords)
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string' && !['password', 'confirmPassword', 'newPassword', 'currentPassword'].includes(key)) {
          req.body[key] = sanitizeHtml(req.body[key]);
        }
      });
    }
    
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeHtml(req.query[key]);
        }
      });
    }
    
    next();
  }
];

module.exports = {
  validateLogin,
  validateRegister,
  validateChatMessage,
  validateProductSearch,
  validateImageSearch,
  validateUserProfile,
  validateFileUpload,
  validateMongoId,
  validatePagination,
  sanitizeInput,
  comprehensiveSanitization,
  handleValidationErrors
}; 