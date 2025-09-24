'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Shirt, MessageCircle, Wine } from 'lucide-react';

interface TipCard {
  id: string;
  title: string;
  description: string;
}

interface Playbook {
  id: string;
  title: string;
  icon: React.ReactNode;
  tips: TipCard[];
}

const playbooks: Playbook[] = [
  {
    id: 'profile-pic',
    title: 'Profile Pic Playbook',
    icon: <Camera className="w-6 h-6" />,
    tips: [
      {
        id: '1',
        title: 'Lead with your best face',
        description: 'Natural light, no hats hiding your eyes, no deadpan mugshot.'
      },
      {
        id: '2',
        title: 'Show the fit',
        description: 'One full-body shot so she sees more than your forehead.'
      },
      {
        id: '3',
        title: 'Delete the bathroom selfie',
        description: "Nobody's swiping right on your shower curtain."
      },
      {
        id: '4',
        title: 'Mix it up',
        description: 'Solo shot, social shot, hobby shot, dressed-up shot. Not six versions of you in the same hoodie.'
      },
      {
        id: '5',
        title: '4–6 pics total',
        description: "More feels try-hard, less feels like you're hiding."
      }
    ]
  },
  {
    id: 'outfit',
    title: 'Outfit Playbook',
    icon: <Shirt className="w-6 h-6" />,
    tips: [
      {
        id: '1',
        title: 'One notch up',
        description: "Dress one step nicer than the place—not like you're meeting her dad."
      },
      {
        id: '2',
        title: 'Wrinkles kill',
        description: "If it looks slept in, it reads like you don't care."
      },
      {
        id: '3',
        title: 'One upgrade piece',
        description: 'Watch, jacket, or shoes. Not all three at once.'
      }
    ]
  },
  {
    id: 'texting',
    title: 'Texting Playbook',
    icon: <MessageCircle className="w-6 h-6" />,
    tips: [
      {
        id: '1',
        title: 'Rule #1: Chat with me!',
        description: 'Drop me the profile + your goal. Flirty fun ≠ serious relationship. Hit me on text.'
      },
      {
        id: '2',
        title: 'Profile > looks',
        description: '"Saw you love live music—what\'s the best show you\'ve been to?"'
      },
      {
        id: '3',
        title: 'Keep it short',
        description: 'Under 15 words. No novels.'
      },
      {
        id: '4',
        title: 'Always leave a door open',
        description: 'End with a question or playful challenge.'
      },
      {
        id: '5',
        title: 'Know when to ghost the ghost',
        description: "If she's not responding, I'll tell you when to stop."
      }
    ]
  },
  {
    id: 'date',
    title: 'Date Playbook',
    icon: <Wine className="w-6 h-6" />,
    tips: [
      {
        id: '1',
        title: 'Keep it tight',
        description: 'First date = 60–90 minutes, not a hostage situation.'
      },
      {
        id: '2',
        title: 'Drinks/Coffee > dinner',
        description: 'Easier, cheaper, lower stakes.'
      },
      {
        id: '3',
        title: 'Pick energy',
        description: 'Bars, cafés, rooftops. Not dead-silent tea houses.'
      },
      {
        id: '4',
        title: 'Plan a backup',
        description: 'Spot #2 within walking distance if it\'s clicking.'
      }
    ]
  }
];

export default function TipsPage() {
  const [activePlaybook, setActivePlaybook] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentPlaybook = playbooks[activePlaybook];

  // Minimum distance for swipe detection
  const minSwipeDistance = 50;

  const nextTip = () => {
    setCurrentTipIndex((prev) => 
      prev < currentPlaybook.tips.length - 1 ? prev + 1 : 0
    );
  };

  const prevTip = () => {
    setCurrentTipIndex((prev) => 
      prev > 0 ? prev - 1 : currentPlaybook.tips.length - 1
    );
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextTip();
    } else if (isRightSwipe) {
      prevTip();
    }
  };

  // Reset tip index when changing playbooks
  useEffect(() => {
    setCurrentTipIndex(0);
  }, [activePlaybook]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 pb-20">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/20 px-4 py-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-600/10 to-blue-700/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white text-center bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 bg-clip-text text-transparent drop-shadow-lg">
            Jules' Playbooks
          </h1>
          <p className="text-gray-300 text-center mt-2">
            Blunt, witty, actually useful advice
          </p>
        </div>
      </div>

      {/* Playbook Selector */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-4 py-4">
        <div className="flex space-x-2 overflow-x-auto">
          {playbooks.map((playbook, index) => (
            <button
              key={playbook.id}
              onClick={() => {
                setActivePlaybook(index);
                setCurrentTipIndex(0);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activePlaybook === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/20 text-gray-300 hover:bg-white/30'
              }`}
            >
              <span className={`mr-2 ${activePlaybook === index ? 'text-white' : 'text-gray-300'}`}>{playbook.icon}</span>
              {playbook.title.replace(' Playbook', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Current Playbook Content */}
      <div className="px-4 py-6">
        <div 
          ref={cardRef}
          className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden transform transition-all duration-300 hover:shadow-xl"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Playbook Header */}
          <div className="relative bg-gradient-to-r from-blue-500/30 via-blue-600/40 to-blue-700/30 backdrop-blur-md px-6 py-5 border border-blue-400/20 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-blue-500/15 to-blue-600/10 backdrop-blur-sm"></div>
            <div className="relative z-10 flex items-center">
              <span className="mr-4 text-blue-100 drop-shadow-lg">{currentPlaybook.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-lg">
                  {currentPlaybook.title}
                </h2>
                <p className="text-blue-100 text-sm font-medium drop-shadow-md">
                  Tip {currentTipIndex + 1} of {currentPlaybook.tips.length}
                </p>
              </div>
            </div>
          </div>

          {/* Current Tip Card */}
          <div className="p-8">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {currentTipIndex + 1}
                  </span>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-6 leading-tight">
                {currentPlaybook.tips[currentTipIndex].title}
              </h3>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
                <p className="text-gray-200 text-lg leading-relaxed font-medium">
                  {currentPlaybook.tips[currentTipIndex].description}
                </p>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevTip}
                className="flex items-center px-5 py-3 bg-white/20 text-gray-300 rounded-xl hover:bg-white/30 transition-all duration-200 font-medium shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Tip Indicators */}
              <div className="flex space-x-2">
                {currentPlaybook.tips.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTipIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentTipIndex
                        ? 'bg-blue-600 scale-125'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTip}
                className="flex items-center px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
              >
                Next
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Swipe Hint */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full shadow-sm border border-white/20">
            <svg className="w-4 h-4 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span className="text-gray-300 text-sm font-medium">
              Swipe or use buttons to navigate
            </span>
            <svg className="w-4 h-4 ml-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
