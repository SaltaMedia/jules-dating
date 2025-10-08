const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const passport = require('passport');
const crypto = require('crypto');
const { logInfo, logError, logWarn } = require('../utils/logger');
const { 
  ValidationError, 
  AuthenticationError, 
  ConflictError, 
  NotFoundError,
  asyncHandler 
} = require('../utils/errorHandler');
const { 
  cacheUserProfile, 
  getCachedUserProfile, 
  clearUserCache 
} = require('../utils/cache');
const { queryOptimizers } = require('../utils/databaseOptimizer');
const { sendPasswordResetEmail } = require('../utils/emailService');
const analyticsService = require('../utils/analyticsService');

// Get JWT secret with proper error handling
function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    logWarn('JWT_SECRET not set, using development fallback. This should not be used in production.');
    return 'dev-jwt-secret-only-for-development';
  }
  return secret;
}

// Local authentication strategy
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Register new user
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('User already exists with this email');
  }

  // Create new user (password will be hashed by User model pre-save hook)
  const user = new User({
    name,
    email,
    password,
    onboarding: {
      completed: false,
      name: name,
      email: email
    }
  });

  await user.save();

  // Send welcome email immediately after registration
  try {
    const { sendWelcomeEmail } = require('../utils/emailService');
    // Pass 'jules-dating' as the app type for this backend
    await sendWelcomeEmail(user.email, user.name || user.email, 'jules-dating');
    user.welcomeEmailSent = true;
    await user.save();
    logInfo('✅ Welcome email sent to new user:', user.email);
  } catch (emailError) {
    logError('❌ Failed to send welcome email:', emailError);
    // Don't fail registration if email fails
  }

  // Track user registration in analytics
  try {
    await analyticsService.trackEvent({
      userId: user._id.toString(),
      sessionId: req.sessionId || 'registration_' + Date.now(),
      eventType: 'conversion',
      category: 'engagement',
      action: 'account_created',
      page: '/register',
      properties: {
        email: user.email,
        name: user.name,
        method: 'email',
        source: req.body.source || 'direct',
        feature: req.body.feature || 'registration'
      }
    });
    logInfo('✅ User registration tracked in analytics:', user.email);
  } catch (analyticsError) {
    logError('❌ Failed to track user registration:', analyticsError);
    // Don't fail registration if analytics fails
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email, isAdmin: user.isAdmin },
    getJWTSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      throw new AuthenticationError('Email and password are required');
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AuthenticationError('No account found with this email address. Please check your email or create a new account.');
    }

    // Check if user has a password (OAuth users can also set passwords)
    console.log('🔍 Login attempt - User has password:', !!user.password);
    console.log('🔍 Login attempt - User has Google ID:', !!user.googleId);
    
    // If user has no password AND has a Google ID, they're OAuth-only
    if (!user.password && user.googleId) {
      throw new AuthenticationError('This account was created with Google. Please use the "Continue with Google" button to sign in.');
    }
    
    // If user has no password and no Google ID, something is wrong
    if (!user.password && !user.googleId) {
      throw new AuthenticationError('Account configuration error. Please contact support.');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Check if this is an OAuth user who might not have set a password yet
      if (user.googleId) {
        throw new AuthenticationError('This account was created with Google. Please use the "Continue with Google" button to sign in.');
      } else {
        throw new AuthenticationError('Incorrect password. Please try again or use "Forgot Password" to reset it.');
      }
    }

    // Ensure user has complete onboarding data structure (for both email and OAuth users)
    let userUpdated = false;
    if (!user.onboarding) {
      user.onboarding = {
        completed: false,
        name: user.name,
        email: user.email
      };
      userUpdated = true;
    } else {
      // Ensure basic fields are populated
      if (!user.onboarding.name && user.name) {
        user.onboarding.name = user.name;
        userUpdated = true;
      }
      if (!user.onboarding.email && user.email) {
        user.onboarding.email = user.email;
        userUpdated = true;
      }
    }

    // Save the updated user if changes were made
    if (userUpdated) {
      await user.save();
      logInfo('✅ User onboarding data updated during login:', user.onboarding);
    }


    // Track user login in analytics
    try {
      await analyticsService.trackEvent({
        userId: user._id.toString(),
        sessionId: req.sessionId || 'login_' + Date.now(),
        eventType: 'session_start',
        category: 'engagement',
        action: 'login',
        page: '/login',
        properties: {
          email: user.email,
          name: user.name,
          method: 'email',
          isAdmin: user.isAdmin
        }
      });
      logInfo('✅ User login tracked in analytics:', user.email);
    } catch (analyticsError) {
      logError('❌ Failed to track user login:', analyticsError);
      // Don't fail login if analytics fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      getJWTSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data with onboarding information
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      onboarding: user.onboarding,
      settings: user.settings,
      picture: user.picture
    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    // Log the error for debugging but don't expose internal details
    logError('Login error:', error);
    
    // If it's already an AuthenticationError, re-throw it
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    // For any other errors, provide a generic but helpful message
    throw new AuthenticationError('Login failed. Please try again or contact support if the problem persists.');
  }
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour

  // Save reset token to user
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetTokenExpiry;
  await user.save();

  // Create reset URL - use proper environment variable for production
  const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://dating.juleslabs.com' : 'http://localhost:3002');
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  // Send password reset email
  const emailSent = await sendPasswordResetEmail(email, resetToken, resetUrl);
  
  if (emailSent) {
    res.json({ message: 'Password reset link has been sent to your email address.' });
  } else {
    // Fallback: return the reset URL directly if email fails
    res.json({
      message: 'Password reset link generated. Please check your email or use the link below:',
      resetUrl: resetUrl
    });
  }
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  
  console.log('🔍 Reset password attempt - Token:', token);
  console.log('🔍 Current time:', Date.now());

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  console.log('🔍 User found:', user ? 'Yes' : 'No');
  if (user) {
    console.log('🔍 User resetPasswordToken:', user.resetPasswordToken);
    console.log('🔍 User resetPasswordExpires:', user.resetPasswordExpires);
    console.log('🔍 Token expires at:', user.resetPasswordExpires?.getTime());
    console.log('🔍 Current time:', Date.now());
    console.log('🔍 Is token expired?', user.resetPasswordExpires?.getTime() < Date.now());
  }

  if (!user) {
    throw new AuthenticationError('Password reset token is invalid or has expired');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update user password and clear reset token
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password has been reset successfully' });
});

// Google OAuth callback
const googleCallback = asyncHandler(async (req, res) => {
  logInfo('🔐 Google callback started');
  logInfo('🔐 Request user:', req.user);
  logInfo('🔐 Request session:', req.session);
  
  if (!req.user) {
    logError('❌ No user found in request - OAuth authentication failed');
    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://dating.juleslabs.com' : 'http://localhost:3002');
    logInfo('🔐 Redirecting to login with error:', `${frontendUrl}/login?error=no_user`);
    return res.redirect(`${frontendUrl}/login?error=no_user`);
  }

  logInfo('✅ User found, generating JWT token for user:', req.user.email);
  
  // Ensure user has complete onboarding data structure for OAuth users
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      // Initialize onboarding data if it doesn't exist
      if (!user.onboarding) {
        user.onboarding = {
          completed: false,
          name: user.name,
          email: user.email
        };
      }
      
      // Ensure basic fields are populated from Google profile
      if (!user.onboarding.name && user.name) {
        user.onboarding.name = user.name;
      }
      if (!user.onboarding.email && user.email) {
        user.onboarding.email = user.email;
      }
      
      // Save the updated user
      await user.save();
      logInfo('✅ User onboarding data updated:', user.onboarding);
    }
  } catch (error) {
    logError('❌ Error updating user onboarding data:', error);
    // Continue with token generation even if onboarding update fails
  }
  
  // Track Google OAuth login in analytics
  try {
    await analyticsService.trackEvent({
      userId: req.user._id.toString(),
      sessionId: req.sessionId || 'oauth_login_' + Date.now(),
      eventType: 'session_start',
      category: 'engagement',
      action: 'login',
      page: '/auth/google/callback',
      properties: {
        email: req.user.email,
        name: req.user.name,
        method: 'google_oauth',
        isAdmin: req.user.isAdmin
      }
    });
    logInfo('✅ Google OAuth login tracked in analytics:', req.user.email);
  } catch (analyticsError) {
    logError('❌ Failed to track Google OAuth login:', analyticsError);
    // Don't fail OAuth if analytics fails
  }

  const token = jwt.sign(
    { 
      userId: req.user._id, 
      email: req.user.email, 
      isAdmin: req.user.isAdmin 
    },
    getJWTSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://dating.juleslabs.com' : 'http://localhost:3002');
  logInfo('🔐 Generated token:', token.substring(0, 20) + '...');
  logInfo('🔐 Redirecting to:', `${frontendUrl}/auth/callback?token=${token}`);

  // Redirect to frontend with token
  res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  // Get the full user object with all fields (not lean)
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.json(user);
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, settings, bodyInfo, stylePreferences, onboarding } = req.body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (settings) updateData.settings = settings;
  if (bodyInfo) updateData.bodyInfo = bodyInfo;
  if (stylePreferences) updateData.stylePreferences = stylePreferences;
  if (onboarding) updateData.onboarding = onboarding;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  // Clear user cache when profile is updated
  await clearUserCache(req.user.id);

  res.json({
    message: 'Profile updated successfully',
    user
  });
});

// Logout
const logout = asyncHandler(async (req, res) => {
  // End analytics session if user is authenticated
  if (req.user && req.user.id) {
    try {
      const { sessionManager } = require('../middleware/sessionManager');
      await sessionManager.forceEndAnalyticsSession(req.user.id);
      logInfo(`Ended analytics session for user ${req.user.id} on logout`);
    } catch (error) {
      logError('Failed to end analytics session on logout:', error);
      // Don't fail logout if analytics fails
    }
  }
  
  // For JWT, we just return success since tokens are stateless
  // The frontend should remove the token
  res.json({ message: 'Logout successful' });
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  googleCallback,
  getCurrentUser,
  updateProfile,
  logout
}; 