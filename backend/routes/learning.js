const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ConversationLearning = require('../utils/conversationLearning');
const Conversation = require('../models/Conversation');
const UserProfile = require('../models/UserProfile');

// GET /api/learning/insights - Get user's learning insights
router.get('/insights', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = await Conversation.findOne({ userId });
    
    if (!conversation || conversation.messages.length < 5) {
      return res.json({ 
        message: 'Not enough conversation history for insights',
        insights: null 
      });
    }

    const insights = await ConversationLearning.extractInsights(
      userId,
      '',
      conversation.messages
    );

    res.json({ insights });
  } catch (error) {
    console.error('Error getting learning insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/learning/adaptive-context - Get adaptive response context
router.get('/adaptive-context', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = await Conversation.findOne({ userId });
    
    if (!conversation || conversation.messages.length < 5) {
      return res.json({ 
        message: 'Not enough conversation history',
        adaptiveContext: null 
      });
    }

    const insights = await ConversationLearning.extractInsights(
      userId,
      '',
      conversation.messages
    );

    const adaptiveContext = await ConversationLearning.generateAdaptiveContext(userId, insights);

    res.json({ adaptiveContext });
  } catch (error) {
    console.error('Error getting adaptive context:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/learning/profile-evolution - Get how user profile has evolved
router.get('/profile-evolution', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const evolution = {
      styleProfile: {
        preferredStyles: profile.styleProfile?.preferredStyles || [],
        colorsLove: profile.styleProfile?.colorsLove || [],
        colorsAvoid: profile.styleProfile?.colorsAvoid || [],
        favoriteBrands: profile.styleProfile?.favoriteBrands || [],
        lastUpdated: profile.styleProfile?.lastUpdated
      },
      lifestyle: {
        topActivities: profile.lifestyle?.topActivities || [],
        primaryEnvironments: profile.lifestyle?.primaryEnvironments || [],
        relationshipStatus: profile.lifestyle?.relationshipStatus,
        lastUpdated: profile.lifestyle?.lastUpdated
      },
      meta: {
        createdAt: profile.meta?.createdAt,
        updatedAt: profile.meta?.updatedAt,
        lastContextBuildAt: profile.meta?.lastContextBuildAt
      }
    };

    res.json({ evolution });
  } catch (error) {
    console.error('Error getting profile evolution:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/learning/force-update - Force learning update (for testing)
router.post('/force-update', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, conversationHistory } = req.body;
    
    if (!message || !conversationHistory) {
      return res.status(400).json({ message: 'Message and conversation history required' });
    }

    const insights = await ConversationLearning.extractInsights(
      userId,
      message,
      conversationHistory
    );

    if (insights) {
      const profileUpdated = await ConversationLearning.updateProfileWithInsights(userId, insights);
      const adaptiveContext = await ConversationLearning.generateAdaptiveContext(userId, insights);

      res.json({
        success: true,
        insights,
        profileUpdated,
        adaptiveContext
      });
    } else {
      res.json({
        success: false,
        message: 'No insights extracted (possibly context switch)'
      });
    }
  } catch (error) {
    console.error('Error forcing learning update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/learning/generate-context - Force context summary generation (for testing)
router.post('/generate-context', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const ContextSummarizer = require('../utils/contextSummarizer');
    const contextSummary = await ContextSummarizer.generateContextSummary(userId);
    
    if (contextSummary) {
      res.json({
        success: true,
        contextSummary,
        message: 'Context summary generated successfully'
      });
    } else {
      res.json({
        success: false,
        message: 'Failed to generate context summary'
      });
    }
  } catch (error) {
    console.error('Error generating context summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/learning/status - Get learning system status
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = await Conversation.findOne({ userId });
    const profile = await UserProfile.findOne({ userId });
    
    const status = {
      hasConversationHistory: !!(conversation && conversation.messages.length > 0),
      messageCount: conversation ? conversation.messages.length : 0,
      hasProfile: !!profile,
      profileLastUpdated: profile?.meta?.updatedAt,
      learningEnabled: true, // Can be made configurable per user
      nextLearningTrigger: conversation ? (5 - (conversation.messages.length % 5)) : 5
    };

    res.json({ status });
  } catch (error) {
    console.error('Error getting learning status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 