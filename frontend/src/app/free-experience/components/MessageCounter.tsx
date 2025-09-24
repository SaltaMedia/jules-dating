'use client';

import { useState } from 'react';

interface MessageCounterProps {
  remaining: number;
  total: number;
  showUpgradePrompt?: boolean;
  onUpgradeClick?: () => void;
}

export default function MessageCounter({ 
  remaining, 
  total, 
  showUpgradePrompt = false,
  onUpgradeClick 
}: MessageCounterProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getProgressColor = () => {
    if (remaining === 0) return 'bg-red-500';
    if (remaining <= 1) return 'bg-yellow-500';
    if (remaining <= 2) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (remaining === 0) return 'text-red-300';
    if (remaining <= 1) return 'text-yellow-300';
    if (remaining <= 2) return 'text-orange-300';
    return 'text-green-300';
  };

  const getIcon = () => {
    if (remaining === 0) return '🚫';
    if (remaining <= 1) return '⚠️';
    if (remaining <= 2) return '⚡';
    return '💬';
  };

  return (
    <div className="relative">
      {/* Main Counter */}
      <div 
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
          showUpgradePrompt 
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30' 
            : 'bg-white/10 border-white/20 hover:bg-white/20'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="text-lg">{getIcon()}</span>
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${getTextColor()}`}>
            {remaining} / {total} messages
          </span>
          <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${(remaining / total) * 100}%` }}
            />
          </div>
        </div>
      </div>


      {/* Hover Tooltip */}
      {!showUpgradePrompt && isHovered && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-white/20 rounded-lg p-2 shadow-lg z-50">
          <p className="text-white text-xs">
            {remaining > 0 
              ? `${remaining} free message${remaining === 1 ? '' : 's'} remaining`
              : 'No free messages remaining'
            }
          </p>
          {remaining > 0 && (
            <p className="text-gray-300 text-xs mt-1">
              Sign up for unlimited access
            </p>
          )}
        </div>
      )}
    </div>
  );
}


