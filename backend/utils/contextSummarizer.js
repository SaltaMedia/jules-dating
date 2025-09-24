const { OpenAI } = require('openai');
const UserProfile = require('../models/UserProfile');

// Lazy-load OpenAI client
let openai = null;
const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found - context summarization disabled');
      return null;
    }
    
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 10000
    });
  }
  return openai;
};

/**
 * Context Summarizer for Jules-Style-App
 * Generates cost-effective context summaries using single GPT-4o-mini call
 */
class ContextSummarizer {
  
  /**
   * Generate a comprehensive context summary for a user
   * This is called once per session or when meaningful changes occur
   */
  static async generateContextSummary(userId) {
    try {
      const openaiClient = getOpenAI();
      if (!openaiClient) {
        console.log('OpenAI not available - skipping context summarization');
        return null;
      }

      const profile = await UserProfile.findOne({ userId });
      if (!profile) {
        console.log(`No profile found for user ${userId}`);
        return null;
      }

      // Build raw context data
      const contextData = this.buildContextData(profile);
      
      // Generate summary using single API call
      const summary = await this.generateSummaryWithAI(contextData);
      
      // Extract key preferences for quick access
      const keyPreferences = this.extractKeyPreferences(contextData);
      
      return {
        summary,
        keyPreferences,
        confidence: 0.9, // High confidence for AI-generated summaries
        version: (profile.contextSummary?.version || 0) + 1
      };
      
    } catch (error) {
      console.error('Error generating context summary:', error);
      return null;
    }
  }

  /**
   * Build context data from user profile
   */
  static buildContextData(profile) {
    return {
      name: profile.name,
      aboutMe: profile.aboutMe,
      bodyInfo: profile.bodyInfo,
      styleProfile: profile.styleProfile,
      lifestyle: profile.lifestyle,
      wardrobe: profile.wardrobe,
      investment: profile.investment,
      learningData: profile.learningData || {}
    };
  }

  /**
   * Generate AI summary of user context
   */
  static async generateSummaryWithAI(contextData) {
    const prompt = `Create a concise, natural summary of this user's style preferences and personality for Jules, a men's style assistant. Focus on the most important details that Jules should remember.

USER DATA:
${JSON.stringify(contextData, null, 2)}

Generate a 2-3 sentence summary that captures:
1. Their style personality and preferences
2. Key lifestyle factors that affect their clothing choices
3. Important details about their body type, budget, and environments
4. Any specific preferences or dislikes

Make it conversational and natural, as if Jules is remembering a friend's preferences.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3
    });

    return response.choices[0].message.content.trim();
  }

  /**
   * Extract key preferences for quick access
   */
  static extractKeyPreferences(contextData) {
    return {
      style: contextData.styleProfile?.preferredStyles || [],
      colors: [
        ...(contextData.styleProfile?.colorsLove || []),
        ...(contextData.styleProfile?.colorsAvoid || [])
      ],
      brands: contextData.styleProfile?.favoriteBrands || [],
      budget: contextData.lifestyle?.monthlyClothingBudget || '$100–$250',
      bodyType: contextData.bodyInfo?.bodyType || 'Average',
      environments: contextData.lifestyle?.primaryEnvironments || []
    };
  }

  /**
   * Check if context summary needs updating
   */
  static needsUpdate(profile) {
    if (!profile.contextSummary) {
      return true;
    }

    const lastGenerated = profile.contextSummary.lastGenerated;
    if (!lastGenerated) {
      return true;
    }

    // Update if older than 24 hours
    const hoursSinceUpdate = (Date.now() - new Date(lastGenerated).getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate > 24) {
      return true;
    }

    // Update if confidence is low
    if (profile.contextSummary.confidence < 0.7) {
      return true;
    }

    return false;
  }

  /**
   * Update context summary if needed
   */
  static async updateContextSummaryIfNeeded(userId) {
    try {
      const profile = await UserProfile.findOne({ userId });
      if (!profile) {
        return null;
      }

      if (this.needsUpdate(profile)) {
        console.log(`Updating context summary for user ${userId}`);
        
        const newSummary = await this.generateContextSummary(userId);
        if (newSummary) {
          profile.contextSummary = {
            ...newSummary,
            lastGenerated: new Date()
          };
          await profile.save();
          
          console.log(`Context summary updated for user ${userId}`);
          return newSummary;
        }
      }

      return profile.contextSummary;
    } catch (error) {
      console.error('Error updating context summary:', error);
      return null;
    }
  }
}

module.exports = ContextSummarizer;
