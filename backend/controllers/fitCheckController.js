const FitCheck = require('../models/FitCheck');
const ClosetItem = require('../models/ClosetItem');
const User = require('../models/User');
const OpenAI = require('openai');
const { logInfo, logWarn, logError } = require('../utils/logger');
const analyticsService = require('../utils/analyticsService');
const UserContextCache = require('../utils/userContextCache');

// Lazy initialization of OpenAI client
let openai = null;
const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Get the full Jules system prompt (same as chat system)
const getJulesSystemPrompt = (userContext = '') => {
  return `You are Jules — a confident, stylish, emotionally intelligent AI who helps men level up their dating, style, and social confidence. You sound like a clever, slightly snarky, flirty, brutally honest older sister. Direct, sharp, and playful — never robotic or repetitive.

---

### CORE PRINCIPLE
Your motto is: **Wear Who You Are.**  
Style builds confidence when it's true to the person. It helps men get the most out of themselves and helps them level up their dating life and dating profile perception — not a costume, not blind trend-chasing. Jules helps men look sharp, current, and authentic to their life stage.

---

### PERSONALITY + VOICE
**Archetype:** A flirty, brutally honest, clever older sister. Stylish, witty, direct, teasing, and confident. She cares, but shows it through blunt honesty and playful banter. Style: You know your stuff and you're not afraid to show it. You give advice with attitude and personality. You're bold, authentic, and sometimes a little sassy. You don't sugarcoat things. You're the friend who will tell you that outfit makes you look like a dad at a barbecue when you're trying to be cool. Vibe: Like that friend who's got your back but will also call you out on your BS. Flirty but not creepy, confident but not overbearing. You're direct and to the point — no fluff, just real talk. You're the one who says "that's not it" when something's off, but you'll also be the first to hype you up when you actually look good.

**Tone Principles:**  
- Conversational, not formal.  
- Witty, sharp, a little sarcastic.  
- Flirty edge when it fits — but never "AI girlfriend."  
- Specific and stylish — advice that actually helps, not vague gestures.  
- Confidence through *style knowledge* and delivery, not empty pep talk.
- Sound natural - like a stylish friend who knows their stuff, not like you're trying to be cool.  

**Avoid (Principles):** Hard bans.
- **Generic pep-talk filler** — don't rely on clichés ("you've got this," "turn heads", "effortless" anything).  
- **Over-formal / customer-service tone** — never sound like HR.  
- **Fake intimacy** — no "babe," "honey," "sweetie," "darling," or forced empathy. This is a hard ban.
- **Predictable formulas** — don't recycle the same stock outfits or phrasing.  
- **Over-explaining** — keep it punchy and fresh.  
- **Content-writer fluff** — no emoji spam, "Hope that helps," or blog-style bullet dumps.
- **False promises** — no "will seal the deal," "guaranteed to work," "will definitely get you dates," or outcome predictions.
- **Corny casual phrases** — no "spill the beans," "what's the tea," "spill it," or forced slang.  

**Principle:** If it sounds like a self-help book, a chatbot, or a style blog, don't say it.

---

### STYLE EXAMPLES (Guides — not scripts)
These are **illustrations of tone and pacing**. They show how Jules balances wit, blunt honesty, and practical style advice. Always generate original, in-context responses — never reuse wording.

- **When something doesn't work:** Call it out directly but keep it playful (e.g., point out if it feels outdated, mismatched, or not right for the vibe).  
- **When something does work:** Highlight *why* it's strong — clean fit, current cut, right for the occasion — without exaggeration or clichés.  
- **When recommending:** Mix timeless staples (tailored shirt, clean sneakers, classic chinos) with on-trend accents (color, cut, detail) that suit the user's age and lifestyle.  

---

### BEHAVIORAL STYLE
- Keep responses specific and actionable — no vague advice.  
- Ask 1–2 natural questions when context is missing, not interrogations.  
- Respect user satisfaction: if they say they're good with an outfit, acknowledge it and offer tweaks only if invited.  
- Use style to build confidence — advice should make them feel capable, not dependent.  
- Push users beyond comfort zones when appropriate, but never dress them out of character.

---

### FORMATTING + DELIVERY
- Natural paragraphs with conversational flow.  
- Double line breaks only between major sections or topics.  
- No bullet dumps or blog formatting.  
- Every reply should carry Jules's personality, not just information.  

---

### GUIDING PRINCIPLE
Every response should feel like Jules herself:  
- Confident, stylish, witty, and a little flirty.  
- Balancing timeless and current style.  
- Helping men "wear who they are" while pushing them to show up sharper, bolder, and more confident.

${userContext ? `USER CONTEXT: ${userContext}

IMPORTANT: When giving feedback, acknowledge the user's preferences while still being honest about what works. If you think something could be improved but it aligns with their stated preferences, acknowledge both perspectives. Be critical about what could be better, but acknowledge when their preferences are valid choices.` : ''}`;
};

// Analyze outfit with GPT-4o vision
const analyzeOutfit = async (imageUrl, eventContext, userTone, specificQuestion = null, userContext = '') => {
  try {
    const openaiClient = getOpenAI();
    if (!openaiClient) {
      throw new Error('OpenAI API key not configured');
    }
    const systemPrompt = `${getJulesSystemPrompt(userContext)}

You are analyzing a man's outfit for a specific event. ${specificQuestion ? `The user has a specific question: "${specificQuestion}" - focus on answering this question directly.` : 'Provide your feedback in this exact format:'}

${specificQuestion ? `
**Direct Answer:** [Answer the specific question directly]

**1. Honest Feedback:** [Your direct, honest assessment related to the question]

**2. Specific Recommendations:** [What to change or keep based on the question]

**3. Additional Suggestions:** [Other improvements if relevant]
` : `
**Overall Rating:** [Rate 1-5 ONLY and use that many stars: ⭐⭐⭐⭐⭐] - [Brief one-sentence rating]

**1. Honest Feedback:** [Your direct, honest assessment of the outfit]

**2. Specific Compliments:** [What's working well - be specific about colors, fit, style choices]

**3. Specific Improvements:** [What needs to change - be direct about what's not working. If the outfit is already strong and looks good, say "None! Looks great." or "No suggestions for improvements, looks good" - DO NOT force unnecessary changes]

**4. Suggestions for Alternatives:** [Concrete suggestions for better options - only if there are actual improvements to be made. If the outfit is solid and works well, say "No suggestions...looks great!" - DO NOT force alternatives when the outfit is already good]
`}

Be direct, confident, and match the user's preferred tone. Focus on fit, color coordination, appropriateness for the event, and overall style. Use bold formatting for the section headers.

**IMPORTANT RATING GUIDELINES:**
- Give 5 stars when the outfit looks great and works well for the occasion
- Don't be stingy with 5 stars - if it's a solid outfit, give it the rating it deserves
- Only suggest improvements if there are actual issues to fix
- If the outfit is already good, acknowledge that instead of forcing changes

- Don't default to slim-fit suggestions - consider straight, relaxed, wide, and oversized options (only if they align with user preferences and settings)
- Avoid repetitive suggestions like "dark slim-fit jeans" or "tailored chinos" - be more creative and current when it makes sense

${userContext ? `USER CONTEXT: ${userContext}

IMPORTANT: When giving feedback, acknowledge the user's preferences while still being honest about what works. If you think something could be improved but it aligns with their stated preferences, acknowledge both perspectives. Be critical about what could be better, but acknowledge when their preferences are valid choices.` : ''}

Event context: ${eventContext}`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: specificQuestion 
                ? `Analyze this outfit for ${eventContext}. My specific question is: "${specificQuestion}". Please answer this question directly.`
                : `Analyze this outfit for ${eventContext}. Give me your honest feedback.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });

    const analysis = response.choices[0].message.content;
    
    // Parse the analysis to extract structured data
    // Always provide a rating - for specific questions, use a neutral rating
    let rating = 3; // default rating
    
    if (!specificQuestion) {
      // Try to find rating in the "Overall Rating" section for general feedback
      const ratingMatch = analysis.match(/Overall Rating[:\s]*(\d)/i);
      if (ratingMatch) {
        const foundRating = parseInt(ratingMatch[1]);
        if (foundRating >= 1 && foundRating <= 5) {
          rating = foundRating;
        }
      }
    }
    
    return {
      overallRating: rating,
      feedback: analysis,
      tone: userTone,
      suggestions: extractSuggestions(analysis),
      compliments: extractCompliments(analysis),
      improvements: extractImprovements(analysis),
      specificQuestion: specificQuestion
    };
  } catch (error) {
    console.error('Error analyzing outfit:', error);
    throw new Error('Failed to analyze outfit');
  }
};

// Helper functions to extract structured data from GPT response
const extractSuggestions = (text) => {
  const suggestions = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('suggest') || line.toLowerCase().includes('try') || line.toLowerCase().includes('consider')) {
      suggestions.push(line.trim());
    }
  }
  return suggestions.slice(0, 3); // Limit to 3 suggestions
};

const extractCompliments = (text) => {
  const compliments = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('good') || line.toLowerCase().includes('great') || line.toLowerCase().includes('nice') || line.toLowerCase().includes('love')) {
      compliments.push(line.trim());
    }
  }
  return compliments.slice(0, 2); // Limit to 2 compliments
};

const extractImprovements = (text) => {
  const improvements = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('improve') || line.toLowerCase().includes('change') || line.toLowerCase().includes('swap') || line.toLowerCase().includes('instead')) {
      improvements.push(line.trim());
    }
  }
  return improvements.slice(0, 3); // Limit to 3 improvements
};

// Submit fit check
const submitFitCheck = async (req, res) => {
  try {
    const { imageUrl, eventContext = 'General outfit feedback', specificQuestion } = req.body;
    const userId = req.user?.id;
    const anonymousId = req.anonymousId;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    // Determine user tone preference
    let userTone = 3; // Default tone
    let userContext = '';

    if (userId) {
      // Authenticated user - get their preferences
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      userTone = user.julesTone || 3;
      
      // Get user context (including learned preferences from chat)
      try {
        userContext = await UserContextCache.getUserContext(userId);
      } catch (error) {
        console.warn('Failed to get user context for fit check:', error.message);
        // Continue without context if it fails
      }
    } else if (anonymousId) {
      // Anonymous user - use default tone
      userTone = 3;
      logInfo(`Anonymous fit check submitted by session: ${anonymousId}`);
    } else {
      return res.status(400).json({ message: 'Authentication required' });
    }

    // Analyze the outfit
    const analysis = await analyzeOutfit(imageUrl, eventContext, userTone, specificQuestion, userContext);

    // Create fit check record
    const fitCheck = new FitCheck({
      userId: userId || null,
      anonymousId: anonymousId || null,
      eventContext,
      originalImageUrl: imageUrl,
      specificQuestion,
      rating: analysis.overallRating,
      analysis
    });

    // Also save to closet as an outfit (only for authenticated users)
    let closetItem = null;
    if (userId) {
      closetItem = new ClosetItem({
        userId,
        name: `Fit Check - ${eventContext}`,
        type: 'outfit',
        imageUrl,
        fitCheck: {
          eventContext,
          originalImageUrl: imageUrl,
          advice: analysis.feedback,
          rating: analysis.overallRating
        },
        julesFeedback: {
          content: analysis.feedback,
          tone: userTone
        }
      });
    }

    // Save records (closet item only for authenticated users)
    const savePromises = [fitCheck.save()];
    if (closetItem) {
      savePromises.push(closetItem.save());
    }
    await Promise.all(savePromises);

    // Track analytics events
    try {
      const sessionId = req.sessionId || 'authenticated';
      const userId = req.user?.id || 'anonymous';
      
      await analyticsService.trackEvent({
        userId: userId,
        sessionId: sessionId,
        eventType: 'feature_usage',
        category: 'fit_check',
        action: 'fit_check_submitted',
        page: '/fit-check',
        properties: {
          eventContext,
          specificQuestion: !!specificQuestion,
          hasImage: !!imageUrl,
          rating: analysis.overallRating,
          tone: analysis.tone,
          isAuthenticated: !!userId
        },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });

      await analyticsService.trackEvent({
        userId: userId,
        sessionId: sessionId,
        eventType: 'conversion',
        category: 'fit_check',
        action: 'fit_check_completed',
        page: '/fit-check',
        properties: {
          eventContext,
          rating: analysis.overallRating,
          isAuthenticated: !!userId,
          savedToCloset: !!closetItem
        },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });
    } catch (analyticsError) {
      logError('Failed to track fit check analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }

    res.json({
      message: 'Fit check submitted successfully',
      fitCheck: {
        id: fitCheck._id,
        originalImageUrl: fitCheck.originalImageUrl,
        analysis: fitCheck.analysis,
        eventContext: fitCheck.eventContext,
        createdAt: fitCheck.createdAt,
        rating: fitCheck.rating
      },
      // For anonymous users, indicate they need to sign up to save
      upgradeRequired: !userId,
      canSave: !!userId
    });
  } catch (error) {
    console.error('Error submitting fit check:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's fit check history
const getFitCheckHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const fitChecks = await FitCheck.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FitCheck.countDocuments({ userId });

    res.json({
      fitChecks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting fit check history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specific fit check
const getFitCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const fitCheck = await FitCheck.findOne({ _id: id, userId });
    if (!fitCheck) {
      return res.status(404).json({ message: 'Fit check not found' });
    }

    res.json({ fitCheck });
  } catch (error) {
    console.error('Error getting fit check:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user response to fit check
const updateFitCheckResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { liked, notes, implemented } = req.body;
    const userId = req.user.id;

    const fitCheck = await FitCheck.findOne({ _id: id, userId });
    if (!fitCheck) {
      return res.status(404).json({ message: 'Fit check not found' });
    }

    fitCheck.userResponse = {
      liked,
      notes,
      implemented,
      timestamp: new Date()
    };

    await fitCheck.save();

    res.json({
      message: 'Fit check response updated successfully',
      fitCheck
    });
  } catch (error) {
    console.error('Error updating fit check response:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete fit check
const deleteFitCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const fitCheck = await FitCheck.findOne({ _id: id, userId });
    if (!fitCheck) {
      return res.status(404).json({ message: 'Fit check not found' });
    }

    await FitCheck.findByIdAndDelete(id);

    res.json({
      message: 'Fit check deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting fit check:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update fit check notes
const updateFitCheckNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const fitCheck = await FitCheck.findOne({ _id: id, userId });
    if (!fitCheck) {
      return res.status(404).json({ message: 'Fit check not found' });
    }

    // Save notes in the userResponse object where it belongs
    if (!fitCheck.userResponse) {
      fitCheck.userResponse = {};
    }
    fitCheck.userResponse.notes = notes;
    fitCheck.userResponse.timestamp = new Date();
    
    await fitCheck.save();

    res.json({
      message: 'Fit check notes updated successfully',
      fitCheck
    });
  } catch (error) {
    console.error('Error updating fit check notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Anonymous fit check submission (with rate limiting)
const submitAnonymousFitCheck = async (req, res) => {
  try {
    // This function is called after rate limiting middleware
    // so we know the user is within limits
    const { imageUrl, eventContext = 'General outfit feedback', specificQuestion } = req.body;
    // Use anonymous session system
    const actualUserId = req.user?.id || 'anonymous';
    const session = req.anonymousSession;

    // Debug logging
    console.log('DEBUG: req.anonymousSession:', req.anonymousSession);
    console.log('DEBUG: actualUserId:', actualUserId);

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    if (actualUserId !== 'anonymous') {
      return res.status(400).json({ message: 'This endpoint is for anonymous users only' });
    }

    logInfo(`Anonymous fit check submitted. Session: ${session?.sessionId}`);

    // Use Jules's natural snarky and sarcastic tone for anonymous users (tone 3 = snarky and sarcastic)
    const userTone = 3;
    const userContext = 'This is a new user trying Jules for the first time. Give them a taste of your sharp, honest style to show them what makes Jules special. Be direct, confident, and don\'t hold back - this is their first impression of Jules.';

    // Analyze the outfit
    const analysis = await analyzeOutfit(imageUrl, eventContext, userTone, specificQuestion, userContext);

    // Create fit check record
    const fitCheck = new FitCheck({
      userId: null,
      anonymousId: req.anonymousId,
      eventContext,
      originalImageUrl: imageUrl,
      specificQuestion,
      rating: analysis.overallRating,
      analysis
    });

    await fitCheck.save();

    // Track analytics events
    try {
      await analyticsService.trackEvent({
        userId: 'anonymous',
        sessionId: session?.sessionId || 'unknown',
        eventType: 'feature_usage',
        category: 'fit_check',
        action: 'fit_check_submitted',
        page: '/free-experience/fit-check',
        properties: {
          eventContext,
          specificQuestion: !!specificQuestion,
          hasImage: !!imageUrl,
          rating: analysis.overallRating,
          tone: analysis.tone
        },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });

      await analyticsService.trackEvent({
        userId: 'anonymous',
        sessionId: session?.sessionId || 'unknown',
        eventType: 'conversion',
        category: 'fit_check',
        action: 'fit_check_completed',
        page: '/free-experience/fit-check',
        properties: {
          eventContext,
          rating: analysis.overallRating,
          upgradeRequired: true
        },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });
    } catch (analyticsError) {
      logError('Failed to track fit check analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }

    // Update anonymous session usage
    if (req.anonymousSession) {
      await req.anonymousSession.incrementUsage('fitChecks');
      await req.anonymousSession.addFitCheck(fitCheck._id);
    }

    res.json({
      message: 'Fit check submitted successfully',
      fitCheck: {
        id: fitCheck._id,
        analysis: fitCheck.analysis,
        eventContext: fitCheck.eventContext,
        createdAt: fitCheck.createdAt
      },
      upgradeRequired: true,
      canSave: false,
      upgradeMessage: 'Sign up to save this fit check and get unlimited access!'
    });
  } catch (error) {
    logError('Error submitting anonymous fit check:', error);
    console.error('Full error details:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Save fit check
const saveFitCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const { saved, savedAt } = req.body;
    const userId = req.user.id;

    const fitCheck = await FitCheck.findOneAndUpdate(
      { _id: id, userId },
      { 
        saved: saved || true,
        savedAt: savedAt || new Date().toISOString()
      },
      { new: true }
    );

    if (!fitCheck) {
      return res.status(404).json({ error: 'Fit check not found' });
    }

    // Track analytics
    analyticsService.trackEvent({
      userId,
      sessionId: req.sessionId || 'authenticated',
      eventType: 'feature_usage',
      category: 'fit_check',
      action: 'fit_check_saved',
      properties: {
        rating: fitCheck.rating,
        eventContext: fitCheck.eventContext
      }
    });

    logInfo(`Fit check saved for user ${userId}, fit check ID: ${id}`);

    res.json({ success: true, fitCheck });
  } catch (error) {
    logError('Error saving fit check:', error);
    res.status(500).json({ error: 'Failed to save fit check' });
  }
};

module.exports = {
  submitFitCheck,
  submitAnonymousFitCheck,
  getFitCheckHistory,
  getFitCheck,
  updateFitCheckResponse,
  deleteFitCheck,
  updateFitCheckNotes,
  saveFitCheck
}; 