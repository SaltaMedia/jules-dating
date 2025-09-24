const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const { buildJulesContext } = require('./contextBuilder');
const { logInfo, logWarn } = require('./logger');

// In-memory cache for user context
const userContextCache = new Map();

// Cache TTL (Time To Live) - set to 24 hours for better performance
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class UserContextCache {
  static async getUserContext(userId) {
    if (!userId || userId === 'anonymous' || userId === 'test') {
      return '';
    }

    // Check if we have cached context
    const cached = userContextCache.get(userId);
    if (cached && !this.isExpired(cached.timestamp)) {
      logInfo(`Using cached user context for ${userId}`);
      return cached.context;
    }

    // Build fresh context
    const context = await this.buildUserContext(userId);
    
    // Cache it
    userContextCache.set(userId, {
      context,
      timestamp: Date.now()
    });

    logInfo(`Cached fresh user context for ${userId}`);
    return context;
  }

  /**
   * Get user context with ultra-lightweight learning flag
   * Only adds a single line when learning has occurred recently
   */
  static async getUserContextWithLearning(userId, message = '') {
    // Get base context (cached)
    const baseContext = await this.getUserContext(userId);
    
    // Only add learning flag if user asks about preferences/settings
    if (message.toLowerCase().includes('preferences') || message.toLowerCase().includes('settings') || message.toLowerCase().includes('onboarding')) {
      const hasRecentLearning = await this.hasRecentLearning(userId);
      if (hasRecentLearning) {
        return `${baseContext}\n\nLEARNING: Recent insights available`;
      }
    }
    
    return baseContext;
  }

  /**
   * Check if user has recent learning insights (ultra-lightweight)
   */
  static async hasRecentLearning(userId) {
    try {
      const profile = await UserProfile.findOne({ userId });
      if (!profile?.styleProfile?.lastUpdated) return false;
      
      // Check if profile was updated in last 24 hours
      const hoursSinceUpdate = (Date.now() - new Date(profile.styleProfile.lastUpdated).getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate <= 24;
    } catch (error) {
      return false;
    }
  }

  static async buildUserContext(userId) {
    let userContext = '';

    try {
      // Check if MongoDB is connected before making queries
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        logWarn(`MongoDB not connected (state: ${mongoose.connection.readyState}) - skipping user context`);
        return '';
      }

      // Get both user data and learning insights in parallel
      const [user, userProfile] = await Promise.all([
        User.findById(userId).select('name onboarding'),
        UserProfile.findOne({ userId }).select('learningData styleProfile')
      ]);
      
      // Build base context from onboarding data
      if (user && user.onboarding) {
        userContext = UserContextCache.formatLegacyContext(user);
      }

      // Add learning insights if available
      if (userProfile && userProfile.learningData) {
        const learningContext = UserContextCache.formatLearningContext(userProfile.learningData);
        if (learningContext) {
          userContext += learningContext;
        }
      }

      // Add dynamic style preferences if available
      if (userProfile && userProfile.styleProfile) {
        const styleContext = UserContextCache.formatStyleContext(userProfile.styleProfile);
        if (styleContext) {
          userContext += styleContext;
        }
      }

    } catch (error) {
      logWarn(`Error building user context for ${userId}:`, error.message);
    }

    return userContext;
  }

  static formatContext(context) {
    const contexts = [];
    
    if (context.name) {
      contexts.push(`The user's name is ${context.name}.`);
    }

    if (context.aboutMe) {
      contexts.push(`About them: ${context.aboutMe}`);
    }

    if (context.style.preferred.length > 0) {
      contexts.push(`Their preferred styles: ${context.style.preferred.join(', ')}`);
    }

    if (context.style.colorsLove.length > 0) {
      contexts.push(`Colors they love: ${context.style.colorsLove.join(', ')}`);
    }

    if (context.style.colorsAvoid.length > 0) {
      contexts.push(`Colors they avoid: ${context.style.colorsAvoid.join(', ')}`);
    }

    if (context.lifestyle.monthlyClothingBudget) {
      contexts.push(`Their monthly clothing budget: ${context.lifestyle.monthlyClothingBudget}`);
    }

    if (context.lifestyle.environments.length > 0) {
      contexts.push(`Their primary environments: ${context.lifestyle.environments.join(', ')}`);
    }

    if (context.body.sizes.top || context.body.sizes.bottom || context.body.sizes.shoe) {
      const bodyInfo = [];
      if (context.body.sizes.top) bodyInfo.push(`top size: ${context.body.sizes.top}`);
      if (context.body.sizes.bottom) bodyInfo.push(`bottom size: ${context.body.sizes.bottom}`);
      if (context.body.sizes.shoe) bodyInfo.push(`shoe size: ${context.body.sizes.shoe}`);
      if (context.body.bodyType) bodyInfo.push(`body type: ${context.body.bodyType}`);

      if (bodyInfo.length > 0) {
        contexts.push(`Body info: ${bodyInfo.join(', ')}`);
      }
    }

    if (contexts.length > 0) {
      return `\n\nUSER CONTEXT:\n${contexts.join('\n')}`;
    }

    return '';
  }

  static formatLegacyContext(user) {
    const contexts = [];

    if (user.name) {
      contexts.push(`The user's name is ${user.name}.`);
    }

    if (user.settings?.aboutMe) {
      contexts.push(`About them: ${user.settings.aboutMe}`);
    }

    // Use onboarding data if available
    if (user.onboarding) {
      const onboarding = user.onboarding;
      
      // Body information
      if (onboarding.height || onboarding.weight || onboarding.shirtSize || onboarding.pantSize || onboarding.shoeSize || onboarding.bodyType) {
        const bodyInfo = [];
        if (onboarding.height) bodyInfo.push(`height: ${onboarding.height}`);
        if (onboarding.weight) bodyInfo.push(`weight: ${onboarding.weight}`);
        if (onboarding.shirtSize) bodyInfo.push(`shirt size: ${onboarding.shirtSize}`);
        if (onboarding.pantSize) bodyInfo.push(`pant size: ${onboarding.pantSize}`);
        if (onboarding.shoeSize) bodyInfo.push(`shoe size: ${onboarding.shoeSize}`);
        if (onboarding.bodyType) bodyInfo.push(`body type: ${onboarding.bodyType}`);

        if (bodyInfo.length > 0) {
          contexts.push(`Body info: ${bodyInfo.join(', ')}`);
        }
      }

      // Style preferences
      if (onboarding.preferredStyles && onboarding.preferredStyles.length > 0) {
        contexts.push(`Preferred styles: ${onboarding.preferredStyles.join(', ')}`);
      }

      if (onboarding.colorsLove && onboarding.colorsLove.length > 0) {
        contexts.push(`Colors they love: ${onboarding.colorsLove.join(', ')}`);
      }

      if (onboarding.fitPreference && onboarding.fitPreference.length > 0) {
        contexts.push(`Fit preferences: ${onboarding.fitPreference.join(', ')}`);
      }

      if (onboarding.favoriteBrands && onboarding.favoriteBrands.length > 0) {
        contexts.push(`Favorite brands: ${onboarding.favoriteBrands.join(', ')}`);
      }

      if (onboarding.styleNotes) {
        contexts.push(`Style notes: ${onboarding.styleNotes}`);
      }

      if (onboarding.noGoItems && onboarding.noGoItems.length > 0) {
        contexts.push(`No-go items: ${onboarding.noGoItems.join(', ')}`);
      }

      // Lifestyle information
      if (onboarding.weeklyEnvironment) {
        contexts.push(`Primary environment: ${onboarding.weeklyEnvironment}`);
      }

      if (onboarding.socialEventFrequency) {
        contexts.push(`Social event frequency: ${onboarding.socialEventFrequency}`);
      }

      if (onboarding.worksOut) {
        contexts.push(`Works out regularly: ${onboarding.worksOut}`);
      }

      if (onboarding.relationshipStatus) {
        contexts.push(`Relationship status: ${onboarding.relationshipStatus}`);
      }

      // Grooming & Accessories
      if (onboarding.accessoriesWorn && onboarding.accessoriesWorn.length > 0) {
        contexts.push(`Accessories they wear: ${onboarding.accessoriesWorn.join(', ')}`);
      }

      if (onboarding.wantMoreAccessories) {
        contexts.push(`Wants more accessories: ${onboarding.wantMoreAccessories}`);
      }

      if (onboarding.shoeTypes) {
        contexts.push(`Shoe types they like: ${onboarding.shoeTypes}`);
      }

      // Budget information
      if (onboarding.monthlyClothingBudget) {
        contexts.push(`Monthly clothing budget: ${onboarding.monthlyClothingBudget}`);
      }

      if (onboarding.budgetType && onboarding.budgetType.length > 0) {
        contexts.push(`Budget type preferences: ${onboarding.budgetType.join(', ')}`);
      }

      // Location
      if (onboarding.zipCode) {
        contexts.push(`Location (zip code): ${onboarding.zipCode}`);
      }
    }

    if (contexts.length > 0) {
      return `\n\nUSER CONTEXT:\n${contexts.join('\n')}`;
    }

    return '';
  }

  /**
   * Format learning insights from conversation data
   */
  static formatLearningContext(learningData) {
    const contexts = [];
    
    if (learningData.styleInsights) {
      const style = learningData.styleInsights;
      if (style.colorsAvoid && style.colorsAvoid.length > 0) {
        contexts.push(`Learned: Avoids these colors: ${style.colorsAvoid.join(', ')}`);
      }
      if (style.brandsAvoid && style.brandsAvoid.length > 0) {
        contexts.push(`Learned: Avoids these brands: ${style.brandsAvoid.join(', ')}`);
      }
      if (style.fitPreferences && style.fitPreferences.length > 0) {
        contexts.push(`Learned: Prefers these fits: ${style.fitPreferences.join(', ')}`);
      }
    }

    if (learningData.behavioralInsights) {
      const behavioral = learningData.behavioralInsights;
      if (behavioral.communicationStyle) {
        contexts.push(`Learned: Prefers ${behavioral.communicationStyle} communication`);
      }
      if (behavioral.adviceStyle) {
        contexts.push(`Learned: Prefers ${behavioral.adviceStyle} advice`);
      }
    }

    if (contexts.length > 0) {
      return `\n\nLEARNING INSIGHTS:\n${contexts.join('\n')}`;
    }

    return '';
  }

  /**
   * Format dynamic style profile data
   */
  static formatStyleContext(styleProfile) {
    const contexts = [];
    
    if (styleProfile.lastUpdated) {
      const hoursSinceUpdate = (Date.now() - new Date(styleProfile.lastUpdated).getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate <= 24) {
        contexts.push(`Style profile recently updated (${Math.round(hoursSinceUpdate)} hours ago)`);
      }
    }

    if (styleProfile.dynamicPreferences) {
      const prefs = styleProfile.dynamicPreferences;
      if (prefs.recentlyLiked && prefs.recentlyLiked.length > 0) {
        contexts.push(`Recently liked: ${prefs.recentlyLiked.join(', ')}`);
      }
      if (prefs.recentlyDisliked && prefs.recentlyDisliked.length > 0) {
        contexts.push(`Recently disliked: ${prefs.recentlyDisliked.join(', ')}`);
      }
    }

    if (contexts.length > 0) {
      return `\n\nDYNAMIC STYLE:\n${contexts.join('\n')}`;
    }

    return '';
  }

  static isExpired(timestamp) {
    return Date.now() - timestamp > CACHE_TTL;
  }

  // Clear cache for a specific user (call this when user updates settings)
  static clearUserCache(userId) {
    if (userContextCache.has(userId)) {
      userContextCache.delete(userId);
      logInfo(`Cleared user context cache for ${userId}`);
    }
  }

  // Clear all cache (for maintenance)
  static clearAllCache() {
    const size = userContextCache.size;
    userContextCache.clear();
    logInfo(`Cleared all user context cache (${size} entries)`);
  }

  // Get cache stats
  static getCacheStats() {
    return {
      size: userContextCache.size,
      entries: Array.from(userContextCache.keys())
    };
  }
}

module.exports = UserContextCache;

