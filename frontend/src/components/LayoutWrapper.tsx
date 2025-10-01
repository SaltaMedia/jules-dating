'use client';

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNavigation from "./BottomNavigation";
import ConsentManager from "./ConsentManager";
import { track } from "@/analytics/client";

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
    
    // Track page visit
    track('page_visited', {
      page: pathname,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    });
    
    // Track session start
    if (!sessionStorage.getItem('session_started')) {
      sessionStorage.setItem('session_started', sessionStart.toString());
      sessionStorage.setItem('session_id', sessionId);
      track('session_started', {
        session_id: sessionId,
        start_time: new Date().toISOString()
      });
    }
    
    // Track session end on page unload
    const handleBeforeUnload = () => {
      const sessionStartTime = sessionStorage.getItem('session_started');
      if (sessionStartTime) {
        const sessionDuration = Date.now() - parseInt(sessionStartTime);
        track('session_ended', {
          session_id: sessionStorage.getItem('session_id'),
          duration_ms: sessionDuration,
          end_time: new Date().toISOString()
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname]);
  
  // Hide bottom navigation on login, home page, auth pages, forgot password, reset password, landing-new, admin pages, and ALL free experience pages
  // Show bottom navigation on: onboarding, chat, profile-pic-review, fit-check, and other main app pages (authenticated users only)
  const hideBottomNav = isClient && (pathname === '/login' || 
                       pathname === '/' ||
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
