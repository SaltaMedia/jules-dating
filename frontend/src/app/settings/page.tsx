'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { MessageSquare, Search, Trash2, Eye, Calendar } from 'lucide-react';

interface OnboardingQuestion {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'multiselect' | 'array' | 'photo';
  label: string;
  description?: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  section: string;
}

interface OnboardingData {
  // Profile Basics
  name: string;
  age: string;
  zipCode: string;
  
  // Style
  styleVibe: string[];
  datingVibes: string[];
  
  // Open Context
  openContext: string;
  
  // Basic Info (Legacy)
  email: string;
  aboutMe: string;
  
  // Body Info
  height: string;
  weight: string;
  topSize: string;
  bottomSize: string;
  shoeSize: string;
  bodyType: string;
  facialHair: string;
  
  // Lifestyle
  weeklyEnvironment: string;
  socialEventFrequency: string;
  worksOut: string;
  relationshipStatus: string;
  
  // Style Preferences
  preferredStyles: string[];
  colorsLove: string[];
  fitPreference: string[];
  favoriteBrands: string[];
  styleNotes: string;
  noGoItems: string[];
  
  // Grooming & Accessories
  accessoriesWorn: string[];
  wantMoreAccessories: string;
  shoeTypes: string;
  
  // Budget
  monthlyClothingBudget: string;
  budgetType: string[];
  
  // Picture
  profilePhoto: string;
}

interface ChatSession {
  _id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}


const sections = [
  'Profile Basics',
  'Style',
  'Open Context',
  'Chat History',
  'Privacy & Data',
  'Feedback'
];

export default function SettingsPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [arrayInputValues, setArrayInputValues] = useState<{ [key: string]: string }>({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  
  // Chat History state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  
  // Privacy & Data state
  const [consentPreferences, setConsentPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  const [privacyLoading, setPrivacyLoading] = useState(false);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  
  const [data, setData] = useState<OnboardingData>({
    // Profile Basics
    name: '',
    age: '',
    zipCode: '',
    
    // Style
    styleVibe: [],
    datingVibes: [],
    
    // Open Context
    openContext: '',
    
    // Basic Info (Legacy)
    email: '',
    aboutMe: '',
    
    // Body Info
    height: '',
    weight: '',
    topSize: '',
    bottomSize: '',
    shoeSize: '',
    bodyType: 'Average',
    facialHair: 'Clean shaven',
    
    // Lifestyle
    weeklyEnvironment: 'Office',
    socialEventFrequency: 'Occasionally',
    worksOut: 'No',
    relationshipStatus: 'Single',
    
    // Style Preferences
    preferredStyles: [],
    colorsLove: [],
    fitPreference: [],
    favoriteBrands: [],
    styleNotes: '',
    noGoItems: [],
    
    // Grooming & Accessories
    accessoriesWorn: [],
    wantMoreAccessories: 'No',
    shoeTypes: '',
    
    // Budget
    monthlyClothingBudget: '$100 - $250',
    budgetType: [],
    
    // Picture
    profilePhoto: ''
  });

  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load onboarding questions and user data
    loadOnboardingQuestions();
    loadUserData();
  }, [router]);

  // Load chat sessions when Chat History tab is selected
  useEffect(() => {
    if (currentSection === 3) { // Chat History is at index 3
      loadChatSessions();
    }
  }, [currentSection, searchQuery]);


  const loadOnboardingQuestions = async () => {
    try {
      const response = await apiClient.get('/api/onboarding/questions');
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error loading onboarding questions:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      const userData = response.data;
      
      console.log('Loaded user data:', userData);
      
      // Map user data to onboarding format
      const mappedData = {
        ...data,
        // Profile Basics
        name: userData.onboarding?.name || userData.name || '',
        age: userData.onboarding?.age || userData.age || '',
        zipCode: userData.onboarding?.cityOrZipCode || userData.onboarding?.zipCode || '',
        
        // Style
        styleVibe: Array.isArray(userData.onboarding?.styleVibe) ? userData.onboarding.styleVibe : [],
        datingVibes: Array.isArray(userData.onboarding?.datingVibes) ? userData.onboarding.datingVibes : [],
        
        // Open Context
        openContext: userData.onboarding?.openContext || userData.settings?.openContext || '',
        
        // Basic Info (Legacy)
        email: userData.onboarding?.email || userData.email || '',
        aboutMe: userData.onboarding?.aboutMe || userData.settings?.aboutMe || '',
        
        // Body Info
        height: userData.onboarding?.height || userData.bodyInfo?.height || '',
        weight: userData.onboarding?.weight || userData.bodyInfo?.weight || '',
        topSize: userData.onboarding?.shirtSize || userData.onboarding?.topSize || userData.bodyInfo?.topSize || '',
        bottomSize: userData.onboarding?.pantSize || userData.onboarding?.bottomSize || userData.bodyInfo?.bottomSize || '',
        shoeSize: userData.onboarding?.shoeSize || userData.bodyInfo?.shoeSize || '',
        bodyType: userData.onboarding?.bodyType || userData.bodyInfo?.bodyType || 'Average',
        facialHair: userData.onboarding?.facialHair || 'Clean shaven',
        
        // Lifestyle
        weeklyEnvironment: userData.onboarding?.jobType || userData.onboarding?.weeklyEnvironment || 'Office',
        socialEventFrequency: userData.onboarding?.socialLife || userData.onboarding?.socialEventFrequency || 'Occasionally',
        worksOut: userData.onboarding?.worksOut || 'No',
        relationshipStatus: userData.onboarding?.relationshipStatus || 'Single',
        
        // Style Preferences
        preferredStyles: Array.isArray(userData.onboarding?.preferredStyles) ? userData.onboarding.preferredStyles : 
                        Array.isArray(userData.onboarding?.styleVibes) ? userData.onboarding.styleVibes : [],
        colorsLove: Array.isArray(userData.onboarding?.colorsLove) ? userData.onboarding.colorsLove : [],
        fitPreference: Array.isArray(userData.onboarding?.fitPreference) ? userData.onboarding.fitPreference : [],
        favoriteBrands: Array.isArray(userData.onboarding?.favoriteBrands) ? userData.onboarding.favoriteBrands : 
                       Array.isArray(userData.stylePreferences?.brands) ? userData.stylePreferences.brands : [],
        styleNotes: userData.onboarding?.styleNotes || '',
        noGoItems: Array.isArray(userData.onboarding?.itemsYouHate) ? userData.onboarding.itemsYouHate : 
                   Array.isArray(userData.onboarding?.noGoItems) ? userData.onboarding.noGoItems : [],
        
        // Grooming & Accessories
        accessoriesWorn: Array.isArray(userData.onboarding?.accessoriesWorn) ? userData.onboarding.accessoriesWorn : [],
        wantMoreAccessories: userData.onboarding?.wantMoreAccessories || 'No',
        shoeTypes: userData.onboarding?.shoeTypes || '',
        
        // Budget
        monthlyClothingBudget: userData.onboarding?.monthlyClothingBudget || '$100 - $250',
        budgetType: Array.isArray(userData.onboarding?.budgetType) ? userData.onboarding.budgetType : [],
        
        // Picture
        profilePhoto: userData.onboarding?.profilePhoto || userData.picture || ''
      };
      
      console.log('Mapped data:', mappedData);
      setData(mappedData);
    } catch (error) {
      console.error('Error loading user data:', error);
      // Show error notification
      showNotificationMessage('Error loading user data. Please refresh the page.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Chat History functions
  const loadChatSessions = async () => {
    try {
      setChatHistoryLoading(true);
      const response = await apiClient.get(`/api/chat?search=${encodeURIComponent(searchQuery)}&limit=50`);
      setChatSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      showNotificationMessage('Error loading chat history', 'error');
    } finally {
      setChatHistoryLoading(false);
    }
  };

  const deleteChatSession = async (sessionId: string) => {
    try {
      await apiClient.delete(`/api/chat/${sessionId}`);
      setChatSessions(prev => prev.filter(session => session._id !== sessionId));
      showNotificationMessage('Chat session deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting chat session:', error);
      showNotificationMessage('Error deleting chat session', 'error');
    }
  };

  const bulkDeleteSessions = async () => {
    if (selectedSessions.length === 0) return;
    
    try {
      await apiClient.post('/api/chat/cleanup', {
        sessionIds: selectedSessions
      });
      setChatSessions(prev => prev.filter(session => !selectedSessions.includes(session._id)));
      setSelectedSessions([]);
      showNotificationMessage(`${selectedSessions.length} chat sessions deleted successfully`, 'success');
    } catch (error) {
      console.error('Error bulk deleting chat sessions:', error);
      showNotificationMessage('Error deleting chat sessions', 'error');
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const selectAllSessions = () => {
    setSelectedSessions(chatSessions.map(session => session._id));
  };

  const clearSelection = () => {
    setSelectedSessions([]);
  };

  // Privacy & Data functions
  const exportUserData = async () => {
    setPrivacyLoading(true);
    try {
      const response = await apiClient.get('/api/auth/gdpr/data');
      
      // Create and download file
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jules-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showNotificationMessage('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotificationMessage('Error exporting data. Please try again.', 'error');
    } finally {
      setPrivacyLoading(false);
    }
  };

  const deleteUserData = async () => {
    const confirmation = prompt('Type "DELETE_MY_DATA" to confirm permanent deletion of all your data:');
    
    if (confirmation !== 'DELETE_MY_DATA') {
      showNotificationMessage('Deletion cancelled. You must type the exact confirmation phrase.', 'error');
      return;
    }

    setPrivacyLoading(true);
    try {
      await apiClient.delete('/api/auth/gdpr/delete', {
        data: { confirmation: 'DELETE_MY_DATA' }
      });
      
      showNotificationMessage('Your data has been deleted successfully. You will be logged out.', 'success');
      // Redirect to home page after deletion
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error deleting data:', error);
      showNotificationMessage('Error deleting data. Please try again.', 'error');
    } finally {
      setPrivacyLoading(false);
    }
  };

  const updateConsentPreferences = async () => {
    setPrivacyLoading(true);
    try {
      await apiClient.put('/api/auth/gdpr/consent', {
        consentPreferences: consentPreferences
      });
      showNotificationMessage('Consent preferences updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating consent:', error);
      showNotificationMessage('Error updating consent preferences. Please try again.', 'error');
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleConsentChange = (key: string, value: boolean) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setConsentPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Feedback functions
  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      showNotificationMessage('Please enter some feedback before submitting.', 'error');
      return;
    }

    setFeedbackLoading(true);
    try {
      await apiClient.post('/api/feedback', {
        message: feedbackText.trim(),
        timestamp: new Date().toISOString()
      });
      
      setFeedbackText('');
      showNotificationMessage('Thank you for your feedback! We\'ll review it and get back to you if needed.', 'success');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showNotificationMessage('Error submitting feedback. Please try again.', 'error');
    } finally {
      setFeedbackLoading(false);
    }
  };


  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayAdd = (field: keyof OnboardingData, value: string) => {
    if (!value.trim()) return;
    
    const currentField = data[field];
    const currentArray = Array.isArray(currentField) ? currentField : [];
    
    if (!currentArray.includes(value.trim())) {
      setData(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
    }
  };

  const handleArrayRemove = (field: keyof OnboardingData, value: string) => {
    const currentField = data[field];
    const currentArray = Array.isArray(currentField) ? currentField : [];
    
    setData(prev => ({
      ...prev,
      [field]: currentArray.filter(item => item !== value)
    }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotificationMessage('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotificationMessage('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Use test upload endpoint in development to avoid authentication issues
      const isDevelopment = process.env.NODE_ENV === 'development';
      const response = isDevelopment 
        ? await apiClient.post('/api/images/upload/test', formData)
        : await apiClient.post('/api/images/upload', formData);

      setData(prev => ({ ...prev, profilePhoto: response.data.imageUrl }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      showNotificationMessage('Error uploading photo. Please try again.', 'error');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await apiClient.put('/api/onboarding/update', data);
      setMessage('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage(error.response?.data?.error || 'Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getSectionQuestions = (sectionName: string) => {
    return questions.filter(q => q.section === sectionName);
  };

  const isSectionComplete = (sectionName: string) => {
    // Chat History, Privacy & Data, and Feedback are always considered "complete" since they're just views
    if (sectionName === 'Chat History' || sectionName === 'Privacy & Data' || sectionName === 'Feedback') {
      return true;
    }
    
    // Handle new custom sections
    if (sectionName === 'Profile Basics') {
      return data.name.trim() !== '' && data.email.trim() !== '' && data.age.trim() !== '' && data.zipCode.trim() !== '';
    }
    
    if (sectionName === 'Style') {
      return data.styleVibe.length > 0 || data.datingVibes.length > 0;
    }
    
    if (sectionName === 'Open Context') {
      return data.openContext.trim() !== '';
    }
    
    return false;
  };

  const renderQuestion = (question: OnboardingQuestion) => {
    switch (question.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={question.type}
            value={data[question.id as keyof OnboardingData] as string || ''}
            onChange={(e) => handleInputChange(question.id as keyof OnboardingData, e.target.value)}
            placeholder={question.placeholder}
            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={data[question.id as keyof OnboardingData] as string || ''}
            onChange={(e) => handleInputChange(question.id as keyof OnboardingData, e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
          />
        );

      case 'select':
        return (
          <select
            value={data[question.id as keyof OnboardingData] as string || ''}
            onChange={(e) => handleInputChange(question.id as keyof OnboardingData, e.target.value)}
            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {question.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {question.options?.map(option => {
                const fieldData = data[question.id as keyof OnboardingData];
                const arrayData = Array.isArray(fieldData) ? fieldData : [];
                const isSelected = arrayData.includes(option);
                
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleArrayRemove(question.id as keyof OnboardingData, option);
                      } else {
                        handleArrayAdd(question.id as keyof OnboardingData, option);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'array':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder={`Add ${question.id === 'favoriteBrands' ? 'brand' : 'item'}...`}
                  value={arrayInputValues[question.id] || ''}
                  onChange={(e) => setArrayInputValues(prev => ({ ...prev, [question.id]: e.target.value }))}
                  className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => {
                    if (arrayInputValues[question.id]?.trim()) {
                      handleArrayAdd(question.id as keyof OnboardingData, arrayInputValues[question.id]);
                      setArrayInputValues(prev => ({ ...prev, [question.id]: '' }));
                    }
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  Add
                </button>
              </div>
              <p className="text-sm text-gray-400">
                {question.id === 'favoriteBrands' 
                  ? "Type a brand name and click 'Add' to add it."
                  : "Type an item and click 'Add' to add it."
                }
              </p>
            </div>
            
            {(() => {
              const fieldData = data[question.id as keyof OnboardingData];
              const arrayData = Array.isArray(fieldData) ? fieldData : [];
              return arrayData.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {arrayData.map(item => (
                    <span
                      key={item}
                      className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-full text-sm"
                    >
                      {item}
                      <button
                        onClick={() => handleArrayRemove(question.id as keyof OnboardingData, item)}
                        className="ml-2 text-white hover:text-red-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        );

      case 'photo':
        return (
          <div className="space-y-4">
            {data.profilePhoto ? (
              <div className="relative">
                <img
                  src={data.profilePhoto}
                  alt="Profile"
                  className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-white/20"
                />
                <button
                  onClick={() => setData(prev => ({ ...prev, profilePhoto: '' }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer text-gray-300 hover:text-white transition-colors block"
                >
                  <div className="text-4xl mb-2">📷</div>
                  <div className="font-semibold">Upload a Photo</div>
                  <div className="text-sm text-gray-400 mt-1">Selfie or outfit photo</div>
                </label>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentSectionName = sections[currentSection];
  const currentSectionQuestions = getSectionQuestions(currentSectionName);

  // Chat History component
  const renderChatHistory = () => (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        {selectedSessions.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={bulkDeleteSessions}
              className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedSessions.length})
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-white/20 text-white border border-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Select All / Clear All */}
      {chatSessions.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={selectAllSessions}
            className="px-3 py-1 text-sm bg-white/20 text-white border border-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-sm bg-white/20 text-white border border-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Chat Sessions List */}
      {chatHistoryLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : chatSessions.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No chat history found</h3>
          <p className="text-gray-400">
            {searchQuery ? 'No conversations match your search.' : 'Start a conversation with Jules to see your chat history here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chatSessions.map((session) => (
            <div
              key={session._id}
              className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 border transition-all duration-200 ${
                selectedSessions.includes(session._id)
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/20 hover:border-white/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedSessions.includes(session._id)}
                  onChange={() => toggleSessionSelection(session._id)}
                  className="mt-1 w-4 h-4 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium truncate" dangerouslySetInnerHTML={{ __html: session.title }}></h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {session.messageCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {session.preview && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: session.preview }}></p>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/chat?session=${session._id}`)}
                      className="px-3 py-1 text-sm bg-blue-500/20 text-blue-300 border border-blue-500/50 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() => deleteChatSession(session._id)}
                      className="px-3 py-1 text-sm bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">Settings</h1>
            <p className="text-sm sm:text-base text-gray-300">Edit your profile and preferences</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors text-sm sm:text-base"
            >
              Logout
            </button>
            <button
              onClick={() => router.push('/chat')}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm sm:text-base"
            >
              Back to Chat
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Error') 
              ? 'bg-red-500/20 border border-red-500/50 text-red-200' 
              : 'bg-green-500/20 border border-green-500/50 text-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {sections.map((section, index) => (
            <button
              key={section}
              onClick={() => setCurrentSection(index)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                index === currentSection
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {section}
            </button>
          ))}
        </div>

        {/* Current Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">{currentSectionName}</h2>
            <p className="text-sm text-gray-300">
              {currentSectionName === 'Chat History' 
                ? 'Manage your conversation history with Jules'
                : currentSectionName === 'Privacy & Data'
                ? 'Manage your privacy settings and data rights'
                : currentSectionName === 'Feedback'
                ? ''
                : `Edit your ${currentSectionName.toLowerCase()} information`
              }
            </p>
          </div>

          {currentSectionName === 'Chat History' ? (
            renderChatHistory()
          ) : currentSectionName === 'Feedback' ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your thoughts, suggestions, or report any issues you've encountered..."
                    rows={6}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
                  />
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={submitFeedback}
                      disabled={feedbackLoading || !feedbackText.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {feedbackLoading ? 'Sending...' : 'Send Feedback'}
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-300 font-medium mb-2">💬 We value your input</h4>
                  <p className="text-blue-200 text-sm">
                    Your feedback helps us improve Jules and make it better for everyone. We read every message and appreciate you taking the time to share your thoughts.
                  </p>
                </div>
              </div>
            </div>
          ) : currentSectionName === 'Privacy & Data' ? (
            <div className="space-y-6">
              {/* Consent Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Cookie & Consent Preferences</h3>
                
                {/* Necessary Cookies */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Necessary Cookies</h4>
                    <div className="bg-green-600 text-white px-2 py-1 rounded text-sm">Always Active</div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Essential for the website to function properly. These cannot be disabled.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Analytics Cookies</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentPreferences.analytics}
                        onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Help us understand how you use our app to improve performance and user experience.
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Functional Cookies</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentPreferences.functional}
                        onChange={(e) => handleConsentChange('functional', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Enable enhanced functionality and remember your preferences and settings.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Marketing Cookies</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentPreferences.marketing}
                        onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Used to deliver relevant advertisements and track marketing campaign effectiveness.
                  </p>
                </div>

                <button
                  onClick={updateConsentPreferences}
                  disabled={privacyLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {privacyLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>

              {/* Data Rights */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Your Data Rights</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Export Your Data</h4>
                    <p className="text-gray-300 text-sm mb-3">
                      Download a copy of all your personal data in a machine-readable format.
                    </p>
                    <button
                      onClick={exportUserData}
                      disabled={privacyLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {privacyLoading ? 'Exporting...' : 'Export Data'}
                    </button>
                  </div>

                  <div className="border border-red-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Delete Your Data</h4>
                    <p className="text-gray-300 text-sm mb-3">
                      Permanently delete all your personal data and anonymize your account.
                    </p>
                    <button
                      onClick={deleteUserData}
                      disabled={privacyLoading}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {privacyLoading ? 'Deleting...' : 'Delete All Data'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Contact & Support</h3>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-300 mb-3">
                    For questions about your privacy rights or to exercise any of your data subject rights:
                  </p>
                  <div className="space-y-2">
                    <p className="text-white">
                      <strong>Privacy:</strong> <a href="mailto:privacy@juleslabs.com" className="text-blue-300 hover:text-blue-200 underline">privacy@juleslabs.com</a>
                    </p>
                    <p className="text-white">
                      <strong>General Support:</strong> <a href="mailto:steve@juleslabs.com" className="text-blue-300 hover:text-blue-200 underline">steve@juleslabs.com</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20">
                <a href="/privacy" className="text-blue-300 hover:text-blue-200 underline">
                  View Full Privacy Policy
                </a>
              </div>
            </div>
          ) : currentSectionName === 'Profile Basics' ? (
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name (First name or nickname)
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your first name or nickname"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Age */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={data.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Zip or City */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Zip or City
                </label>
                <input
                  type="text"
                  value={data.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="Enter your zip code or city"
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          ) : currentSectionName === 'Style' ? (
            <div className="space-y-6">
              {/* Style Vibe */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Style Vibe
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Casual', 'Minimalist', 'Trendy', 'Classic', 'Street', 'Business Casual'].map((vibe) => {
                    const isSelected = data.styleVibe.includes(vibe);
                    return (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            handleArrayRemove('styleVibe', vibe);
                          } else {
                            handleArrayAdd('styleVibe', vibe);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent'
                            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {vibe}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dating Vibes */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dating Vibes
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Chill hangs', 'Dinner & Drinks', 'Parties & Events', 'Serious Relationship'].map((vibe) => {
                    const isSelected = data.datingVibes.includes(vibe);
                    return (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            handleArrayRemove('datingVibes', vibe);
                          } else {
                            handleArrayAdd('datingVibes', vibe);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent'
                            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {vibe}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : currentSectionName === 'Open Context' ? (
            <div className="space-y-6">
              {/* Open Context Box */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Want to give me more info?
                </label>
                <textarea
                  value={data.openContext}
                  onChange={(e) => handleInputChange('openContext', e.target.value)}
                  placeholder="Tell me about yourself, your dating goals, style challenges, or anything else that would help me give you better advice..."
                  rows={6}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {currentSectionQuestions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {question.label}
                      {question.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {question.description && (
                      <p className="text-sm text-gray-400 mb-2">{question.description}</p>
                    )}
                  </div>

                  {renderQuestion(question)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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