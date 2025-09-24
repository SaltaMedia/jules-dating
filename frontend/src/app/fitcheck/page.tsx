'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, default as api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import { track } from '@/analytics/client';

interface Outfit {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  items: any[];
  occasion?: string;
  season?: string;
  createdAt?: string;
  rating?: number;
  feedback?: string;
  context?: {
    event?: string;
    season?: string;
    formality?: string;
  };
  score?: number;
  visualCollage?: {
    type: string;
    mainImage: string;
    allImages: string[];
    layout: string;
  };
  aiGeneratedImage?: {
    type: string;
    imageUrl: string;
    description: string;
  };
  hasVisualData?: boolean;
}

interface FitCheck {
  _id: string;
  eventContext: string;
  originalImageUrl: string;
  advice: string;
  rating: number;
  createdAt: string;
  itemId?: string;
  specificQuestion?: string;
  items?: Array<{
    itemId: string;
    name: string;
    imageUrl?: string;
    category?: string;
    role?: string;
  }>;
  analysis?: {
    overallRating: number;
    feedback: string;
  };
}

export default function FitCheckPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [eventContext, setEventContext] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [userNotes, setUserNotes] = useState('');
  const [showNotesPrompt, setShowNotesPrompt] = useState(false);
  const [savedNotes, setSavedNotes] = useState('');
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [fitChecks, setFitChecks] = useState<FitCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFitCheck, setSelectedFitCheck] = useState<FitCheck | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const [outfitsResponse, fitChecksResponse] = await Promise.all([
        apiClient.get('/api/outfits'),
        apiClient.get('/api/fit-check/history')
      ]);

      setOutfits(outfitsResponse.data.outfits || []);
      setFitChecks(fitChecksResponse.data.fitChecks || []);
    } catch (error) {
      console.error('Error fetching fit check data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      alert('Please select an image');
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      
      // First, upload the image to Cloudinary
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      } else {
        const file = dataURLtoFile(selectedImage, 'outfit.jpg');
        formData.append('image', file);
      }

      const uploadResponse = await api.post('/api/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Then submit the fit check with the image URL
      const response = await apiClient.post('/api/fit-check/submit', {
        imageUrl: uploadResponse.data.imageUrl,
        eventContext: eventContext.trim() || undefined
      });

      setFeedback(response.data.fitCheck);

      // Automatically save the fit check
      try {
        await apiClient.put(`/api/fit-check/${response.data.fitCheck.id}/save`, {
          saved: true,
          savedAt: new Date().toISOString()
        });
        
        track('fit_check_auto_saved', {
          event_context: eventContext || 'general',
          rating: response.data.fitCheck.rating
        });
        
        // Add the fit check to the list immediately after auto-save
        const autoSavedFitCheck = {
          _id: response.data.fitCheck.id,
          originalImageUrl: response.data.fitCheck.originalImageUrl,
          advice: response.data.fitCheck.advice,
          rating: response.data.fitCheck.rating,
          analysis: response.data.fitCheck.analysis,
          eventContext: response.data.fitCheck.eventContext,
          createdAt: response.data.fitCheck.createdAt,
          saved: true,
          savedAt: new Date().toISOString()
        };
        
        setFitChecks(prev => {
          // Check if fit check already exists in the list
          const exists = prev.some(fitCheck => fitCheck._id === response.data.fitCheck.id);
          if (!exists) {
            return [autoSavedFitCheck, ...prev];
          }
          return prev;
        });
      } catch (saveError) {
        console.error('Error auto-saving fit check:', saveError);
        // Don't show error to user since the main review was successful
      }

      // Track fit check upload success
      const numImages = 1;
      const imageQualityBucket = 'med';
      track('fit_check_uploaded', { 
        num_images: numImages, 
        image_quality_bucket: imageQualityBucket,
        event_context: eventContext || 'general'
      });
    } catch (error) {
      console.error('Error submitting fit check:', error);
      alert('Error submitting fit check. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to convert data URL to file
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };


  const handleShareLook = (fitCheck?: FitCheck) => {
    // If a specific fit check is provided, use it; otherwise use the selected fit check
    const fitCheckToShare = fitCheck || selectedFitCheck;
    
    if (fitCheckToShare) {
      // Store fit check data in localStorage for the community page
      const fitCheckData = {
        imageUrl: fitCheckToShare.originalImageUrl,
        caption: `Fit check for ${fitCheckToShare.eventContext || 'my outfit'}`,
        tags: ['fit-check'],
        source: 'fit_check',
        julesFeedback: fitCheckToShare.analysis?.feedback || fitCheckToShare.advice
      };
      localStorage.setItem('fitCheckToShare', JSON.stringify(fitCheckData));
    }
    
    // Navigate to community page with share action
    router.push('/community?action=share');
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    // Removed auto-hide timeout - user will close manually with X button
  };


  const getFitCheckTitle = (fitCheck: FitCheck) => {
    return fitCheck.eventContext || 'Fit Check';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading your fits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Fit Check</h1>
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="w-full max-w-2xl mx-auto">
            {!feedback ? (
              <div className="space-y-6 pb-20">
                {/* Page Title */}
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Fit Check
                  </h1>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Get honest feedback on your outfit choices
                  </p>
                </div>

                {/* Event Context */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Give me some context <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={eventContext}
                    onChange={(e) => setEventContext(e.target.value)}
                    placeholder="e.g., casual date at coffee shop, first date, job interview..."
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mobile-input"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload your outfit photo
                  </label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-4 sm:p-8 text-center">
                    {selectedImage ? (
                      <div className="space-y-4">
                        <img
                          src={selectedImage}
                          alt="Selected outfit"
                          className="w-full max-w-48 sm:max-w-64 h-48 sm:h-64 mx-auto rounded-lg object-cover"
                        />
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove photo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="block w-full px-4 sm:px-6 py-3 rounded-lg transition-colors cursor-pointer bg-white/20 hover:bg-white/30 text-white border border-white/30 touch-manipulation mobile-button"
                        >
                          📱 Add a Photo
                        </label>
                        
                        <p className="text-sm text-gray-400 mt-2">
                          Choose a photo from your gallery
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button - Sticky on Mobile */}
                <div className="sticky bottom-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 pt-4 pb-2 -mx-4 px-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedImage || isUploading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mobile-button"
                  >
                    {isUploading ? 'Analyzing...' : 'Get Fit Check'}
                  </button>
                </div>
              </div>
            ) : (
              /* Feedback Display */
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Jules's Feedback</h2>
                    <button
                      onClick={() => {
                        setFeedback(null);
                        setSelectedImage(null);
                        setSelectedFile(null);
                        setEventContext('');
                        setUserNotes('');
                        setSavedNotes('');
                        setShowNotesPrompt(false);
                      }}
                      className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Feedback Text */}
                  <div className="mb-6">
                    <div className="text-white leading-relaxed prose prose-invert max-w-none [&_*]:text-gray-300">
                      <ReactMarkdown
                        components={{
                          h1: ({children}) => <h1 className="text-xl font-bold text-white mb-3">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-bold text-white mb-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-base font-bold text-white mb-2">{children}</h3>,
                          p: ({children}) => <p className="text-white mb-3">{children}</p>,
                          strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                          ul: ({children}) => <ul className="list-disc list-inside text-white mb-3 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-white mb-3 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-white">{children}</li>
                        }}
                      >
                        {feedback.analysis?.feedback || feedback.advice}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* User Notes Section */}
                  <div className="mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">Your Notes</h3>
                      
                      {savedNotes ? (
                        <div className="space-y-3">
                          <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-white text-sm">{savedNotes}</p>
                          </div>
                        </div>
                      ) : !showNotesPrompt ? (
                        <button
                          onClick={() => setShowNotesPrompt(true)}
                          className="w-full text-left text-gray-300 hover:text-white transition-colors p-3 border border-dashed border-white/20 rounded-lg hover:border-white/40"
                        >
                          <div className="text-sm">💭 Add your thoughts about this fit...</div>
                          <div className="text-xs text-gray-400 mt-1">How did it feel? Get any compliments?</div>
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-300 mb-2">
                            <div className="font-medium mb-1">💡 Quick prompts:</div>
                            <div className="text-xs space-y-1">
                              <div>• "Do you feel confident in this fit?"</div>
                              <div>• "Did you get any compliments?"</div>
                              <div>• "How did it perform for the occasion?"</div>
                              <div>• "Would you wear this again?"</div>
                            </div>
                          </div>
                          <textarea
                            value={userNotes}
                            onChange={(e) => setUserNotes(e.target.value)}
                            placeholder="Share your experience with this outfit..."
                            className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            rows={4}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setUserNotes('');
                                setShowNotesPrompt(false);
                              }}
                              className="px-3 py-1 text-sm bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  if (feedback && feedback.id && userNotes.trim()) {
                                    await apiClient.put(`/api/fit-check/${feedback.id}/notes`, {
                                      notes: userNotes.trim()
                                    });
                                    setSavedNotes(userNotes.trim());
                                    showNotificationMessage('Notes saved successfully!');
                                  } else {
                                    showNotificationMessage('Cannot save notes: missing fit check data', 'error');
                                  }
                                  setShowNotesPrompt(false);
                                } catch (error) {
                                  console.error('Error saving notes:', error);
                                  showNotificationMessage('Error saving notes. Please try again.', 'error');
                                }
                              }}
                              className="px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                            >
                              Save Notes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setFeedback(null);
                        setSelectedImage(null);
                        setSelectedFile(null);
                        setEventContext('');
                        setUserNotes('');
                        setSavedNotes('');
                        setShowNotesPrompt(false);
                      }}
                      className="flex-1 bg-white/20 text-white py-2 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      Try Another Outfit
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          // Save the fit check feedback
                          if (feedback && feedback.id) {
                            await apiClient.put(`/api/fit-check/${feedback.id}/save`, {
                              saved: true,
                              savedAt: new Date().toISOString()
                            });
                            
                            track('fit_check_saved', {
                              fit_check_rating: feedback?.rating,
                              event_context: eventContext
                            });
                            
                            showNotificationMessage('Fit check saved successfully!');
                            
                            // Add the current fit check to the list if it's not already there
                            const currentFitCheck = {
                              _id: feedback.id,
                              originalImageUrl: feedback.originalImageUrl,
                              advice: feedback.advice,
                              rating: feedback.rating,
                              analysis: feedback.analysis,
                              eventContext: feedback.eventContext,
                              createdAt: feedback.createdAt,
                              saved: true,
                              savedAt: new Date().toISOString()
                            };
                            
                            setFitChecks(prev => {
                              const exists = prev.some(fitCheck => fitCheck._id === feedback.id);
                              if (!exists) {
                                return [currentFitCheck, ...prev];
                              }
                              return prev;
                            });
                            
                            // Close the review modal and reset form
                            setFeedback(null);
                            setSelectedImage(null);
                            setSelectedFile(null);
                            setEventContext('');
                            setUserNotes('');
                            setSavedNotes('');
                            setShowNotesPrompt(false);
                          } else {
                            showNotificationMessage('Cannot save: missing fit check data', 'error');
                          }
                        } catch (error) {
                          console.error('Error saving fit check:', error);
                          showNotificationMessage('Error saving fit check. Please try again.', 'error');
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Fits */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Your Fit Checks</h2>
          

          {/* Saved Fits and Fit Checks */}
          {outfits.length === 0 && fitChecks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No fit checks yet</h3>
              <p className="text-gray-300 mb-6">Start getting fit checks from Jules to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Saved Fit Checks */}
              {fitChecks.map((fitCheck) => (
                <div 
                  key={fitCheck._id} 
                  className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-colors cursor-pointer"
                  onClick={() => setSelectedFitCheck(fitCheck)}
                >
                  <div className="relative">
                    <img
                      src={fitCheck.originalImageUrl}
                      alt="Fit check"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-lg mb-1">
                      {getFitCheckTitle(fitCheck)}
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      {fitCheck.analysis?.feedback ? 
                        fitCheck.analysis.feedback.substring(0, 100) + '...' : 
                        fitCheck.advice.substring(0, 100) + '...'
                      }
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {new Date(fitCheck.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-purple-400 text-xs">View</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Fit Check Detail Modal */}
      {selectedFitCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-600">
              <h2 className="text-xl font-semibold text-white">Jules's Feedback</h2>
              <button
                onClick={() => {
                  setSelectedFitCheck(null);
                  setCurrentItemIndex(0); // Reset index when closing
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Fit Items Display with Navigation */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Fit:</h3>
                {selectedFitCheck.items && selectedFitCheck.items.length > 0 ? (
                  <div className="relative">
                    {/* Navigation Arrows */}
                    {selectedFitCheck.items.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentItemIndex(prev => prev === 0 ? (selectedFitCheck.items?.length || 1) - 1 : prev - 1)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                        >
                          <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentItemIndex(prev => prev === (selectedFitCheck.items?.length || 1) - 1 ? 0 : prev + 1)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                        >
                          <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                    
                    {/* Current Item Display */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      {selectedFitCheck.items[currentItemIndex]?.imageUrl ? (
                        <img
                          src={selectedFitCheck.items[currentItemIndex].imageUrl}
                          alt={selectedFitCheck.items[currentItemIndex].name || 'Clothing item'}
                          className="w-full h-64 object-cover rounded-lg mb-4"
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">No image</span>
                        </div>
                      )}
                      <h4 className="font-medium text-white text-lg">{selectedFitCheck.items[currentItemIndex]?.name || 'Clothing item'}</h4>
                      <p className="text-sm text-gray-300 capitalize mb-2">{selectedFitCheck.items[currentItemIndex]?.category || 'item'}</p>
                      <p className="text-xs text-gray-400">Item {currentItemIndex + 1} of {selectedFitCheck.items.length}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-700 rounded-lg p-8 text-center">
                    <img
                      src={selectedFitCheck.originalImageUrl}
                      alt="Fit check"
                      className="w-full h-96 object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <span className="text-sm text-gray-400">
                  {new Date(selectedFitCheck.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedFitCheck.eventContext}</h3>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-semibold text-white mb-3">Jules's Analysis:</h4>
                <div className="text-gray-200 leading-relaxed whitespace-pre-line">
                  {selectedFitCheck.analysis?.feedback ? 
                    selectedFitCheck.analysis.feedback.replace(/^\*\*1\.\s*Overall Rating[:\s]*\d.*?\n/, '') : 
                    selectedFitCheck.advice
                  }
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedFitCheck(null);
                    router.push('/fit-check');
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Another Fit Check
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Fit Check</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this fit check? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (selectedFitCheck) {
                      await apiClient.delete(`/api/fit-check/${selectedFitCheck._id}`);
                      setSelectedFitCheck(null);
                      setShowDeleteConfirm(false);
                      showNotificationMessage('Fit check deleted successfully!');
                      await fetchData(); // Refresh the list
                    }
                  } catch (error) {
                    console.error('Error deleting fit check:', error);
                    showNotificationMessage('Error deleting fit check. Please try again.', 'error');
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Notification Modal */}
      {showNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Semi-transparent backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowNotification(false)}></div>
          
          {/* Modal content */}
          <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md mx-4 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <span className="mr-3 text-2xl">
                  {notificationType === 'success' ? '✅' : '❌'}
                </span>
                <span className={`font-medium text-lg ${
                  notificationType === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {notificationMessage}
                </span>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="ml-4 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
