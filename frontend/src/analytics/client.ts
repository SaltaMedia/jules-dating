type Ctx = { session_id?: string; user_id?: string; app_build?: string; country?: string; device_type?: string; referrer_domain?: string; ab_variant?: string };

export async function track(event: string, properties: Record<string, any> = {}, context: Ctx = {}) {
  try {
    // Get current user info from localStorage
    let userId = context.user_id;
    if (!userId && typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user._id || user.id || user.email;
        } catch (e) {
          console.warn('Failed to parse user data from localStorage:', e);
        }
      }
    }

    // Get session ID from localStorage or generate one
    let sessionId = context.session_id;
    if (!sessionId && typeof window !== 'undefined') {
      sessionId = localStorage.getItem('sessionId') || undefined;
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
      }
    }

    // Enhanced context with user and session info
    const enhancedContext = {
      ...context,
      user_id: userId || 'anonymous',
      session_id: sessionId || 'unknown'
    };

    const body = JSON.stringify({ event, properties, context: enhancedContext });
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = (navigator as any).sendBeacon('/api/analytics/track', blob);
      if (ok) return { ok: true, beacon: true };
    }
    const res = await fetch('/api/analytics/track', { method:'POST', headers:{'Content-Type':'application/json'}, body });
    return await res.json();
  } catch { return { ok: false }; }
}

// Error tracking function
export function trackError(error: Error, context: Record<string, any> = {}) {
  track('error_occurred', {
    error_message: error.message,
    error_stack: error.stack?.substring(0, 500), // Limit stack trace length
    error_name: error.name,
    page: window.location.pathname,
    ...context
  });
}

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'javascript_error'
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason), {
      type: 'unhandled_promise_rejection'
    });
  });
}
