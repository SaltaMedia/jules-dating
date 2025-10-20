'use client';

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNavigation from "./BottomNavigation";
import ConsentManager from "./ConsentManager";
import { segment } from "@/utils/segment";

// Helper function to get specific page event names
function getPageEventName(pathname: string): string {
  const pageMap: Record<string, string> = {
    '/register': 'Registration Page Visited',
    '/login': 'Login Page Visited',
    '/onboarding': 'Onboarding Page Visited',
    '/chat': 'Chat Page Visited',
    '/fitcheck': 'Fit Check Page Visited',
    '/profile-pic-review': 'Profile Pic Review Page Visited',
    '/settings': 'Settings Page Visited',
    '/tips': 'Tips Page Visited',
    '/forgot-password': 'Forgot Password Page Visited',
    '/reset-password': 'Reset Password Page Visited',
    '/privacy': 'Privacy Page Visited',
    '/termsofuse': 'Terms of Use Page Visited'
  };
  
  return pageMap[pathname] || `Page Visited: ${pathname}`;
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Track page visits and session start
  useEffect(() => {
    const sessionStart = Date.now();
    const sessionId = `session_${sessionStart}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Track session start (for all pages)
    if (!sessionStorage.getItem('session_started')) {
      sessionStorage.setItem('session_started', sessionStart.toString());
      sessionStorage.setItem('session_id', sessionId);
      segment.track('Session Started', {
        session_id: sessionId,
        start_time: new Date().toISOString()
      });
    }
    
    // Skip automatic page tracking for pages that have their own specific tracking
    if (pathname === '/test-segment' || pathname === '/' || pathname === '/free-experience') {
      return;
    }
    
    // Track page visit with Segment using specific page names (every time)
    const pageEventName = getPageEventName(pathname);
    console.log(`📊 Tracking page visit: ${pageEventName} for ${pathname}`);
    segment.track(pageEventName, {
      page: pathname,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Page tracking completed for ${pathname}`);
    
    // Track session end only on actual page unload (browser close/refresh)
    // Not on navigation between pages
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only track if this is a real page unload, not navigation
      if (event.type === 'beforeunload') {
        const sessionStartTime = sessionStorage.getItem('session_started');
        if (sessionStartTime) {
          const sessionDuration = Date.now() - parseInt(sessionStartTime);
          // Use sendBeacon for reliable tracking on page unload
          if (navigator.sendBeacon) {
            const data = JSON.stringify({
              event: 'Session Ended',
              properties: {
                session_id: sessionStorage.getItem('session_id'),
                duration_ms: sessionDuration,
                end_time: new Date().toISOString()
              }
            });
            navigator.sendBeacon('/api/analytics/session-end', data);
          }
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname]);
  
  // Hide bottom navigation on login, home page, auth pages, forgot password, reset password, landing-new, admin pages, landing pages (/1, /2), and ALL free experience pages
  // Show bottom navigation on: onboarding, chat, profile-pic-review, fit-check, and other main app pages (authenticated users only)
  const hideBottomNav = isClient && (pathname === '/login' || 
                       pathname === '/' ||
                       pathname === '/1' ||
                       pathname === '/2' ||
                       pathname === '/landing-new' ||
                       pathname === '/forgot-password' ||
                       pathname === '/reset-password' ||
                       pathname === '/register' ||
                       pathname?.startsWith('/auth/') ||
                       pathname?.startsWith('/admin/') ||
                       pathname === '/free-experience' ||
                       pathname?.startsWith('/free-experience/'));
  
  return (
    <>
      <div className={hideBottomNav ? "" : "pb-16"}>
        {children}
      </div>
      {!hideBottomNav && isClient && <BottomNavigation />}
      {isClient && <ConsentManager />}
    </>
  );
}
