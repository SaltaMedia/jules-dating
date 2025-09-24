/**
 * Token Logger for OpenAI API calls
 * Logs token usage for debugging and optimization
 */

class TokenLogger {
  static logApiCall({
    endpoint,
    model,
    promptTokens,
    maxOutputTokens,
    actualOutputTokens,
    totalTokens,
    cost,
    duration
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      model,
      tokens: {
        prompt: promptTokens,
        maxOutput: maxOutputTokens,
        actualOutput: actualOutputTokens,
        total: totalTokens
      },
      cost: cost || 'unknown',
      duration: duration || 'unknown'
    };

    console.log('🔢 TOKEN USAGE:', JSON.stringify(logEntry, null, 2));
    
    // Also log to file if needed
    // fs.appendFileSync('token-usage.log', JSON.stringify(logEntry) + '\n');
  }

  static estimateCost(totalTokens, model = 'gpt-4o-mini') {
    const costs = {
      'gpt-4o': 0.00003, // $0.03 per 1K tokens
      'gpt-4o-mini': 0.00015, // $0.15 per 1K tokens
      'gpt-4-vision-preview': 0.00001 // $0.01 per 1K tokens
    };
    
    const costPer1K = costs[model] || costs['gpt-4o-mini'];
    return (totalTokens / 1000) * costPer1K;
  }

  static logResponse(response, endpoint, model, startTime) {
    const duration = Date.now() - startTime;
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    const totalTokens = response.usage?.total_tokens || 0;
    const cost = this.estimateCost(totalTokens, model);

    this.logApiCall({
      endpoint,
      model,
      promptTokens,
      maxOutputTokens: 'unknown',
      actualOutputTokens: completionTokens,
      totalTokens,
      cost: `$${cost.toFixed(6)}`,
      duration: `${duration}ms`
    });
  }
}

module.exports = TokenLogger;
