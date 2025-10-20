'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { segment } from '@/utils/segment';

interface UpgradePromptProps {
  featureName: string;
  limitReached: boolean;
  onDismiss?: () => void;
  className?: string;
}

export default function UpgradePrompt({ 
  featureName, 
  limitReached, 
  onDismiss,
  className = '' 
}: UpgradePromptProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    segment.track('Upgrade Prompt Dismissed', {
      feature_name: featureName,
      category: 'free_experience',
      action: 'prompt_dismissed'
    });
  };

  const handleUpgradeClick = () => {
    segment.track('Upgrade Prompt Clicked', {
      feature_name: featureName,
      category: 'free_experience',
      action: 'upgrade_button_clicked',
      source: 'upgrade_prompt'
    });
  };

  const handleSignInClick = () => {
    segment.track('Upgrade Prompt Sign In Clicked', {
      feature_name: featureName,
      category: 'free_experience',
      action: 'signin_button_clicked',
      source: 'upgrade_prompt'
    });
  };

  if (!isVisible) return null;

  return (
    <Card className={`bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border-purple-500/30 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {limitReached ? 'Free Limit Reached' : 'Unlock Premium Features'}
              </h3>
              <p className="text-sm text-gray-300">
                {limitReached 
                  ? `You've used your free ${featureName} for this session`
                  : `Get unlimited access to ${featureName} and more`
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-white mb-2">What you get with Jules Premium:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Unlimited {featureName} usage
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Access to all premium features
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Personalized recommendations
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Save your style preferences
            </li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/register" onClick={handleUpgradeClick} className="flex-1">
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white transition-all duration-200 transform hover:scale-105 shadow-lg"
              size="lg"
            >
              Create Free Account
            </Button>
          </Link>
          <Link href="/login" onClick={handleSignInClick} className="flex-1">
            <Button 
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10 transition-all duration-200"
              size="lg"
            >
              Sign In
            </Button>
          </Link>
        </div>
        
        <p className="text-xs text-gray-400 text-center mt-3">
          No credit card required • Free forever plan available
        </p>
      </CardContent>
    </Card>
  );
}


