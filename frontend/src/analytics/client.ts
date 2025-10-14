type Ctx = { session_id?: string; user_id?: string; app_build?: string; country?: string; device_type?: string; referrer_domain?: string; ab_variant?: string };

export async function track(event: string, properties: Record<string, any> = {}, context: Ctx = {}) {
  // Analytics system disabled - will be reworked
  // Just log for debugging, no network requests
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics event (disabled):', event, properties);
  }
  return { ok: true, disabled: true };
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
