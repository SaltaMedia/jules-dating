'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface DailyTip {
  _id: string;
  category: 'style' | 'confidence' | 'dating' | 'social';
  content: string;
  date: string;
  read: boolean;
}

interface DailyTipCardProps {
  onClose?: () => void;
  showOnLoad?: boolean;
}

const categoryIcons = {
  style: '👔',
  confidence: '💪',
  dating: '💕',
  social: '🤝'
};

const categoryColors = {
  style: 'bg-blue-50 border-blue-200',
  confidence: 'bg-green-50 border-green-200',
  dating: 'bg-pink-50 border-pink-200',
  social: 'bg-purple-50 border-purple-200'
};

export default function DailyTipCard({ onClose, showOnLoad = true }: DailyTipCardProps) {
  const [tip, setTip] = useState<DailyTip | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(showOnLoad);

  useEffect(() => {
    if (showOnLoad) {
      fetchTodaysTip();
    }
  }, [showOnLoad]);

  const fetchTodaysTip = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/daily-tips/today');
      setTip(response.data.tip);
    } catch (error) {
      console.error('Error fetching daily tip:', error);
      // Don't show error to user - just don't display the card
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!tip) return;
    
    try {
      await apiClient.post(`/api/daily-tips/${tip._id}/read`);
      setTip({ ...tip, read: true });
    } catch (error) {
      console.error('Error marking tip as read:', error);
    }
  };

  const handleClose = () => {
    setShow(false);
    if (tip && !tip.read) {
      markAsRead();
    }
    onClose?.();
  };

  if (!show || loading) {
    return null;
  }

  if (!tip) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto ${categoryColors[tip.category]} border rounded-lg shadow-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{categoryIcons[tip.category]}</span>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">
              Daily {tip.category} Tip
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(tip.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="mt-3">
        <p className="text-gray-800 leading-relaxed">
          {tip.content}
        </p>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={handleClose}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Got it
        </button>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Could add "Save to favorites" functionality here
              markAsRead();
            }}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
