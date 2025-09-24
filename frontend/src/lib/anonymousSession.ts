// Anonymous session management for free user experience
interface AnonymousSession {
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  usage: {
    fitCheck: number;
    chatMessages: number;
  };
  preferences: {
    stylePreferences?: string[];
    sizePreferences?: string[];
  };
}

interface SessionLimits {
  fitCheck: number;
  chatMessages: number;
}

const DEFAULT_LIMITS: SessionLimits = {
  fitCheck: 1,
  chatMessages: 5
};

class AnonymousSessionManager {
  private session: AnonymousSession | null = null;
  private readonly STORAGE_KEY = 'jules_anonymous_session';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSession();
    }
  }

  private generateSessionId(): string {
    return 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private loadSession(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored) as AnonymousSession;
        
        // Check if session is still valid (not expired)
        const sessionAge = Date.now() - new Date(session.createdAt).getTime();
        if (sessionAge < this.SESSION_DURATION) {
          this.session = session;
          this.updateLastActivity();
        } else {
          // Session expired, create new one
          this.createNewSession();
        }
      } else {
        this.createNewSession();
      }
    } catch (error) {
      console.error('Error loading anonymous session:', error);
      this.createNewSession();
    }
  }

  private createNewSession(): void {
    const now = new Date().toISOString();
    this.session = {
      sessionId: this.generateSessionId(),
      createdAt: now,
      lastActivity: now,
      usage: {
        fitCheck: 0,
        chatMessages: 0
      },
      preferences: {}
    };
    this.saveSession();
  }

  private saveSession(): void {
    if (typeof window === 'undefined' || !this.session) return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.session));
    } catch (error) {
      console.error('Error saving anonymous session:', error);
    }
  }

  private updateLastActivity(): void {
    if (this.session) {
      this.session.lastActivity = new Date().toISOString();
      this.saveSession();
    }
  }

  public getSessionId(): string | null {
    return this.session?.sessionId || null;
  }

  public getUsage(): { fitCheck: number; chatMessages: number } {
    return this.session?.usage || { fitCheck: 0, chatMessages: 0 };
  }

  public canUseFeature(feature: keyof SessionLimits): boolean {
    if (!this.session) return false;
    
    const currentUsage = this.session.usage[feature];
    const limit = DEFAULT_LIMITS[feature];
    
    return currentUsage < limit;
  }

  public incrementUsage(feature: keyof SessionLimits): boolean {
    if (!this.session) return false;
    
    if (this.canUseFeature(feature)) {
      this.session.usage[feature]++;
      this.updateLastActivity();
      this.saveSession();
      return true;
    }
    
    return false;
  }

  public getRemainingUsage(feature: keyof SessionLimits): number {
    if (!this.session) return 0;
    
    const currentUsage = this.session.usage[feature];
    const limit = DEFAULT_LIMITS[feature];
    
    return Math.max(0, limit - currentUsage);
  }

  public setPreferences(preferences: Partial<AnonymousSession['preferences']>): void {
    if (!this.session) return;
    
    this.session.preferences = {
      ...this.session.preferences,
      ...preferences
    };
    this.updateLastActivity();
    this.saveSession();
  }

  public getPreferences(): AnonymousSession['preferences'] {
    return this.session?.preferences || {};
  }

  public resetSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.createNewSession();
  }

  public getSessionInfo(): {
    sessionId: string | null;
    createdAt: string | null;
    usage: { fitCheck: number; chatMessages: number };
    limits: SessionLimits;
  } {
    return {
      sessionId: this.session?.sessionId || null,
      createdAt: this.session?.createdAt || null,
      usage: this.session?.usage || { fitCheck: 0, chatMessages: 0 },
      limits: DEFAULT_LIMITS
    };
  }

  // Track feature usage for analytics
  public trackFeatureUsage(feature: keyof SessionLimits, success: boolean): void {
    if (typeof window === 'undefined') return;
    
    // This would integrate with the analytics system
    const event = {
      eventType: 'feature_usage',
      category: 'free_experience',
      action: feature,
      properties: {
        sessionId: this.session?.sessionId,
        success,
        usage: this.session?.usage[feature] || 0,
        limit: DEFAULT_LIMITS[feature]
      }
    };
    
    // Send to analytics (this would use the existing analytics system)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.trackFeatureUsage(feature, success ? 'success' : 'limit_reached', event.properties);
    }
  }
}

// Create singleton instance
export const anonymousSession = new AnonymousSessionManager();

// React hook for easy usage in components
export const useAnonymousSession = () => {
  return {
    getSessionId: anonymousSession.getSessionId.bind(anonymousSession),
    getUsage: anonymousSession.getUsage.bind(anonymousSession),
    canUseFeature: anonymousSession.canUseFeature.bind(anonymousSession),
    incrementUsage: anonymousSession.incrementUsage.bind(anonymousSession),
    getRemainingUsage: anonymousSession.getRemainingUsage.bind(anonymousSession),
    setPreferences: anonymousSession.setPreferences.bind(anonymousSession),
    getPreferences: anonymousSession.getPreferences.bind(anonymousSession),
    resetSession: anonymousSession.resetSession.bind(anonymousSession),
    getSessionInfo: anonymousSession.getSessionInfo.bind(anonymousSession),
    trackFeatureUsage: anonymousSession.trackFeatureUsage.bind(anonymousSession)
  };
};

export default anonymousSession;


