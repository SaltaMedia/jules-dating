require('dotenv').config();
const jwt = require('jsonwebtoken');

// Get JWT secret with proper error handling (same as auth middleware)
function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.log('JWT_SECRET not set, using development fallback');
    return 'dev-jwt-secret-only-for-development';
  }
  return secret;
}

const secret = getJWTSecret();
console.log('Using JWT secret:', secret.substring(0, 10) + '...');

const userId = '689e5f659b23d73cec7dddfd';
const email = 'spsalta@gmail.com';

// Create token
const token = jwt.sign(
  { userId: userId, email: email, isAdmin: false },
  secret,
  { expiresIn: '1h' }
);

console.log('Generated token:', token);

// Verify token
try {
  const decoded = jwt.verify(token, secret);
  console.log('Token verified successfully:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}
