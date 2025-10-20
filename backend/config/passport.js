const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { logInfo, logError } = require('../utils/logger');
// const segment = require('../utils/segment'); // Temporarily disabled

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Determine callback URL based on environment
const getCallbackURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.GOOGLE_CALLBACK_URL || "https://jules-dating.onrender.com/api/auth/google/callback";
  } else {
    // For localhost, callback goes to backend (4002), not frontend (3002)
    return "http://localhost:4002/api/auth/google/callback";
  }
};

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: getCallbackURL(),
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Log OAuth profile received without exposing email
    logInfo('🔐 Google OAuth Strategy - Profile received', {
      profileId: profile.id,
      displayName: profile.displayName,
      hasEmail: !!profile.emails?.[0]?.value,
      emailDomain: profile.emails?.[0]?.value?.split('@')[1] || 'unknown'
    });

    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      logInfo('🔐 Found existing user by Google ID', {
        userId: user._id,
        hasEmail: !!user.email,
        emailDomain: user.email?.split('@')[1] || 'unknown'
      });
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      logInfo('🔐 Found existing user by email, updating with Google ID', {
        userId: user._id,
        hasEmail: !!user.email,
        emailDomain: user.email?.split('@')[1] || 'unknown'
      });
      // Update existing user with Google ID
      user.googleId = profile.id;
      user.picture = profile.photos[0]?.value;
      await user.save();
      return done(null, user);
    }

    logInfo('🔐 Creating new user with Google profile', {
      hasEmail: !!profile.emails?.[0]?.value,
      emailDomain: profile.emails?.[0]?.value?.split('@')[1] || 'unknown'
    });
    
    // Create new user
    user = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      picture: profile.photos[0]?.value,
      onboarding: {
        completed: false,
        name: profile.displayName,
        email: profile.emails[0].value
      }
    });

    await user.save();
    logInfo('🔐 New user created successfully', {
      userId: user._id,
      hasEmail: !!user.email,
      emailDomain: user.email?.split('@')[1] || 'unknown'
    });

    // Track new user registration with Segment
    try {
      const segment = require('../utils/segment');
      await segment.trackSignup(user._id.toString(), 'google_oauth', {
        email: user.email,
        name: user.name,
        source: 'google_oauth',
        feature: 'oauth_registration'
      });
      logInfo('✅ Google OAuth user registration tracked with Segment:', user.email);
    } catch (analyticsError) {
      logError('❌ Failed to track Google OAuth user registration:', analyticsError);
      // Don't fail OAuth if analytics fails
    }

    return done(null, user);

  } catch (error) {
    logError('❌ Google OAuth Strategy Error:', error);
    return done(error, null);
  }
}));

module.exports = passport; 