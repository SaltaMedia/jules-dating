'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, default as api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import { track } from '@/analytics/client';

interface ProfilePicReview {
  _id: string;
  originalImageUrl: string;
  advice: string;
  rating: number;
  createdAt: string;
  specificQuestion?: string;
  analysis?: {
    overallRating: number;
    feedback: string;
  };
}

export default function ProfilePicReviewPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [userNotes, setUserNotes] = useState('');
  const [showNotesPrompt, setShowNotesPrompt] = useState(false);
  const [savedNotes, setSavedNotes] = useState('');
  const [profilePicReviews, setProfilePicReviews] = useState<ProfilePicReview[]>([]);
  const [selectedProfilePicReview, setSelectedProfilePicReview] = useState<ProfilePicReview | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Page visit tracking is handled by LayoutWrapper.tsx to avoid duplicates

  // Function to convert star emojis to visual star icons
  const renderStarRating = (text: string) => {
    return text.replace(/(\*\*Overall Rating:\*\*)\s*([⭐]+)/g, (match, label, stars) => {
      const starCount = stars.length;
      const filledStars = '★'.repeat(starCount);
      const emptyStars = '☆'.repeat(10 - starCount);
      return `${label} ${filledStars}${emptyStars}`;
    });
  };

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
      const token = localStorage.getItem('token');
      
      const profilePicReviewsResponse = await apiClient.get('/api/profile-pic-review/history');
      console.log('Fetched profile pic reviews:', profilePicReviewsResponse.data);
      setProfilePicReviews(profilePicReviewsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Check if it's a HEIC/HEIF file
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isHEIC = ['heic', 'heif'].includes(fileExtension || '');
    
    if (isHEIC) {
      // For HEIC files, we can't show a preview, but we can still upload them
      // Set a special marker so we can show a placeholder in the UI
      setSelectedImage('HEIC_FILE_PLACEHOLDER');
    } else {
      // For regular files, show normal preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      setError('Please select an image');
      return;
    }

    setIsLoading(true);
    setError(''); // Clear any previous errors
    try {
      const token = localStorage.getItem('token');
      
      // First, upload the image to Cloudinary
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (selectedImage !== 'HEIC_FILE_PLACEHOLDER') {
        const file = dataURLtoFile(selectedImage, 'profile-pic.jpg');
        formData.append('image', file);
      } else {
        // This shouldn't happen since we always have selectedFile for HEIC
        setError('Please select a valid image file');
        return;
      }

      const uploadResponse = await api.post('/api/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Then submit the profile pic review with the image URL
      const response = await apiClient.post('/api/profile-pic-review/submit', {
        imageUrl: uploadResponse.data.imageUrl,
        specificQuestion: specificQuestion.trim() || undefined
      });

      setFeedback(response.data.profilePicReview);

      // Automatically save the profile pic review
      try {
        await apiClient.put(`/api/profile-pic-review/${response.data.profilePicReview.id}/save`, {
          saved: true,
          savedAt: new Date().toISOString()
        });
        
        track('profile_pic_review_auto_saved', {
          has_specific_question: !!specificQuestion,
          rating: response.data.profilePicReview.rating
        });
        
        // Add the review to the list immediately after auto-save
        const autoSavedReview = {
          _id: response.data.profilePicReview.id,
          originalImageUrl: response.data.profilePicReview.originalImageUrl,
          advice: response.data.profilePicReview.advice,
          rating: response.data.profilePicReview.rating,
          analysis: response.data.profilePicReview.analysis,
          createdAt: response.data.profilePicReview.createdAt,
          saved: true,
          savedAt: new Date().toISOString()
        };
        
        setProfilePicReviews(prev => {
          // Check if review already exists in the list
          const exists = prev.some(review => review._id === response.data.profilePicReview.id);
          if (!exists) {
            return [autoSavedReview, ...prev];
          }
          return prev;
        });
      } catch (saveError) {
        console.error('Error auto-saving profile pic review:', saveError);
        // Don't show error to user since the main review was successful
      }

      // Track profile pic review upload success
      track('profile_pic_review_uploaded', { 
        has_specific_question: !!specificQuestion,
        rating: response.data.profilePicReview.rating
      });

      // Profile pic review tracking is handled by backend to avoid duplicates
    } catch (error: any) {
      console.error('Error submitting profile pic review:', error);
      
      // Extract and display the specific error message
      let errorMessage = 'Error submitting profile pic review. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="/Jules_Logo_White_Final_NoOutline.png"
              alt="Jules"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              style={{ transform: 'scale(3.75) translateX(10px)', transformOrigin: 'center' }}
            />
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto">
          <div className="w-full max-w-2xl mx-auto">
            {!feedback ? (
              <div className="space-y-6 pb-20">
                {/* Page Title */}
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Profile Pic Review
                  </h1>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Get honest feedback on your dating profile pictures
                  </p>
                </div>

                {/* Specific Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    What specific feedback do you want? <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={specificQuestion}
                    onChange={(e) => setSpecificQuestion(e.target.value)}
                    placeholder="e.g., Is this good for a first photo? How's my smile? Does this show my personality?"
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mobile-input"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload your profile picture
                  </label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-4 sm:p-8 text-center">
                    {selectedImage ? (
                      <div className="space-y-4">
                        {selectedImage === 'HEIC_FILE_PLACEHOLDER' ? (
                          <div className="w-full max-w-48 sm:max-w-64 h-48 sm:h-64 mx-auto rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center">
                            <div className="text-gray-400 text-center">
                              <div className="text-4xl mb-2">📱</div>
                              <p className="text-sm">HEIC file uploaded.</p>
                              <p className="text-xs text-gray-400 mt-1">Unable to preview, but upload will work perfectly!</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={selectedImage}
                            alt="Selected profile picture"
                            className="w-full max-w-48 sm:max-w-64 h-48 sm:h-64 mx-auto rounded-lg object-cover"
                          />
                        )}
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
                    disabled={!selectedImage || isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mobile-button"
                  >
                    {isLoading ? 'Analyzing...' : 'Get Profile Pic Review'}
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
                        setSpecificQuestion('');
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
                        {renderStarRating(feedback.analysis.feedback)}
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
                          <div className="text-sm">💭 Add your thoughts about this photo...</div>
                          <div className="text-xs text-gray-400 mt-1">How did it perform? Get any matches?</div>
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-300 mb-2">
                            <div className="font-medium mb-1">💡 Quick prompts:</div>
                            <div className="text-xs space-y-1">
                              <div>• "Did this photo get more matches?"</div>
                              <div>• "How did people respond to this photo?"</div>
                              <div>• "Would you use this as your main photo?"</div>
                              <div>• "What feedback did you get?"</div>
                            </div>
                          </div>
                          <textarea
                            value={userNotes}
                            onChange={(e) => setUserNotes(e.target.value)}
                            placeholder="Share your experience with this profile picture..."
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
                                    await apiClient.put(`/api/profile-pic-review/${feedback.id}/notes`, {
                                      notes: userNotes.trim()
                                    });
                                    setSavedNotes(userNotes.trim());
                                    showNotificationMessage('Notes saved successfully!');
                                  } else {
                                    showNotificationMessage('Cannot save notes: missing profile pic review data', 'error');
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
                  <div className="flex flex-col gap-3">
                    {/* Ask Jules About This Button */}
                    <button
                      onClick={() => {
                        if (!feedback) return;
                        
                        // Prepare context object for chat
                        const reviewContext = {
                          type: 'profile_pic_review',
                          imageUrl: feedback.originalImageUrl,
                          rating: feedback.rating,
                          feedback: feedback.analysis?.feedback || feedback.advice,
                          specificQuestion: specificQuestion,
                          reviewId: feedback.id,
                          timestamp: new Date().toISOString()
                        };
                        
                        // Store in localStorage for chat to pick up
                        localStorage.setItem('chatContext', JSON.stringify(reviewContext));
                        
                        // Track analytics
                        track('ask_jules_clicked', {
                          source: 'profile_pic_review',
                          rating: feedback.rating,
                          has_specific_question: !!specificQuestion
                        });
                        
                        // Navigate to chat
                        router.push('/chat?context=profile_pic_review');
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Ask Jules About This Review
                    </button>

                    {/* Try Another / Save Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          setFeedback(null);
                          setSelectedImage(null);
                          setSelectedFile(null);
                          setSpecificQuestion('');
                          setUserNotes('');
                          setSavedNotes('');
                          setShowNotesPrompt(false);
                        }}
                        className="flex-1 bg-white/20 text-white py-2 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        Try Another Photo
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Save the profile pic review feedback
                            if (feedback && feedback.id) {
                              await apiClient.put(`/api/profile-pic-review/${feedback.id}/save`, {
                                saved: true,
                                savedAt: new Date().toISOString()
                              });
                              
                              track('profile_pic_review_saved', {
                                profile_pic_rating: feedback?.rating,
                                has_specific_question: !!specificQuestion
                              });
                              
                              showNotificationMessage('Profile pic review saved successfully!');
                              
                              // Add the current review to the list if it's not already there
                              const currentReview = {
                                _id: feedback.id,
                                originalImageUrl: feedback.originalImageUrl,
                                advice: feedback.advice,
                                rating: feedback.rating,
                                analysis: feedback.analysis,
                                createdAt: feedback.createdAt,
                                saved: true,
                                savedAt: new Date().toISOString()
                              };
                              
                              setProfilePicReviews(prev => {
                                // Check if review already exists in the list
                                const exists = prev.some(review => review._id === feedback.id);
                                if (!exists) {
                                  return [currentReview, ...prev];
                                }
                                return prev;
                              });
                              
                              // Close the review modal and reset form
                              setFeedback(null);
                              setSelectedImage(null);
                              setSelectedFile(null);
                              setSpecificQuestion('');
                              setUserNotes('');
                              setSavedNotes('');
                              setShowNotesPrompt(false);
                            } else {
                              showNotificationMessage('Cannot save: missing profile pic review data', 'error');
                            }
                          } catch (error) {
                            console.error('Error saving profile pic review:', error);
                            showNotificationMessage('Error saving review. Please try again.', 'error');
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Pic Reviews Section */}
        <div className="mt-8">
          {profilePicReviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profilePicReviews.map((profilePicReview) => (
                <div
                  key={profilePicReview._id}
                  onClick={() => setSelectedProfilePicReview(profilePicReview)}
                  className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={profilePicReview.originalImageUrl}
                      alt="Profile pic review"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {profilePicReview.rating}/10
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-lg mb-1">
                      Profile Pic Review
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      {profilePicReview.analysis?.feedback ? 
                        profilePicReview.analysis.feedback.substring(0, 100) + '...' : 
                        profilePicReview.advice.substring(0, 100) + '...'
                      }
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {new Date(profilePicReview.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-purple-400 text-xs">View</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              {/* Empty state - no text needed */}
            </div>
          )}
        </div>
      </div>

      {/* Profile Pic Review Detail Modal */}
      {selectedProfilePicReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mobile-scroll-container">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-600">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Profile Pic Review Details</h2>
              <button
                onClick={() => setSelectedProfilePicReview(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Original Image */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Profile Picture:</h3>
                <div className="bg-gray-700 rounded-lg p-4">
                  <img
                    src={selectedProfilePicReview.originalImageUrl}
                    alt="Profile pic review"
                    className="w-full h-96 object-contain rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-gray-300">
                  {new Date(selectedProfilePicReview.createdAt).toLocaleDateString()}
                </span>
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {selectedProfilePicReview.rating}/10
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-md font-semibold text-white mb-3">Jules's Analysis:</h4>
                <div className="text-gray-200 leading-relaxed whitespace-pre-line">
                  {selectedProfilePicReview.analysis?.feedback ? 
                    selectedProfilePicReview.analysis.feedback : 
                    selectedProfilePicReview.advice
                  }
                </div>
              </div>

              <div className="flex flex-col space-y-3 pt-4 border-t border-gray-600">
                {/* Ask Jules Button */}
                <button
                  onClick={() => {
                    if (!selectedProfilePicReview) return;
                    
                    // Prepare context object for chat
                    const reviewContext = {
                      type: 'profile_pic_review',
                      imageUrl: selectedProfilePicReview.originalImageUrl,
                      rating: selectedProfilePicReview.rating,
                      feedback: selectedProfilePicReview.analysis?.feedback || selectedProfilePicReview.advice,
                      reviewId: selectedProfilePicReview._id,
                      timestamp: new Date().toISOString()
                    };
                    
                    // Store in localStorage for chat to pick up
                    localStorage.setItem('chatContext', JSON.stringify(reviewContext));
                    
                    // Track analytics
                    track('ask_jules_clicked', {
                      source: 'profile_pic_review_saved',
                      rating: selectedProfilePicReview.rating,
                      reviewId: selectedProfilePicReview._id
                    });
                    
                    // Close modal and navigate to chat
                    setSelectedProfilePicReview(null);
                    router.push('/chat?context=profile_pic_review');
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-2 mobile-button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Ask Jules About This Review
                </button>
                
                {/* Close and Delete Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setSelectedProfilePicReview(null)}
                    className="w-full sm:flex-1 bg-blue-600 text-white py-3 sm:py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mobile-button"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full sm:flex-1 bg-red-600 text-white py-3 sm:py-2 px-4 rounded-lg hover:bg-red-700 transition-colors mobile-button"
                  >
                    Delete Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Profile Pic Review</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this review? This action cannot be undone.</p>
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
                    await apiClient.delete(`/api/profile-pic-review/${selectedProfilePicReview?._id}`);
                    setSelectedProfilePicReview(null);
                    setShowDeleteConfirm(false);
                    showNotificationMessage('Profile pic review deleted successfully!');
                    await fetchData();
                  } catch (error) {
                    console.error('Error deleting profile pic review:', error);
                    showNotificationMessage('Error deleting review. Please try again.', 'error');
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

      {/* In-App Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-4 rounded-lg shadow-lg max-w-sm ${
            notificationType === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {notificationType === 'success' ? '✅' : '❌'}
              </span>
              <span className="font-medium">{notificationMessage}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

