type Ctx = { session_id?: string; user_id?: string; app_build?: string; country?: string; device_type?: string; referrer_domain?: string; ab_variant?: string };

export async function track(event: string, properties: Record<string, any> = {}, context: Ctx = {}) {
  // Check if analytics is enabled
  const isEnabled = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY && 
                   (process.env.NODE_ENV === 'production' || 
                    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true');
  
  if (!isEnabled) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics disabled:', event, properties);
    }
    return { ok: true, disabled: true };
  }

  try {
    // Use the Segment client for tracking
    const { segment } = await import('../utils/segment');
    await segment.track(event, properties);
    return { ok: true, disabled: false };
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Error tracking function
export function trackError(error: Error, context: Record<string, any> = {}) {
  // Analytics disabled - prevent app crashes
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Error tracking disabled:', error.message);
  }
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
