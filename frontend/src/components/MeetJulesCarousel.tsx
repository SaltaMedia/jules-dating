'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Slide {
  id: string;
  title: string;
  image: string;
  alt: string;
  caption: string;
}

const slides: Slide[] = [
  {
    id: 'chat',
    title: 'Chat',
    image: '/Dating Chat.png',
    alt: 'Jules chat answering dating questions and giving advice',
    caption: 'Direct, honest advice in seconds.'
  },
  {
    id: 'profile-pic-review',
    title: 'Profile Pic Review',
    image: '/Pic Review.png',
    alt: 'Profile picture review with Jules feedback and analysis',
    caption: 'Upload your pic. Jules tells you what works and what to tweak.'
  },
  {
    id: 'fit-check',
    title: 'Fit Check',
    image: '/Fit Check 2.png',
    alt: 'Fit check result with outfit photo and Jules\'s written analysis',
    caption: 'Upload a fit. Jules tells you what works and what to tweak.'
  },
  {
    id: 'tips',
    title: 'Tips',
    image: '/Tips.png',
    alt: 'Dating tips and advice from Jules',
    caption: 'Get expert dating tips and build confidence.'
  }
];

export default function MeetJulesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Update current index based on scroll position
  const updateCurrentIndex = useCallback(() => {
    if (!trackRef.current) return;
    
    const track = trackRef.current;
    const trackLeft = track.offsetLeft;
    const trackWidth = track.offsetWidth;
    const scrollLeft = track.scrollLeft;
    
    // Find the slide that's most centered
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    slideRefs.current.forEach((slideRef, index) => {
      if (slideRef) {
        const slideLeft = slideRef.offsetLeft - trackLeft;
        const slideCenter = slideLeft + slideRef.offsetWidth / 2;
        const trackCenter = trackWidth / 2;
        const distance = Math.abs(slideCenter - trackCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });
    
    setCurrentIndex(closestIndex);
  }, []);

  // Handle scroll with debouncing
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(updateCurrentIndex, 50);
  }, [updateCurrentIndex]);

  // Navigate to specific slide
  const goToSlide = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, slides.length - 1));
    const slideRef = slideRefs.current[clampedIndex];
    const track = trackRef.current;
    
    if (slideRef && track) {
      const slideLeft = slideRef.offsetLeft - track.offsetLeft;
      track.scrollTo({
        left: slideLeft,
        behavior: 'smooth'
      });
    }
    
    setCurrentIndex(clampedIndex);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToSlide(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, goToSlide]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section 
      className="w-full bg-transparent py-16"
      aria-labelledby="meet-jules"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-300">
            Jules in Action
          </h3>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Arrow Navigation - Desktop Only */}
          <button
            onClick={() => goToSlide(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-zinc-800/80 ring-1 ring-white/10 p-2 text-zinc-100 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => goToSlide(currentIndex + 1)}
            disabled={currentIndex === slides.length - 1}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-zinc-800/80 ring-1 ring-white/10 p-2 text-zinc-100 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Carousel Track */}
          <div
            ref={trackRef}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-6 px-6"
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-label="Jules app screenshots carousel"
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                ref={(el) => {
                  slideRefs.current[index] = el;
                }}
                className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[420px] xl:w-[520px] snap-center px-2"
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${index + 1} of ${slides.length}: ${slide.title}`}
              >
                <div className="rounded-2xl border border-white/30 bg-zinc-900/40 backdrop-blur shadow-lg p-4">
                  {/* Title above image */}
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-3 text-center">
                    {slide.title}
                  </h3>
                  
                  {/* Image Container */}
                  <div className="relative aspect-[9/16] rounded-xl ring-1 ring-white/10 overflow-hidden">
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      className="object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      sizes="(max-width: 640px) 280px, (max-width: 1024px) 420px, 520px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>



      </div>
    </section>
  );
}
