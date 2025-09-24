'use client';

import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

interface UploadProgress {
  [key: string]: {
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
  };
}

interface WardrobeUploadProps {
  onUploadComplete: (items: any[]) => void;
  onClose: () => void;
}

export default function WardrobeUpload({ onUploadComplete, onClose }: WardrobeUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      console.error('Please select image files only');
      return;
    }

    setIsUploading(true);
    const newProgress: UploadProgress = {};
    
    // Initialize progress for each file
    imageFiles.forEach(file => {
      newProgress[file.name] = {
        progress: 0,
        status: 'uploading'
      };
    });
    
    setUploadProgress(newProgress);

    const uploadedItems = [];

    for (const file of imageFiles) {
      try {
        // Step 1: Get upload URL
        const uploadUrlResponse = await axios.post('/api/wardrobe/upload-url', {
          filename: file.name,
          contentType: file.type
        });

        const { uploadUrl, uploadParams, storageKey } = uploadUrlResponse.data;

        // Step 2: Upload to Cloudinary
        const formData = new FormData();
        Object.entries(uploadParams).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        formData.append('file', file);

        const uploadResponse = await axios.post(uploadUrl, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: {
                ...prev[file.name],
                progress,
                status: progress === 100 ? 'processing' : 'uploading'
              }
            }));
          }
        });

        // Step 3: Ingest item and trigger auto-tagging
        const ingestResponse = await axios.post('/api/wardrobe/ingest', {
          storageKey,
          width: uploadResponse.data.width,
          height: uploadResponse.data.height
        });

        uploadedItems.push(ingestResponse.data.item);

        setUploadProgress(prev => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress: 100,
            status: 'complete'
          }
        }));

      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress: 0,
            status: 'error',
            error: 'Upload failed'
          }
        }));
      }
    }

    setIsUploading(false);
    
    if (uploadedItems.length > 0) {
      onUploadComplete(uploadedItems);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload Wardrobe Items</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              Drop your wardrobe photos here
            </p>
            <p className="text-sm text-gray-500 mt-2">
              or click to browse your files
            </p>
          </div>

          <button
            onClick={triggerFileSelect}
            disabled={isUploading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Select Files'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Progress</h3>
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 truncate">{filename}</span>
                      <span className="text-gray-500">
                        {progress.status === 'complete' && '✓ Complete'}
                        {progress.status === 'processing' && '🔄 Processing...'}
                        {progress.status === 'error' && '❌ Error'}
                        {progress.status === 'uploading' && `${progress.progress}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress.status === 'complete'
                            ? 'bg-green-500'
                            : progress.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    {progress.error && (
                      <p className="text-red-500 text-xs mt-1">{progress.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <p>• Supported formats: JPG, PNG, WebP</p>
          <p>• Maximum file size: 10MB per image</p>
          <p>• Items will be automatically tagged with AI</p>
        </div>
      </div>
    </div>
  );
} 