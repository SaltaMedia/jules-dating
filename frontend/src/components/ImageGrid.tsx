'use client';

import React from 'react';
import ImageCard from './ImageCard';

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
}

interface ImageGridProps {
  images: StyleImage[];
  title?: string;
  subtitle?: string;
  onImageClick?: (image: StyleImage) => void;
  showPhotographer?: boolean;
  onAddToWishlist?: (image: StyleImage) => void;
  showWishlistButton?: boolean;
}

const ImageGrid: React.FC<ImageGridProps> = ({ 
  images, 
  title, 
  subtitle, 
  onImageClick,
  showPhotographer = true,
  onAddToWishlist,
  showWishlistButton = false
}) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-semibold text-white mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-300 text-sm">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {/* Single scrollable row instead of grid */}
      <div className="relative">
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {images.map((image) => (
            <div
              key={image.id}
              className="flex-shrink-0 w-64"
            >
              <ImageCard
                image={image}
                onClick={onImageClick ? () => onImageClick(image) : undefined}
                showPhotographer={showPhotographer}
                onAddToWishlist={onAddToWishlist}
                showWishlistButton={showWishlistButton}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageGrid; 