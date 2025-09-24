const { OpenAI } = require('openai');
const UserProfile = require('../models/UserProfile');

// Lazy-load OpenAI client to ensure dotenv is loaded first
let openai = null;
const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found - learning system will be disabled');
      return null;
    }
    
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 10000 // 10 second timeout
    });
  }
  return openai;
};

/**
 * Conversation Learning System for Jules-Style-App
 * Extracts insights from chat interactions to enhance user profiles
 * CONTEXT-AWARE: Respects topic switching and doesn't interfere with context changes
 */
class ConversationLearning {
  
  /**
   * Extract learning insights from a conversation with context awareness
   */
  static async extractInsights(userId, message, conversationHistory = []) {
    try {
      // Check if OpenAI is available
      const openaiClient = getOpenAI();
      if (!openaiClient) {
        console.log('OpenAI not available - skipping learning');
        return null;
      }

      // === CONTEXT AWARENESS CHECK ===
      const currentTopic = this.detectCurrentTopic(message);
      const recentTopics = this.getRecentTopics(conversationHistory.slice(-5));
      
      // Only learn if we're not in a major context switch
      if (this.isContextSwitch(currentTopic, recentTopics)) {
        console.log('Context switch detected - skipping learning for this message');
        return null;
      }

      // === BATCH PROCESSING - Process multiple insights together ===
      const insights = {
        styleInsights: {},
        lifestyleInsights: {},
        emotionalInsights: {},
        behavioralInsights: {},
        contextInfo: {
          currentTopic,
          recentTopics,
          isContextSwitch: false
        },
        confidence: 0.0, // Will be calculated based on insight quality
        batchInsights: [] // Store multiple insights for batch processing
      };

      // Extract all insights in a single batch call for efficiency
      const batchInsights = await this.extractBatchInsights(message, conversationHistory, currentTopic);
      
      if (batchInsights) {
        insights.styleInsights = batchInsights.styleInsights || {};
        insights.lifestyleInsights = batchInsights.lifestyleInsights || {};
        insights.emotionalInsights = batchInsights.emotionalInsights || {};
        insights.behavioralInsights = batchInsights.behavioralInsights || {};
        insights.confidence = batchInsights.confidence || 0.0;
        insights.batchInsights = batchInsights.batchInsights || [];
      }

      // Only return insights if confidence is high enough
      if (insights.confidence < 0.7) {
        console.log(`Learning confidence too low (${insights.confidence}) - skipping insights`);
        return null;
      }

      return insights;
    } catch (error) {
      console.error('Error extracting conversation insights:', error);
      return null;
    }
  }

  /**
   * Extract multiple insights in a single batch call for cost efficiency
   */
  static async extractBatchInsights(message, conversationHistory, currentTopic) {
    try {
      const openaiClient = getOpenAI();
      if (!openaiClient) return null;

      const recentMessages = conversationHistory.slice(-6);
      const contextText = recentMessages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Jules'}: ${msg.content}`
      ).join('\n');

      const prompt = `Analyze this conversation for user insights. Extract multiple insights in a single response.

CONVERSATION CONTEXT:
${contextText}

CURRENT MESSAGE: "${message}"
CURRENT TOPIC: ${currentTopic}

Extract insights in this JSON format:
{
  "styleInsights": {
    "newPreferences": ["list", "of", "new", "style", "preferences"],
    "colorPreferences": ["colors", "mentioned", "positively"],
    "colorDislikes": ["colors", "mentioned", "negatively"],
    "brandPreferences": ["brands", "mentioned", "positively"],
    "fitPreferences": ["fit", "preferences", "mentioned"],
    "confidence": 0.8
  },
  "lifestyleInsights": {
    "activities": ["activities", "mentioned"],
    "environments": ["environments", "mentioned"],
    "socialPatterns": ["social", "patterns", "observed"],
    "confidence": 0.8
  },
  "emotionalInsights": {
    "confidenceLevel": "high|medium|low",
    "stressLevel": "high|medium|low",
    "mood": "positive|neutral|negative",
    "confidence": 0.8
  },
  "behavioralInsights": {
    "communicationStyle": "direct|casual|formal",
    "decisionStyle": "impulsive|thoughtful|analytical",
    "learningPreference": "examples|direct|detailed",
    "confidence": 0.8
  },
  "overallConfidence": 0.8
}

Only include insights with confidence > 0.7. If no confident insights, return null.`;

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const insights = JSON.parse(cleanContent);
      
      // Calculate overall confidence
      const confidences = [
        insights.styleInsights?.confidence || 0,
        insights.lifestyleInsights?.confidence || 0,
        insights.emotionalInsights?.confidence || 0,
        insights.behavioralInsights?.confidence || 0
      ].filter(c => c > 0);
      
      insights.confidence = confidences.length > 0 ? 
        confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;

      return insights;
    } catch (error) {
      console.error('Error in batch insight extraction:', error);
      return null;
    }
  }

  /**
   * Detect the current topic from the user's message
   */
  static detectCurrentTopic(message) {
    const messageLower = message.toLowerCase();
    
    // Topic detection patterns
    const topicPatterns = {
      formal: /(wedding|interview|business|formal|suit|tie|dress|ceremony)/i,
      casual: /(casual|weekend|everyday|comfortable|relaxed)/i,
      athletic: /(gym|workout|exercise|athletic|sports|running|fitness)/i,
      dating: /(date|dating|romantic|girlfriend|relationship|crush)/i,
      nightlife: /(night|club|bar|party|going out|evening)/i,
      outdoor: /(hiking|camping|outdoor|adventure|nature)/i,
      work: /(office|work|job|professional|career)/i,
      travel: /(travel|vacation|trip|airport|hotel)/i
    };

    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(messageLower)) {
        return topic;
      }
    }
    
    return 'general';
  }

  /**
   * Get recent topics from conversation history
   */
  static getRecentTopics(messages) {
    const topics = [];
    for (const msg of messages) {
      if (msg.role === 'user') {
        const topic = this.detectCurrentTopic(msg.content);
        if (topic !== 'general') {
          topics.push(topic);
        }
      }
    }
    return topics;
  }

  /**
   * Check if this is a context switch
   */
  static isContextSwitch(currentTopic, recentTopics) {
    if (recentTopics.length === 0) return false;
    
    // If current topic is completely different from recent topics, it's a context switch
    const recentTopicSet = new Set(recentTopics);
    if (!recentTopicSet.has(currentTopic) && currentTopic !== 'general') {
      return true;
    }
    
    return false;
  }

  /**
   * Extract style-related insights from conversation (topic-aware)
   */
  static async extractStyleInsights(message, conversationHistory, currentTopic) {
    try {
      const context = conversationHistory.length > 0 
        ? `Previous conversation: ${conversationHistory.slice(-3).map(msg => msg.content).join(' ')}`
        : '';
      
      const prompt = `Analyze this user message and extract style preferences. Return JSON only:

User message: "${message}"
${context}
Current topic: ${currentTopic}

IMPORTANT: Only extract preferences that are GENERAL and not specific to the current topic.
For example, if they're asking about gym clothes but mention they love olive green, 
extract "olive green" as a general color preference, not a gym-specific preference.

Extract and return ONLY a JSON object:
{
  "newStylePreferences": ["array of GENERAL style preferences mentioned"],
  "colorPreferences": ["colors they like or dislike (general)"],
  "brandPreferences": ["brands they mention positively or negatively"],
  "fitPreferences": ["slim", "relaxed", "tailored", etc.],
  "occasionPreferences": ["work", "dates", "casual", "formal", "gym", "travel"],
  "budgetIndicators": "budget|mid-range|premium|luxury",
  "styleChanges": ["any GENERAL style evolution mentioned"],
  "topicSpecificPreferences": {
    "topic": "${currentTopic}",
    "preferences": ["preferences specific to this topic only"]
  }
}

If no relevant information found, use empty arrays or null.`;

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Style insights extraction failed:', error);
      return {};
    }
  }

  /**
   * Extract lifestyle patterns from conversation (topic-aware)
   */
  static async extractLifestyleInsights(message, conversationHistory, currentTopic) {
    try {
      const context = conversationHistory.length > 0 
        ? `Previous conversation: ${conversationHistory.slice(-3).map(msg => msg.content).join(' ')}`
        : '';
      
      const prompt = `Analyze this user message and extract lifestyle information. Return JSON only:

User message: "${message}"
${context}
Current topic: ${currentTopic}

IMPORTANT: Only extract GENERAL lifestyle information, not topic-specific details.
For example, if they're asking about gym clothes and mention they go to the gym 3x/week,
extract "gym" as a general activity, not just for this specific conversation.

Extract and return ONLY a JSON object:
{
  "activities": ["GENERAL activities they mention doing"],
  "environments": ["work", "outdoors", "nightlife", "gym", "travel", "home"],
  "socialPatterns": ["how they socialize (general)"],
  "datingStatus": "single|dating|relationship|married",
  "locationContext": "city/area if mentioned",
  "timeConstraints": "busy|moderate|flexible",
  "lifestyleChanges": ["any GENERAL lifestyle changes mentioned"]
}

If no relevant information found, use empty arrays or null.`;

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 400
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Lifestyle insights extraction failed:', error);
      return {};
    }
  }

  /**
   * Extract emotional patterns from conversation (topic-aware)
   */
  static async extractEmotionalInsights(message, conversationHistory, currentTopic) {
    try {
      const context = conversationHistory.length > 0 
        ? `Previous conversation: ${conversationHistory.slice(-3).map(msg => msg.content).join(' ')}`
        : '';
      
      const prompt = `Analyze this user message and extract emotional patterns. Return JSON only:

User message: "${message}"
${context}
Current topic: ${currentTopic}

IMPORTANT: Distinguish between topic-specific emotions and general emotional patterns.
For example, if they're anxious about a specific date, that's topic-specific.
If they generally show low confidence in social situations, that's a general pattern.

Extract and return ONLY a JSON object:
{
  "currentMood": "confident|anxious|excited|frustrated|neutral",
  "confidenceLevel": "low|medium|high",
  "stressLevel": "low|medium|high",
  "socialComfort": "low|medium|high",
  "datingMindset": "active|passive|avoidant|confident",
  "emotionalTriggers": ["what affects their mood (general)"],
  "copingPatterns": ["how they handle challenges (general)"],
  "topicSpecificEmotions": {
    "topic": "${currentTopic}",
    "emotions": ["emotions specific to this topic only"]
  }
}

If no relevant information found, use null or empty arrays.`;

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Emotional insights extraction failed:', error);
      return {};
    }
  }

  /**
   * Extract behavioral patterns from conversation history (topic-aware)
   */
  static async extractBehavioralInsights(conversationHistory, currentTopic) {
    try {
      if (conversationHistory.length < 3) return {};

      const recentMessages = conversationHistory.slice(-10);
      const messageText = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

      const prompt = `Analyze this conversation history and identify behavioral patterns. Return JSON only:

Conversation:
${messageText}
Current topic: ${currentTopic}

IMPORTANT: Focus on GENERAL behavioral patterns, not topic-specific behaviors.
For example, if they ask short questions, that's a general communication pattern.
If they're indecisive about this specific topic, that might be topic-specific.

Extract and return ONLY a JSON object:
{
  "communicationStyle": {
    "responseLength": "short|medium|long",
    "questionFrequency": "high|medium|low",
    "topicSwitching": "frequent|moderate|rare",
    "engagementLevel": "high|medium|low"
  },
  "decisionMaking": {
    "decisionStyle": "impulsive|thoughtful|indecisive",
    "riskTolerance": "high|medium|low",
    "needForValidation": "high|medium|low"
  },
  "learningStyle": {
    "prefersExamples": true/false,
    "prefersDirectAdvice": true/false,
    "prefersExploration": true/false
  },
  "topicSpecificBehaviors": {
    "topic": "${currentTopic}",
    "behaviors": ["behaviors specific to this topic only"]
  }
}`;

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 400
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Behavioral insights extraction failed:', error);
      return {};
    }
  }

  /**
   * Extract outfit pieces that Jules recommends from conversation
   * This helps with contextual image recommendations
   */
  static async extractOutfitRecommendations(message, conversationHistory = []) {
    try {
      const context = conversationHistory.length > 0 
        ? `Previous conversation: ${conversationHistory.slice(-5).map(msg => msg.content).join(' ')}`
        : '';
      
      const prompt = `Analyze this conversation and extract specific outfit pieces that Jules recommended. Return JSON only:

User message: "${message}"
${context}

IMPORTANT: Extract ONLY the specific clothing items that Jules actually recommended to the user.
Focus on concrete pieces like "dark jeans", "white sneakers", "bomber jacket", etc.
Do NOT include generic advice or general style tips.

Extract and return ONLY a JSON object:
{
  "recommendedOutfitPieces": [
    {
      "item": "specific clothing item (e.g., 'dark jeans', 'white sneakers')",
      "context": "why it was recommended (e.g., 'for concert date')",
      "timestamp": "current timestamp"
    }
  ],
  "styleDescriptors": [
    "specific style terms used (e.g., 'casual', 'smart casual', 'fitted')"
  ],
  "colorPreferences": [
    "specific colors mentioned (e.g., 'navy', 'white', 'black')"
  ],
  "occasion": "specific occasion if mentioned (e.g., 'concert date', 'work meeting')",
  "brands": [
    "specific brands mentioned (e.g., 'Taylor Stitch', 'Uniqlo')"
  ]
}

If no specific outfit pieces were recommended, return empty arrays.`;

      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      });

      const result = JSON.parse(completion.choices[0].message.content);
      
      // Add timestamp to each outfit piece
      if (result.recommendedOutfitPieces) {
        result.recommendedOutfitPieces.forEach(piece => {
          piece.timestamp = Date.now();
        });
      }

      return result;
    } catch (error) {
      console.error('Outfit recommendations extraction failed:', error);
      return {
        recommendedOutfitPieces: [],
        styleDescriptors: [],
        colorPreferences: [],
        occasion: null,
        brands: []
      };
    }
  }

  /**
   * Get contextual outfit recommendations for image search
   * Uses stored outfit pieces to generate relevant image queries
   */
  static async getContextualOutfitRecommendations(userId, currentMessage) {
    try {
      const profile = await UserProfile.findOne({ userId });
      if (!profile || !profile.learningData?.outfitRecommendations) {
        return null;
      }

      const outfitHistory = profile.learningData.outfitRecommendations;
      const recentRecommendations = outfitHistory
        .filter(rec => Date.now() - rec.timestamp < 7 * 24 * 60 * 60 * 1000) // Last 7 days
        .slice(-5); // Last 5 recommendations

      if (recentRecommendations.length === 0) {
        return null;
      }

      // Build contextual query based on recent recommendations
      const outfitPieces = recentRecommendations
        .map(rec => rec.item)
        .filter((item, index, arr) => arr.indexOf(item) === index); // Remove duplicates

      const styleDescriptors = recentRecommendations
        .flatMap(rec => rec.styleDescriptors || [])
        .filter((desc, index, arr) => arr.indexOf(desc) === index);

      const colors = recentRecommendations
        .flatMap(rec => rec.colorPreferences || [])
        .filter((color, index, arr) => arr.indexOf(color) === index);

      return {
        outfitPieces,
        styleDescriptors,
        colors,
        recentRecommendations,
        searchQuery: this.buildContextualSearchQuery(outfitPieces, styleDescriptors, colors, currentMessage)
      };
    } catch (error) {
      console.error('Error getting contextual outfit recommendations:', error);
      return null;
    }
  }

  /**
   * Build contextual search query for image recommendations
   */
  static buildContextualSearchQuery(outfitPieces, styleDescriptors, colors, currentMessage) {
    const messageLower = currentMessage.toLowerCase();
    
    // Detect if user is asking for images/examples
    const isImageRequest = /(show|pics|pictures|images|examples|visual)/i.test(currentMessage);
    
    if (!isImageRequest) {
      return null;
    }

    // Build query based on recent recommendations
    let queryParts = ["men's fashion"];
    
    // Add specific outfit pieces (most important)
    if (outfitPieces.length > 0) {
      queryParts.push(outfitPieces.slice(0, 3).join(' '));
    }
    
    // Add style descriptors
    if (styleDescriptors.length > 0) {
      queryParts.push(styleDescriptors[0]);
    }
    
    // Add colors
    if (colors.length > 0) {
      queryParts.push(colors[0]);
    }
    
    // Add "outfit" to make it clear we want complete looks
    queryParts.push("outfit inspiration");
    
    return queryParts.join(' ');
  }

  /**
   * Update user profile with conversation insights (context-aware)
   */
  static async updateProfileWithInsights(userId, insights) {
    try {
      // Skip update if this was a context switch
      if (insights.contextInfo?.isContextSwitch) {
        console.log('Skipping profile update due to context switch');
        return false;
      }

      // Skip update if confidence is too low
      if (insights.confidence < 0.7) {
        console.log(`Skipping profile update due to low confidence (${insights.confidence})`);
        return false;
      }

      const profile = await UserProfile.findOne({ userId });
      if (!profile) return false;

      let updated = false;
      let meaningfulChange = false;

      // Initialize learningData if it doesn't exist
      if (!profile.learningData) {
        profile.learningData = {
          outfitRecommendations: [],
          styleInsights: [],
          behavioralPatterns: []
        };
      }

      // Store outfit recommendations for contextual image search
      if (insights.outfitRecommendations && insights.outfitRecommendations.recommendedOutfitPieces?.length > 0) {
        const newRecommendations = insights.outfitRecommendations.recommendedOutfitPieces.map(piece => ({
          item: piece.item,
          context: piece.context,
          timestamp: piece.timestamp,
          styleDescriptors: insights.outfitRecommendations.styleDescriptors || [],
          colorPreferences: insights.outfitRecommendations.colorPreferences || [],
          occasion: insights.outfitRecommendations.occasion,
          brands: insights.outfitRecommendations.brands || []
        }));

        // Add new recommendations to the beginning of the array
        profile.learningData.outfitRecommendations = [
          ...newRecommendations,
          ...profile.learningData.outfitRecommendations
        ].slice(0, 20); // Keep only the last 20 recommendations

        updated = true;
        meaningfulChange = true;
        console.log(`Stored ${newRecommendations.length} outfit recommendations for user ${userId}`);
      }

      // Update style profile with new insights
      if (insights.styleInsights) {
        const styleInsights = insights.styleInsights;
        
        // Add new style preferences
        if (styleInsights.newPreferences && styleInsights.newPreferences.length > 0) {
          const currentStyles = profile.styleProfile?.preferredStyles || [];
          const newStyles = styleInsights.newPreferences.filter(style => 
            !currentStyles.includes(style)
          );
          
          if (newStyles.length > 0) {
            profile.styleProfile.preferredStyles = [...currentStyles, ...newStyles];
            updated = true;
            meaningfulChange = true;
            console.log(`Added new style preferences for user ${userId}:`, newStyles);
          }
        }

        // Add new color preferences
        if (styleInsights.colorPreferences && styleInsights.colorPreferences.length > 0) {
          const currentColors = profile.styleProfile?.colorsLove || [];
          const newColors = styleInsights.colorPreferences.filter(color => 
            !currentColors.includes(color)
          );
          
          if (newColors.length > 0) {
            profile.styleProfile.colorsLove = [...currentColors, ...newColors];
            updated = true;
            meaningfulChange = true;
            console.log(`Added new color preferences for user ${userId}:`, newColors);
          }
        }

        // Add new brand preferences
        if (styleInsights.brandPreferences && styleInsights.brandPreferences.length > 0) {
          const currentBrands = profile.styleProfile?.favoriteBrands || [];
          const newBrands = styleInsights.brandPreferences.filter(brand => 
            !currentBrands.includes(brand)
          );
          
          if (newBrands.length > 0) {
            profile.styleProfile.favoriteBrands = [...currentBrands, ...newBrands];
            updated = true;
            meaningfulChange = true;
            console.log(`Added new brand preferences for user ${userId}:`, newBrands);
          }
        }
      }

      // Update lifestyle insights
      if (insights.lifestyleInsights) {
        const lifestyleInsights = insights.lifestyleInsights;
        
        // Add new activities
        if (lifestyleInsights.activities && lifestyleInsights.activities.length > 0) {
          const currentActivities = profile.lifestyle?.topActivities || [];
          const newActivities = lifestyleInsights.activities.filter(activity => 
            !currentActivities.includes(activity)
          );
          
          if (newActivities.length > 0) {
            profile.lifestyle.topActivities = [...currentActivities, ...newActivities];
            updated = true;
            meaningfulChange = true;
            console.log(`Added new activities for user ${userId}:`, newActivities);
          }
        }

        // Add new environments
        if (lifestyleInsights.environments && lifestyleInsights.environments.length > 0) {
          const currentEnvironments = profile.lifestyle?.primaryEnvironments || [];
          const newEnvironments = lifestyleInsights.environments.filter(env => 
            !currentEnvironments.includes(env)
          );
          
          if (newEnvironments.length > 0) {
            profile.lifestyle.primaryEnvironments = [...currentEnvironments, ...newEnvironments];
            updated = true;
            meaningfulChange = true;
            console.log(`Added new environments for user ${userId}:`, newEnvironments);
          }
        }
      }

      // Save profile if updated
      if (updated) {
        await profile.save();
        console.log(`Profile updated for user ${userId}`);
      }

      // Trigger context summary update if meaningful changes occurred
      if (meaningfulChange) {
        console.log(`Meaningful changes detected for user ${userId} - triggering context summary update`);
        try {
          const ContextSummarizer = require('./contextSummarizer');
          await ContextSummarizer.generateContextSummary(userId);
          console.log(`Context summary updated for user ${userId}`);
        } catch (error) {
          console.error('Error updating context summary:', error);
        }
      }

      return updated;
    } catch (error) {
      console.error('Error updating profile with insights:', error);
      return false;
    }
  }

  /**
   * Generate adaptive response context based on user patterns (context-aware)
   */
  static async generateAdaptiveContext(userId, insights) {
    try {
      const adaptiveContext = {
        tone: 'balanced',
        focus: 'both',
        pace: 'moderate',
        detailLevel: 'medium',
        contextAwareness: {
          respectTopicSwitch: true,
          useGeneralPreferences: true,
          avoidTopicConfusion: true
        }
      };

      // Adjust tone based on emotional insights (general patterns only)
      if (insights.emotionalInsights) {
        const emotional = insights.emotionalInsights;
        
        // Only use general confidence patterns, not topic-specific emotions
        if (emotional.confidenceLevel === 'low' && !emotional.topicSpecificEmotions) {
          adaptiveContext.tone = 'supportive';
          adaptiveContext.focus = 'emotional';
        } else if (emotional.confidenceLevel === 'high' && !emotional.topicSpecificEmotions) {
          adaptiveContext.tone = 'challenging';
          adaptiveContext.focus = 'practical';
        }

        if (emotional.stressLevel === 'high' && !emotional.topicSpecificEmotions) {
          adaptiveContext.pace = 'slow';
          adaptiveContext.detailLevel = 'high';
        }
      }

      // Adjust based on behavioral insights (general patterns only)
      if (insights.behavioralInsights) {
        const behavioral = insights.behavioralInsights;
        
        if (behavioral.learningStyle?.prefersDirectAdvice) {
          adaptiveContext.focus = 'practical';
          adaptiveContext.detailLevel = 'low';
        } else if (behavioral.learningStyle?.prefersExploration) {
          adaptiveContext.focus = 'emotional';
          adaptiveContext.detailLevel = 'high';
        }

        if (behavioral.communicationStyle?.responseLength === 'short') {
          adaptiveContext.detailLevel = 'low';
        } else if (behavioral.communicationStyle?.responseLength === 'long') {
          adaptiveContext.detailLevel = 'high';
        }
      }

      return adaptiveContext;
    } catch (error) {
      console.error('Error generating adaptive context:', error);
      return {
        tone: 'balanced',
        focus: 'both',
        pace: 'moderate',
        detailLevel: 'medium',
        contextAwareness: {
          respectTopicSwitch: true,
          useGeneralPreferences: true,
          avoidTopicConfusion: true
        }
      };
    }
  }
}

module.exports = ConversationLearning; 