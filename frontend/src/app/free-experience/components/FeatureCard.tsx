'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Feature {
  id: string;
  title: string;
  description: string;
  free: boolean;
  limit?: string;
  href: string;
  icon: string;
}

interface FeatureCardProps {
  feature: Feature;
  onClick: () => void;
}

export default function FeatureCard({ feature, onClick }: FeatureCardProps) {
  const handleClick = () => {
    onClick();
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${
      feature.free 
        ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30 hover:border-green-400/50' 
        : 'bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border-purple-500/30 hover:border-purple-400/50'
    } backdrop-blur-sm`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-3xl">{feature.icon}</div>
          {feature.free ? (
            <span className="bg-green-500/30 text-green-300 px-2 py-1 rounded-full text-xs font-medium">
              FREE
            </span>
          ) : (
            <span className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
              PREMIUM
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {feature.title}
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          {feature.description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        {feature.free && feature.limit && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center text-sm text-gray-300">
              <svg className="w-4 h-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Limit: {feature.limit}</span>
            </div>
          </div>
        )}
        
        <Link href={feature.href} onClick={handleClick}>
          <Button 
            className={`w-full ${
              feature.free 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
            } transition-all duration-200 transform hover:scale-105 shadow-lg`}
            size="lg"
          >
            {feature.free ? 'Try Now' : 'Upgrade to Access'}
          </Button>
        </Link>
        
        {!feature.free && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Requires account registration
          </p>
        )}
      </CardContent>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
    </Card>
  );
}


