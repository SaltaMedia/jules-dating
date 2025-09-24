/**
 * Product Result Cache
 * Caches product search results to reduce OpenAI API calls and improve performance
 */

const crypto = require('crypto');

class ProductCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000; // Maximum number of cached entries
    this.ttl = 30 * 60 * 1000; // 30 minutes TTL
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      tokensSaved: 0
    };
  }

  /**
   * Generate cache key from search parameters
   * @param {string} message - User message
   * @param {Array} conversationMessages - Conversation context
   * @param {Object} userContext - User profile context
   * @returns {string} Cache key
   */
  generateCacheKey(message, conversationMessages = [], userContext = null) {
    // Create a normalized version of the search parameters
    const normalizedMessage = message.toLowerCase().trim();
    
    // Extract key context from conversation (last 3 messages)
    const recentContext = conversationMessages.slice(-3).map(msg => 
      `${msg.role}: ${(msg.content || '').toLowerCase().trim()}`
    ).join('|');
    
    // Include relevant user context (budget, style preferences)
    const userContextKey = userContext ? 
      `${userContext.lifestyle?.monthlyClothingBudget || ''}|${userContext.style?.preferred?.join(',') || ''}` : '';
    
    // Create hash of all parameters
    const cacheString = `${normalizedMessage}|${recentContext}|${userContextKey}`;
    return crypto.createHash('md5').update(cacheString).digest('hex');
  }

  /**
   * Get cached result
   * @param {string} key - Cache key
   * @returns {Object|null} Cached result or null
   */
  get(key) {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    console.log(`🎯 Cache HIT for key: ${key.substring(0, 8)}...`);
    return entry.data;
  }

  /**
   * Set cached result
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} estimatedTokens - Estimated tokens saved
   */
  set(key, data, estimatedTokens = 0) {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const entry = {
      data: data,
      timestamp: Date.now(),
      estimatedTokens: estimatedTokens
    };

    this.cache.set(key, entry);
    this.stats.tokensSaved += estimatedTokens;
    
    console.log(`💾 Cache SET for key: ${key.substring(0, 8)}... (${estimatedTokens} tokens saved)`);
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 ? 
      (this.stats.hits / this.stats.totalRequests * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      tokensSaved: 0
    };
    console.log('🗑️ Cache cleared');
  }

  /**
   * Estimate tokens saved for a typical product search
   * @param {string} message - User message
   * @param {Array} conversationMessages - Conversation context
   * @returns {number} Estimated tokens
   */
  estimateTokensSaved(message, conversationMessages = []) {
    // Rough estimation based on message length and context
    const messageTokens = Math.ceil(message.length / 4);
    const contextTokens = conversationMessages.length * 50; // ~50 tokens per message
    const systemPromptTokens = 200; // Estimated system prompt tokens
    const responseTokens = 500; // Estimated response tokens
    
    return messageTokens + contextTokens + systemPromptTokens + responseTokens;
  }
}

// Create singleton instance
const productCache = new ProductCache();

module.exports = {
  productCache,
  ProductCache
};
