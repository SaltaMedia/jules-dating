'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UsageInfo {
  fitChecks: {
    current: number;
    limit: number;
    remaining: number;
    isLimitReached: boolean;
  };
  chatMessages: {
    current: number;
    limit: number;
    remaining: number;
    isLimitReached: boolean;
  };
}

interface UsageCounterProps {
  type: 'fitChecks' | 'chatMessages';
  onUpgrade?: () => void;
}

export default function UsageCounter({ type, onUpgrade }: UsageCounterProps) {
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/anonymous/usage');
        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          setUsageInfo(data.usage);
        }
      } catch (error) {
        console.error('Failed to fetch usage info:', error);
      }
    };

    fetchUsage();
  }, []);

  if (!usageInfo) {
    return null;
  }

  const currentUsage = usageInfo[type];
  const isLimitReached = currentUsage.isLimitReached;
  const remaining = currentUsage.remaining;

  const getTypeLabel = () => {
    switch (type) {
      case 'fitChecks':
        return 'Fit Checks';
      case 'chatMessages':
        return 'Messages';
      default:
        return 'Usage';
    }
  };

  const getUpgradeMessage = () => {
    switch (type) {
      case 'fitChecks':
        return 'Sign up to get unlimited fit checks and save your results!';
      case 'chatMessages':
        return 'Sign up to continue chatting with Jules and get unlimited style advice!';
      default:
        return 'Sign up to continue!';
    }
  };

  return (
    <div className={`rounded-lg p-4 mb-4 ${
      isLimitReached 
        ? 'bg-red-500/20 border border-red-500/30' 
        : 'bg-blue-500/20 border border-blue-500/30'
    }`}>
      <div className="flex justify-between items-center">
        <div>
          <span className={`font-medium ${
            isLimitReached ? 'text-red-300' : 'text-blue-300'
          }`}>
            {getTypeLabel()} remaining: {remaining}
          </span>
          {!isLimitReached && (
            <span className="text-gray-400 text-sm ml-2">
              ({currentUsage.current}/{currentUsage.limit} used)
            </span>
          )}
        </div>
        
        {isLimitReached && (
          <div className="text-right">
            <p className="text-red-300 text-sm mb-2">
              {getUpgradeMessage()}
            </p>
            <Link
              href="/register"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
        
        {!isLimitReached && remaining <= 1 && (
          <div className="text-right">
            <p className="text-yellow-300 text-sm mb-2">
              Almost at your limit!
            </p>
            <Link
              href="/register"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Sign Up to Continue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


