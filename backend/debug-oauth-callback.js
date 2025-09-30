const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { logInfo, logError } = require('./utils/logger');

// Simple test callback to isolate the issue
const testCallback = async (req, res) => {
  try {
    console.log('🔍 Test callback started');
    console.log('🔍 Request user:', req.user ? 'User exists' : 'No user');
    console.log('🔍 Request session:', req.session ? 'Session exists' : 'No session');
    
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(400).json({ error: 'No user found in request' });
    }

    console.log('✅ User found:', req.user.email);
    
    // Try to get user from database
    try {
      const user = await User.findById(req.user._id);
      console.log('✅ User found in database:', user.email);
    } catch (dbError) {
      console.log('❌ Database error:', dbError.message);
      return res.status(500).json({ error: 'Database error', details: dbError.message });
    }

    // Try JWT generation
    try {
      const token = jwt.sign(
        { 
          userId: req.user._id, 
          email: req.user.email, 
          isAdmin: req.user.isAdmin 
        },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '7d' }
      );
      console.log('✅ JWT token generated successfully');
    } catch (jwtError) {
      console.log('❌ JWT error:', jwtError.message);
      return res.status(500).json({ error: 'JWT generation error', details: jwtError.message });
    }

    // Try analytics service
    try {
      const analyticsService = require('./utils/analyticsService');
      console.log('✅ Analytics service loaded');
    } catch (analyticsError) {
      console.log('❌ Analytics service error:', analyticsError.message);
      return res.status(500).json({ error: 'Analytics service error', details: analyticsError.message });
    }

    console.log('✅ All tests passed - callback should work');
    res.json({ success: true, message: 'Callback test passed' });

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Unexpected error', details: error.message });
  }
};

module.exports = { testCallback };
