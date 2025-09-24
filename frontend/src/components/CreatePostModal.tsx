'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  initialData?: {
    imageUrl?: string;
    caption?: string;
    tags?: string[];
    source?: 'fit_check' | 'manual';
    julesFeedback?: string;
  };
}

const AVAILABLE_TAGS = [
  'streetwear', 'office', 'casual', 'formal', 'date-night', 
  'weekend', 'gym', 'travel', 'wedding', 'party', 'business',
  'smart-casual', 'athletic', 'minimal', 'vintage', 'trendy', 'fit-check'
];

export default function CreatePostModal({ 
  isOpen, 
  onClose, 
  onPostCreated,
  initialData 
}: CreatePostModalProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [caption, setCaption] = useState(initialData?.caption || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [source] = useState<'fit_check' | 'manual'>(initialData?.source || 'manual');
  const [julesFeedback] = useState(initialData?.julesFeedback || '');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };
    input.click();
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleCreatePost = async () => {
    if (!imageUrl.trim()) {
      setError('Please add an image to your post');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      let finalImageUrl = imageUrl;

      // If we have a selected file, upload it to Cloudinary first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const uploadResponse = await apiClient.post('/api/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        finalImageUrl = uploadResponse.data.imageUrl;
      }

      const postData = {
        imageUrl: finalImageUrl,
        caption: caption.trim(),
        tags: selectedTags,
        source,
        ...(source === 'fit_check' && {
          julesFeedback
        })
      };

      console.log('Creating post with data:', postData);
      const response = await apiClient.community.createPost(postData);
      console.log('Post created successfully:', response.data);
      
      onPostCreated();
      onClose();
      
      // Reset form
      setImageUrl('');
      setSelectedFile(null);
      setCaption('');
      setSelectedTags([]);
    } catch (error: any) {
      console.error('Error creating post:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      console.error('Full error object:', error);
      setError(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            {imageUrl ? (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Post preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setImageUrl('');
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400"
                >
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">Choose Photo</p>
                  </div>
                </div>
                
                <button
                  onClick={openCamera}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>📷</span>
                  <span>Take Photo</span>
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  Or drag and drop an image here
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's your style story?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{caption.length}/1000</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Jules Feedback (if from fit check) */}
          {source === 'fit_check' && julesFeedback && (
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">J</span>
                </div>
                <span className="text-sm font-semibold text-pink-700">Jules Feedback:</span>
              </div>
              <p className="text-sm text-pink-800">{julesFeedback}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePost}
            disabled={isCreating || !imageUrl.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
