'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';

interface StyleImage {
  id: string;
  url?: string;
  image?: string;
  thumb?: string;
  thumbnail?: string;
  alt?: string;
  title?: string;
  photographer?: string;
  photographerUrl?: string;
  downloadUrl?: string;
  width?: number;
  height?: number;
  description?: string;
}

interface ImageCardProps {
  image: StyleImage;
  onClick?: () => void;
  showPhotographer?: boolean;
  onAddToWishlist?: (image: StyleImage) => void;
  showWishlistButton?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  onClick, 
  showPhotographer = true,
  onAddToWishlist,
  showWishlistButton = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAddedToWishlist, setIsAddedToWishlist] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      // Open modal for image enlargement
      setShowModal(true);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAddedToWishlist && onAddToWishlist) {
      try {
        await onAddToWishlist(image);
        setIsAddedToWishlist(true);
      } catch (error) {
        console.error('Error adding to wishlist:', error);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <div 
        className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer overflow-hidden group"
      >
        <div className="relative h-48 bg-gray-100">
          {(image.url || image.image) && (image.url?.trim() !== '' || image.image?.trim() !== '') ? (
            <Image
              src={image.url || image.image || ''}
              alt={image.alt || image.title || 'Style inspiration'}
              fill
              className="object-cover group-hover:brightness-110 transition-all duration-200 cursor-pointer"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onClick={handleImageClick}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <span>Image not available</span>
            </div>
          )}
          
          {/* Hover overlay for visual feedback only */}
          <div 
            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 pointer-events-none"
          />
          
          {/* Wishlist Button */}
          {showWishlistButton && (
            <button
              onClick={handleAddToWishlist}
              disabled={isAddedToWishlist}
              className={`absolute top-2 right-2 backdrop-blur-sm p-2 rounded-full transition-all duration-200 z-20 ${
                isAddedToWishlist
                  ? 'bg-green-500 text-white cursor-default'
                  : 'bg-black/50 hover:bg-black/70 text-white'
              }`}
              title={isAddedToWishlist ? "Added to Wishlist" : "Add to Wishlist"}
            >
              {isAddedToWishlist ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              )}
            </button>
          )}
          
          {/* Add to Wishlist Button - Always show for inspiration images */}
          <button
            onClick={handleAddToWishlist}
            disabled={isAddedToWishlist}
            className={`absolute bottom-2 right-2 backdrop-blur-sm px-3 py-1 rounded-full transition-all duration-200 text-xs font-medium z-20 ${
              isAddedToWishlist
                ? 'bg-green-500 text-white cursor-default'
                : 'bg-black/50 hover:bg-black/70 text-white'
            }`}
            title={isAddedToWishlist ? "Added to Wishlist" : "Add to Wishlist"}
          >
            {isAddedToWishlist ? '✓ Added' : '+ Wishlist'}
          </button>
          
          {showPhotographer && image.photographer && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Photo by{' '}
                {image.photographerUrl ? (
                  <a 
                    href={image.photographerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {image.photographer}
                  </a>
                ) : (
                  <span>{image.photographer}</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* No text section - clean image-only display */}
      </div>

      {/* Modal for enlarged image */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90" onClick={closeModal}>
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Full-screen image with padding */}
          <div className="w-full h-full flex items-center justify-center p-8">
            <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
              <Image
                src={image.url || image.image || ''}
                alt={image.alt || image.title || 'Style inspiration'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ImageCard; 