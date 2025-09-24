const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class PinterestTokenManager {
  constructor() {
    this.clientId = process.env.PINTEREST_CLIENT_ID;
    this.clientSecret = process.env.PINTEREST_CLIENT_SECRET;
    this.redirectUri = process.env.PINTEREST_REDIRECT_URI;
    this.tokenFilePath = path.join(__dirname, '../data/pinterest-tokens.json');
    this.tokens = null;
    this.lastRefreshTime = null;
    this.refreshThreshold = 60 * 60 * 1000; // 1 hour before expiry
  }

  /**
   * Initialize the token manager
   */
  async initialize() {
    try {
      await this.loadTokens();
      await this.ensureValidToken();
    } catch (error) {
      console.error('Failed to initialize Pinterest token manager:', error);
    }
  }

  /**
   * Load tokens from file or environment variables
   */
  async loadTokens() {
    // Check environment variables first
    if (process.env.PINTEREST_ACCESS_TOKEN) {
      this.tokens = {
        access_token: process.env.PINTEREST_ACCESS_TOKEN,
        refresh_token: process.env.PINTEREST_REFRESH_TOKEN || null,
        expires_at: null
      };
      console.log('Loaded Pinterest tokens from environment variables');
      return;
    }

    try {
      // Try to load from file as fallback
      const data = await fs.readFile(this.tokenFilePath, 'utf8');
      this.tokens = JSON.parse(data);
      console.log('Loaded Pinterest tokens from file');
    } catch (error) {
      // No tokens available
      this.tokens = null;
      console.log('No Pinterest tokens found');
    }
  }

  /**
   * Save tokens to file (only in development)
   */
  async saveTokens() {
    // Only save to file in development
    if (process.env.NODE_ENV === 'production') {
      console.log('Skipping file save in production - tokens should be in environment variables');
      return;
    }
    
    try {
      // Ensure directory exists
      const dir = path.dirname(this.tokenFilePath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(this.tokenFilePath, JSON.stringify(this.tokens, null, 2));
      console.log('Saved Pinterest tokens to file');
    } catch (error) {
      console.error('Failed to save Pinterest tokens:', error);
    }
  }

  /**
   * Get current access token, refreshing if necessary
   */
  async getAccessToken() {
    // Initialize if not already done
    if (!this.tokens) {
      await this.initialize();
    }
    await this.ensureValidToken();
    return this.tokens?.access_token;
  }

  /**
   * Check if token needs refresh and refresh if necessary
   */
  async ensureValidToken() {
    if (!this.tokens?.access_token) {
      throw new Error('No Pinterest access token available');
    }

    // Only try to refresh if we have a refresh token
    if (this.tokens.refresh_token && this.shouldRefreshToken()) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Check if token should be refreshed
   */
  shouldRefreshToken() {
    if (!this.tokens.expires_at) {
      // If no expiry info, don't refresh (token is valid indefinitely)
      return false;
    }

    const timeUntilExpiry = this.tokens.expires_at - Date.now();
    return timeUntilExpiry < this.refreshThreshold;
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken() {
    if (!this.tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      console.log('Refreshing Pinterest access token...');
      
      const response = await axios.post('https://api.pinterest.com/v5/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: this.tokens.refresh_token,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      if (response.data.access_token) {
        this.tokens.access_token = response.data.access_token;
        
        // Update refresh token if a new one is provided
        if (response.data.refresh_token) {
          this.tokens.refresh_token = response.data.refresh_token;
        }

        // Calculate expiry time (default to 24 hours if not provided)
        const expiresIn = response.data.expires_in || 86400; // 24 hours in seconds
        this.tokens.expires_at = Date.now() + (expiresIn * 1000);

        this.lastRefreshTime = Date.now();
        
        // Save updated tokens
        await this.saveTokens();
        
        console.log('Successfully refreshed Pinterest access token');
        return this.tokens.access_token;
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('Failed to refresh Pinterest access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh Pinterest access token');
    }
  }

  /**
   * Get authorization URL for initial OAuth setup
   */
  getAuthorizationUrl() {
    if (!this.clientId || !this.redirectUri) {
      throw new Error('Pinterest client ID and redirect URI must be configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'boards:read,pins:read',
      state: this.generateState()
    });

    return `https://www.pinterest.com/oauth/?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post('https://api.pinterest.com/v5/oauth/token', {
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      });

      if (response.data.access_token) {
        this.tokens = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_at: Date.now() + ((response.data.expires_in || 86400) * 1000)
        };

        this.lastRefreshTime = Date.now();
        await this.saveTokens();
        
        console.log('Successfully obtained Pinterest tokens');
        return this.tokens;
      } else {
        throw new Error('No access token in response');
      }
    } catch (error) {
      console.error('Failed to exchange code for tokens:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Generate a random state parameter for OAuth security
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Check if tokens are properly configured
   */
  isConfigured() {
    return !!(this.clientId && this.clientSecret && 
             (this.tokens?.access_token || process.env.PINTEREST_ACCESS_TOKEN));
  }

  /**
   * Get token status information
   */
  getTokenStatus() {
    if (!this.tokens) {
      return { configured: false, valid: false, message: 'No tokens loaded' };
    }

    if (!this.tokens.access_token) {
      return { configured: false, valid: false, message: 'No access token' };
    }

    if (this.tokens.expires_at) {
      const timeUntilExpiry = this.tokens.expires_at - Date.now();
      const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
      
      return {
        configured: true,
        valid: timeUntilExpiry > 0,
        expiresIn: `${hoursUntilExpiry.toFixed(1)} hours`,
        hasRefreshToken: !!this.tokens.refresh_token,
        lastRefresh: this.lastRefreshTime ? new Date(this.lastRefreshTime).toISOString() : null
      };
    }

    return {
      configured: true,
      valid: true,
      message: 'Token valid (no expiry info)',
      hasRefreshToken: !!this.tokens.refresh_token,
      lastRefresh: this.lastRefreshTime ? new Date(this.lastRefreshTime).toISOString() : null
    };
  }
}

// Create singleton instance
const pinterestTokenManager = new PinterestTokenManager();

module.exports = pinterestTokenManager; 