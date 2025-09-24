/**
 * Token Estimator for OpenAI API calls
 * Prevents TPM explosions by estimating token usage before API calls
 */

// Rough estimation: 1 token ≈ 4 characters for English text
const ESTIMATED_CHARS_PER_TOKEN = 4;

// Conservative estimates for different content types
const TOKEN_ESTIMATES = {
  systemPrompt: 0.25, // System prompts are more token-dense
  userMessage: 0.25,
  response: 0.25,
  context: 0.25,
  json: 0.3, // JSON is more token-dense
  code: 0.2  // Code is less token-dense
};

class TokenEstimator {
  /**
   * Estimate tokens for a given text
   * @param {string} text - The text to estimate
   * @param {string} type - Type of content (systemPrompt, userMessage, etc.)
   * @returns {number} Estimated token count
   */
  static estimate(text, type = 'userMessage') {
    if (!text || typeof text !== 'string') return 0;
    
    const multiplier = TOKEN_ESTIMATES[type] || TOKEN_ESTIMATES.userMessage;
    return Math.ceil((text.length / ESTIMATED_CHARS_PER_TOKEN) * multiplier);
  }

  /**
   * Estimate total tokens for a chat interaction
   * @param {Object} params - Chat parameters
   * @returns {Object} Token breakdown and total
   */
  static estimateChatTokens({
    systemPrompt = '',
    userMessage = '',
    conversationContext = [],
    maxResponseTokens = 800
  }) {
    const systemTokens = this.estimate(systemPrompt, 'systemPrompt');
    const userTokens = this.estimate(userMessage, 'userMessage');
    
    // Estimate context tokens (last 10 messages)
    const contextText = conversationContext
      .slice(-10)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    const contextTokens = this.estimate(contextText, 'context');
    
    const totalInputTokens = systemTokens + userTokens + contextTokens;
    const totalTokens = totalInputTokens + maxResponseTokens;
    
    return {
      systemTokens,
      userTokens,
      contextTokens,
      maxResponseTokens,
      totalInputTokens,
      totalTokens,
      breakdown: {
        system: systemTokens,
        user: userTokens,
        context: contextTokens,
        response: maxResponseTokens
      }
    };
  }

  /**
   * Check if a request would exceed token limits
   * @param {Object} params - Chat parameters
   * @param {number} maxTokens - Maximum allowed tokens (default: 1000)
   * @returns {Object} Validation result
   */
  static validateRequest(params, maxTokens = 1000) {
    const estimation = this.estimateChatTokens(params);
    
    return {
      isValid: estimation.totalTokens <= maxTokens,
      estimation,
      exceedsBy: Math.max(0, estimation.totalTokens - maxTokens),
      recommendation: estimation.totalTokens > maxTokens 
        ? `Request exceeds limit by ${estimation.totalTokens - maxTokens} tokens. Consider reducing context or response length.`
        : 'Request is within limits.'
    };
  }

  /**
   * Get optimization suggestions for a request
   * @param {Object} estimation - Token estimation result
   * @returns {Array} Array of optimization suggestions
   */
  static getOptimizationSuggestions(estimation) {
    const suggestions = [];
    
    if (estimation.systemTokens > 200) {
      suggestions.push('Consider shortening system prompt');
    }
    
    if (estimation.contextTokens > 300) {
      suggestions.push('Reduce conversation context (keep only last 5-6 messages)');
    }
    
    if (estimation.maxResponseTokens > 600) {
      suggestions.push('Reduce max response tokens to 400-600');
    }
    
    if (estimation.totalTokens > 1200) {
      suggestions.push('Consider breaking into multiple smaller requests');
    }
    
    return suggestions;
  }
}

module.exports = TokenEstimator;
