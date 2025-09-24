'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface OutfitBuilderProps {
  onClose: () => void;
}

interface GeneratedOutfit {
  items: Array<{
    itemId: string;
    role: string;
  }>;
  score: number;
  context: any;
  gaps: string[];
  explanation: string;
  createdFrom: string;
}

const EVENTS = [
  'first-date', 'office', 'wedding-guest', 'weekend', 'casual-hangout',
  'business-meeting', 'dinner-party', 'outdoor-activity', 'travel'
];

const VIBES = [
  'minimal', 'bold', 'rugged', 'elegant', 'casual', 'confident',
  'creative', 'professional', 'relaxed', 'sophisticated'
];

const FORMALITY_LEVELS = [
  'casual', 'smart-casual', 'business-casual', 'formal', 'athleisure'
];

const SEASONS = ['spring', 'summer', 'fall', 'winter'];

export default function OutfitBuilder({ onClose }: OutfitBuilderProps) {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedFormality, setSelectedFormality] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [weather, setWeather] = useState({ tempC: 20, precip: false });
  const [outfitCount, setOutfitCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfits, setGeneratedOutfits] = useState<GeneratedOutfit[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<GeneratedOutfit | null>(null);

  const generateOutfits = async () => {
    if (!selectedEvent) {
      // Use a simple error state instead of alert
      console.error('Please select an event');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('/api/outfits/generate', {
        event: selectedEvent,
        vibe: selectedVibes,
        weather,
        season: selectedSeason,
        formality: selectedFormality,
        count: outfitCount
      });

      setGeneratedOutfits(response.data.outfits);
    } catch (error: any) {
      console.error('Error generating outfits:', error);
      // Log error but don't show alert
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };

  const saveOutfit = async (outfit: GeneratedOutfit) => {
    try {
      await axios.post('/api/outfits', {
        name: `${selectedEvent} outfit`,
        items: outfit.items,
        context: outfit.context,
        score: outfit.score,
        gaps: outfit.gaps,
        createdFrom: 'auto'
      });
      console.log('Outfit saved successfully!');
    } catch (error) {
      console.error('Error saving outfit:', error);
    }
  };

  const addFeedback = async (outfit: GeneratedOutfit, like: boolean) => {
    try {
      await axios.post(`/api/outfits/${outfit.items[0]?.itemId}/feedback`, {
        like,
        note: like ? 'User liked this outfit' : 'User disliked this outfit'
      });
    } catch (error) {
      console.error('Error adding feedback:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Outfit Builder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Context Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event *
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an event</option>
              {EVENTS.map(event => (
                <option key={event} value={event}>
                  {event.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Formality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formality Level
            </label>
            <select
              value={selectedFormality}
              onChange={(e) => setSelectedFormality(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any formality</option>
              {FORMALITY_LEVELS.map(formality => (
                <option key={formality} value={formality}>
                  {formality.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any season</option>
              {SEASONS.map(season => (
                <option key={season} value={season}>
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Weather */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weather
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600">Temperature (°C)</label>
                <input
                  type="number"
                  value={weather.tempC}
                  onChange={(e) => setWeather(prev => ({ ...prev, tempC: parseInt(e.target.value) || 20 }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={weather.precip}
                    onChange={(e) => setWeather(prev => ({ ...prev, precip: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Precipitation</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Vibe Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vibe (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(vibe => (
              <button
                key={vibe}
                onClick={() => toggleVibe(vibe)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedVibes.includes(vibe)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {vibe.charAt(0).toUpperCase() + vibe.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Outfit Count */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Outfits
          </label>
          <input
            type="range"
            min="3"
            max="12"
            value={outfitCount}
            onChange={(e) => setOutfitCount(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>3</span>
            <span>{outfitCount}</span>
            <span>12</span>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-8">
          <button
            onClick={generateOutfits}
            disabled={isGenerating || !selectedEvent}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating Outfits...' : 'Generate Outfits'}
          </button>
        </div>

        {/* Generated Outfits */}
        {generatedOutfits.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Generated Outfits ({generatedOutfits.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedOutfits.map((outfit, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        Outfit {index + 1}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        outfit.score > 0.8 ? 'bg-green-100 text-green-800' :
                        outfit.score > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(outfit.score * 100)}%
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => addFeedback(outfit, true)}
                        className="text-green-600 hover:text-green-800"
                        title="Like"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => addFeedback(outfit, false)}
                        className="text-red-600 hover:text-red-800"
                        title="Dislike"
                      >
                        👎
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">
                      {outfit.explanation}
                    </p>
                  </div>

                  {outfit.gaps.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-orange-600 font-medium mb-1">Gaps:</p>
                      <ul className="text-xs text-orange-600">
                        {outfit.gaps.map((gap, gapIndex) => (
                          <li key={gapIndex}>• {gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedOutfit(outfit)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => saveOutfit(outfit)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outfit Details Modal */}
        {selectedOutfit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Outfit Details</h3>
                <button
                  onClick={() => setSelectedOutfit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
                  <p className="text-gray-600">{selectedOutfit.explanation}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedOutfit.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">
                          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">{item.itemId}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOutfit.gaps.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Gaps</h4>
                    <ul className="text-sm text-orange-600">
                      {selectedOutfit.gaps.map((gap, index) => (
                        <li key={index}>• {gap}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => saveOutfit(selectedOutfit)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Save Outfit
                  </button>
                  <button
                    onClick={() => setSelectedOutfit(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 