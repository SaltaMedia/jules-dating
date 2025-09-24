// Simple usage management for freemium model
const USAGE_KEY = 'jules_usage';
const FREE_LIMITS = {
  fitChecks: 1,
  chatMessages: 5
};

// Get current usage from localStorage
export const getUsage = () => {
  try {
    const stored = localStorage.getItem(USAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading usage from localStorage:', error);
  }
  
  // Return default usage
  return {
    fitChecks: 0,
    chatMessages: 0
  };
};

// Update usage in localStorage
export const updateUsage = (type, increment = 1) => {
  try {
    const current = getUsage();
    current[type] = (current[type] || 0) + increment;
    localStorage.setItem(USAGE_KEY, JSON.stringify(current));
    return current;
  } catch (error) {
    console.error('Error updating usage in localStorage:', error);
    return getUsage();
  }
};

// Check if limit is reached
export const isLimitReached = (type) => {
  const usage = getUsage();
  const limit = FREE_LIMITS[type];
  return (usage[type] || 0) >= limit;
};

// Get remaining usage
export const getRemainingUsage = (type) => {
  const usage = getUsage();
  const limit = FREE_LIMITS[type];
  return Math.max(0, limit - (usage[type] || 0));
};

// Get usage data for API requests
export const getUsageForAPI = () => {
  return getUsage();
};

// Reset usage (for testing or new session)
export const resetUsage = () => {
  try {
    localStorage.removeItem(USAGE_KEY);
  } catch (error) {
    console.error('Error resetting usage:', error);
  }
};

// Check if user should see conversion prompt
export const shouldShowConversionPrompt = () => {
  const usage = getUsage();
  return usage.fitChecks >= FREE_LIMITS.fitChecks || 
         usage.chatMessages >= FREE_LIMITS.chatMessages;
};

export { FREE_LIMITS };


