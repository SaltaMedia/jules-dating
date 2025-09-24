const DailyTip = require('../models/DailyTip');

// Daily tip categories
const TIP_CATEGORIES = {
  STYLE: 'style',
  CONFIDENCE: 'confidence',
  DATING: 'dating',
  SOCIAL: 'social'
};

// Generate daily tip based on user context and preferences
async function generateDailyTip(userId, userPreferences = {}) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user already got a tip today
    const existingTip = await DailyTip.findOne({
      userId,
      date: today
    });

    if (existingTip) {
      return existingTip;
    }

    // Get user context for personalized tips
    const userContext = await getUserContext(userId);
    
    // Select tip category based on user patterns
    const tipCategory = selectTipCategory(userContext, userPreferences);
    
    // Generate tip content using Jules' personality
    const tipContent = await generateTipContent(tipCategory, userContext);
    
    // Save the tip
    const dailyTip = new DailyTip({
      userId,
      category: tipCategory,
      content: tipContent,
      date: today,
      read: false
    });

    await dailyTip.save();
    return dailyTip;

  } catch (error) {
    console.error('Error generating daily tip:', error);
    return null;
  }
}

// Select tip category based on user context
function selectTipCategory(userContext, preferences) {
  const { stylePreferences, emotionalInsights, recentActivity } = userContext;
  
  // If user has been asking about dating recently, prioritize dating tips
  if (recentActivity?.includes('dating') || recentActivity?.includes('date')) {
    return TIP_CATEGORIES.DATING;
  }
  
  // If user has low confidence, prioritize confidence tips
  if (emotionalInsights?.confidenceLevel === 'low') {
    return TIP_CATEGORIES.CONFIDENCE;
  }
  
  // If user is style-focused, prioritize style tips
  if (stylePreferences?.length > 0) {
    return TIP_CATEGORIES.STYLE;
  }
  
  // Default rotation
  const categories = Object.values(TIP_CATEGORIES);
  const today = new Date().getDate();
  return categories[today % categories.length];
}

// Generate tip content using Jules' personality
async function generateTipContent(category, userContext) {
  const basePrompts = {
    [TIP_CATEGORIES.STYLE]: `You're Jules giving a quick, punchy style tip. Keep it under 100 words. Be direct, opinionated, and actionable. No motivational language.`,
    [TIP_CATEGORIES.CONFIDENCE]: `You're Jules giving a confidence tip. Keep it under 100 words. Be direct and practical, not motivational. Give specific actions.`,
    [TIP_CATEGORIES.DATING]: `You're Jules giving a dating tip. Keep it under 100 words. Be direct and actionable, not generic advice.`,
    [TIP_CATEGORIES.SOCIAL]: `You're Jules giving a social skills tip. Keep it under 100 words. Be direct and practical.`
  };

  const prompt = basePrompts[category];
  
  // Add user context if available
  const contextualPrompt = userContext ? 
    `${prompt} Consider this user context: ${JSON.stringify(userContext)}` : 
    prompt;

  // Use OpenAI to generate the tip
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are Jules - direct, stylish, and opinionated. Give quick, actionable tips in your authentic voice."
      },
      {
        role: "user",
        content: contextualPrompt
      }
    ],
    max_tokens: 150,
    temperature: 0.8
  });

  return completion.choices[0].message.content;
}

// Get user context for personalization
async function getUserContext(userId) {
  try {
    // This would integrate with your existing user context system
    // For now, return basic context
    return {
      stylePreferences: [],
      emotionalInsights: { confidenceLevel: 'medium' },
      recentActivity: []
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return {};
  }
}

// Get today's tip for a user
async function getTodaysTip(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let tip = await DailyTip.findOne({
      userId,
      date: today
    });

    if (!tip) {
      // Generate a new tip if none exists
      tip = await generateDailyTip(userId);
    }

    return tip;
  } catch (error) {
    console.error('Error getting today\'s tip:', error);
    return null;
  }
}

// Mark tip as read
async function markTipAsRead(userId, tipId) {
  try {
    await DailyTip.findOneAndUpdate(
      { _id: tipId, userId },
      { read: true }
    );
    return true;
  } catch (error) {
    console.error('Error marking tip as read:', error);
    return false;
  }
}

// Get tip history for a user
async function getTipHistory(userId, limit = 7) {
  try {
    const tips = await DailyTip.find({ userId })
      .sort({ date: -1 })
      .limit(limit);
    
    return tips;
  } catch (error) {
    console.error('Error getting tip history:', error);
    return [];
  }
}

module.exports = {
  generateDailyTip,
  getTodaysTip,
  markTipAsRead,
  getTipHistory,
  TIP_CATEGORIES
};
