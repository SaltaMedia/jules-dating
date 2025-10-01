const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendFeedbackEmail } = require('../utils/emailService');

// POST /api/feedback - Handle user feedback submissions
router.post('/', auth, async (req, res) => {
  try {
    const { message, timestamp } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name || req.user.email;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Feedback message is required' });
    }

    // Send feedback email to steve@juleslabs.com
    const emailSent = await sendFeedbackEmail({
      userEmail,
      userName,
      message: message.trim(),
      timestamp: timestamp || new Date().toISOString(),
      userId
    });

    if (!emailSent) {
      console.error('Failed to send feedback email');
      return res.status(500).json({ error: 'Failed to send feedback. Please try again.' });
    }

    console.log(`Feedback submitted by user ${userId} (${userEmail}): ${message.substring(0, 100)}...`);

    res.json({ 
      success: true, 
      message: 'Feedback submitted successfully' 
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
  }
});

module.exports = router;
