const { OpenAI } = require('openai');

// Lazy-load OpenAI client to ensure dotenv is loaded first
let openai = null;
const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found - AI context analysis will be disabled');
      return null;
    }
    
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 10000
    });
  }
  return openai;
};

class AIContextAnalyzer {
  static async analyzeUserContext(userId, conversationHistory = [], userProfile = null) {
    try {
      const openaiClient = getOpenAI();
      if (!openaiClient) {
        console.log('OpenAI not available - returning default analysis');
        return {
          userStyle: "classic",
          conversationTone: "friendly",
          contextualNeeds: ["general advice"],
          recommendationStyle: "balanced"
        };
      }

      const prompt = `Analyze this user context and provide insights in JSON format:

USER ID: ${userId}

CONVERSATION HISTORY (last 5 messages):
${(conversationHistory || []).slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

USER PROFILE:
${JSON.stringify(userProfile || {}, null, 2)}

Provide analysis in this JSON format:
{
  "userStyle": "brief description of user's style preferences",
  "conversationTone": "casual|formal|friendly|professional",
  "contextualNeeds": ["list", "of", "current", "needs"],
  "recommendationStyle": "how to approach recommendations"
}`;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      
      // Strip markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('Error analyzing user context:', error);
      return {
        userStyle: "classic",
        conversationTone: "friendly",
        contextualNeeds: ["general advice"],
        recommendationStyle: "balanced"
      };
    }
  }

  static async analyzeFitCheckRating(feedback) {
    try {
      const openaiClient = getOpenAI();
      if (!openaiClient) {
        console.log('OpenAI not available - returning default fit check rating');
        return { overallRating: 5, ratingReason: "default", confidence: "low" };
      }

      const prompt = `Analyze this fit check feedback and extract the rating in JSON format:

FEEDBACK:
${feedback}

Extract the overall rating (1-10) and provide analysis in this JSON format:
{
  "overallRating": 5,
  "ratingReason": "brief explanation of rating",
  "confidence": "high|medium|low"
}`;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.1
      });

      const content = response.choices[0].message.content;
      
      // Strip markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('Error analyzing fit check rating:', error);
      return { overallRating: 5, ratingReason: "default", confidence: "low" };
    }
  }

  static async analyzeEventContext(event, weather, userPreferences) {
    try {
      const openaiClient = getOpenAI();
      if (!openaiClient) {
        console.log('OpenAI not available - returning default event analysis');
        return {
          formality: "casual",
          weatherConsiderations: ["temperature"],
          styleGuidance: "comfortable and appropriate",
          keyItems: ["versatile pieces"]
        };
      }

      const prompt = `Analyze this event context and provide outfit recommendations in JSON format:

EVENT: ${event}
WEATHER: ${weather}
USER PREFERENCES: ${JSON.stringify(userPreferences)}

Provide analysis in this JSON format:
{
  "formality": "casual|smart-casual|business|formal",
  "weatherConsiderations": ["list", "of", "weather", "factors"],
  "styleGuidance": "specific style advice",
  "keyItems": ["essential", "items", "needed"]
}`;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      
      // Strip markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('Error analyzing event context:', error);
      return {
        formality: "casual",
        weatherConsiderations: ["temperature"],
        styleGuidance: "comfortable and appropriate",
        keyItems: ["versatile pieces"]
      };
    }
  }

  static async generateDynamicError(userContext, errorType) {
    try {
      const openaiClient = getOpenAI();
      if (!openaiClient) {
        console.log('OpenAI not available - returning default error message');
        return {
          message: "Something went wrong. Please try again.",
          suggestion: "Check your connection and try again.",
          tone: "friendly"
        };
      }

      const prompt = `Generate a helpful error message for this context in JSON format:

ERROR TYPE: ${errorType}
USER CONTEXT: ${JSON.stringify(userContext)}

Provide a user-friendly error message in this JSON format:
{
  "message": "helpful error message",
  "suggestion": "what user can do to fix it",
  "tone": "friendly|encouraging|direct"
}`;

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      
      // Strip markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('Error generating dynamic error:', error);
      return {
        message: "Something went wrong. Please try again.",
        suggestion: "Check your connection and try again.",
        tone: "friendly"
      };
    }
  }
}

module.exports = AIContextAnalyzer;

