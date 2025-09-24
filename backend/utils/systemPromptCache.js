/**
 * System Prompt Cache
 * Caches system prompts to avoid regenerating them for every request
 */

class SystemPromptCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Maximum number of cached prompts
    this.ttl = 30 * 60 * 1000; // 30 minutes TTL
  }

  /**
   * Generate cache key for a user
   * @param {string} userId - User ID
   * @param {number} tone - User's tone preference
   * @param {string} intent - Current intent
   * @returns {string} Cache key
   */
  generateKey(userId, tone, intent) {
    return `${userId}-${tone}-${intent}`;
  }

  /**
   * Get cached system prompt
   * @param {string} userId - User ID
   * @param {number} tone - User's tone preference
   * @param {string} intent - Current intent
   * @returns {string|null} Cached prompt or null
   */
  get(userId, tone, intent) {
    const key = this.generateKey(userId, tone, intent);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.prompt;
  }

  /**
   * Set cached system prompt
   * @param {string} userId - User ID
   * @param {number} tone - User's tone preference
   * @param {string} intent - Current intent
   * @param {string} prompt - System prompt to cache
   */
  set(userId, tone, intent, prompt) {
    const key = this.generateKey(userId, tone, intent);
    
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      prompt,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for a specific user (when their profile changes)
   * @param {string} userId - User ID
   */
  clearUser(userId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}-`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

// Export singleton instance
module.exports = new SystemPromptCache();
