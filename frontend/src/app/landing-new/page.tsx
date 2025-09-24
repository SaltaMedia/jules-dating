'use client';

import Link from 'next/link';

export default function NewLandingPage() {
  return (
    <div className="min-h-screen bg-white">
            {/* Hero Section */}
      <section className="relative flex items-center justify-center px-4 py-12 sm:px-6 sm:py-16 bg-white">
        <div className="text-center text-black max-w-4xl mx-auto w-full">
          {/* Jules Logo */}
          <div className="mb-12 flex justify-center">
            <div className="flex items-center space-x-4">
              {/* CSS Logo with concentric circles */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-black rounded-full"></div>
                <div className="absolute top-1 left-1 w-16 h-16 sm:w-20 sm:h-20 border-2 border-black rounded-full"></div>
              </div>
              <h1 className="text-5xl sm:text-6xl font-light text-black tracking-wide">
                Jules
              </h1>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-black mb-8">
              WEAR WHO YOU ARE
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Confidence starts with how you show up. Jules is the only stylist trained by humans, informed by psychology, and styled by experts.
            </p>
          </div>

          <div className="flex justify-center">
            <Link
              href="/register"
              className="inline-block bg-purple-700 text-white px-10 py-5 rounded-lg text-xl font-semibold hover:bg-purple-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              MEET JULES
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gray-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-12">
            THE ONLY STYLIST TRAINED BY EXPERTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-white">
            <div className="bg-gray-700 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-4">Trained by Humans</h3>
              <p className="text-gray-300 text-lg">Not scraped from the internet. Jules is shaped by people who understand real confidence.</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-4">Informed by Psychology</h3>
              <p className="text-gray-300 text-lg">Guided by clinical expertise so her advice builds self-esteem, not insecurity.</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-4">Styled by Experts</h3>
              <p className="text-gray-300 text-lg">Real stylists train Jules with the same questions you'd ask in person.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-8">
            STYLE IS SELF-POSSESSION
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
            Jules was built to make it easier. She doesn't care what's trending. She cares whether your reflection makes you walk taller, smile wider, speak easier. She makes sure you look like the sharpest version of yourself.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
              FROM CLOSET TO CONFIDENCE
            </h2>
            <h3 className="text-xl font-semibold text-gray-700">
              How Jules Works
            </h3>
          </div>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">Chat with Jules</h3>
                <p className="text-gray-600">Ask Jules about style tips, outfit advice, anything lifestyle related.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">Get a Fit Check</h3>
                <p className="text-gray-600">Show Jules a photo and get blunt, stylish feedback.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">Log your Closet</h3>
                <p className="text-gray-600">Upload your clothes and Jules will help you build outfits based on what you have.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-block bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-800 transition-all duration-200 transform hover:scale-105"
            >
              MEET JULES
            </Link>
          </div>
        </div>
      </section>

      {/* Closing CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-8">
            LOOK SHARP. FEEL CONFIDENT. LIVE THE LIFE YOU WANT.
          </h2>
          <Link
            href="/register"
            className="inline-block bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-800 transition-all duration-200 transform hover:scale-105"
          >
            MEET JULES
          </Link>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-8 px-4 sm:px-6 bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-black mb-4 text-center">Disclaimer</h3>
          <p className="text-sm text-gray-600 leading-relaxed text-center">
            Jules is an AI-powered tool designed to provide general style, lifestyle, and confidence-related guidance. 
            Jules is not a licensed medical professional, therapist, or financial advisor, and no information provided by 
            Jules should be considered medical, psychological, or professional advice. Jules should not be used as a 
            substitute for professional diagnosis, treatment, or counseling. Always seek the advice of qualified 
            professionals with any questions you may have regarding your health, mental well-being, or other professional 
            matters. By using Jules, you acknowledge that all decisions you make remain your responsibility.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="relative">
              <div className="w-8 h-8 border border-white rounded-full"></div>
              <div className="absolute top-0.5 left-0.5 w-7 h-7 border border-white rounded-full"></div>
            </div>
            <span className="text-xl font-light text-white">Jules</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Human-trained. Expert-informed. Style you can trust.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-pink-400">Privacy</a>
            <a href="#" className="hover:text-pink-400">Terms of Use</a>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            Jules Labs, LLC © 2025
          </p>
        </div>
      </footer>


    </div>
  );
}
