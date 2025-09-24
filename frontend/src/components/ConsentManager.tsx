'use client';

import { useState, useEffect } from 'react';
import { track } from '@/analytics/client';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

interface ConsentManagerProps {
  onConsentChange?: (preferences: ConsentPreferences) => void;
  showBanner?: boolean;
}

export default function ConsentManager({ onConsentChange, showBanner = true }: ConsentManagerProps) {
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem('jules-consent');
    if (savedConsent) {
      const parsedConsent = JSON.parse(savedConsent);
      setPreferences(parsedConsent);
    } else if (showBanner) {
      // Show banner if no consent has been given
      setShowConsentBanner(true);
    }
  }, [showBanner]);

  const saveConsent = (newPreferences: ConsentPreferences) => {
    const consentData = {
      ...newPreferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('jules-consent', JSON.stringify(consentData));
    setPreferences(newPreferences);
    setShowConsentBanner(false);
    setShowConsentModal(false);
    
    // Track consent given
    track('consent_given', {
      category: 'privacy',
      action: 'consent_updated',
      properties: newPreferences
    });
    
    onConsentChange?.(newPreferences);
  };

  const acceptAll = () => {
    const allConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allConsent);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(necessaryOnly);
  };

  const handlePreferenceChange = (key: keyof ConsentPreferences, value: boolean) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const saveCustomPreferences = () => {
    saveConsent(preferences);
  };

  if (!showConsentBanner && !showConsentModal) {
    return null; // Remove persistent Cookie Settings button
  }

  return (
    <>
      {/* Consent Banner */}
      {showConsentBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">We value your privacy</h3>
                <p className="text-gray-300 text-sm">
                  We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. 
                  You can manage your preferences at any time.
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  <a href="/privacy" className="text-blue-300 hover:text-blue-200 underline">
                    Learn more in our Privacy Policy
                  </a>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Necessary Only
                </button>
                <button
                  onClick={() => setShowConsentModal(true)}
                  className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Customize
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Cookie & Privacy Preferences</h2>
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Necessary Cookies */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">Necessary Cookies</h3>
                    <div className="bg-green-600 text-white px-2 py-1 rounded text-sm">Always Active</div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    These cookies are essential for the website to function properly. They enable basic functions like page navigation, 
                    access to secure areas, and authentication. The website cannot function properly without these cookies.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">Analytics Cookies</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-300 text-sm">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. 
                    This helps us improve our website performance and user experience.
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">Functional Cookies</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-300 text-sm">
                    These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings. 
                    They may be set by us or by third-party providers whose services we have added to our pages.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">Marketing Cookies</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-300 text-sm">
                    These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging 
                    for the individual user and thereby more valuable for publishers and third-party advertisers.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={acceptNecessary}
                  className="flex-1 px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Accept Necessary Only
                </button>
                <button
                  onClick={saveCustomPreferences}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Accept All
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-400 text-xs">
                  You can change these settings at any time in your account settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
