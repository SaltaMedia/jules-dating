'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface Product {
  title: string;
  link: string;
  image: string;
  price: string;
  description: string;
  brand?: string;
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onAddToWishlist?: (product: Product) => void;
  showWishlistButton?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onAddToWishlist, showWishlistButton = false }) => {
  const [showBrowser, setShowBrowser] = useState(false);
  const [isAddedToWishlist, setIsAddedToWishlist] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    } else {
      // Open in-app browser
      setShowBrowser(true);
    }
  };

  const closeBrowser = () => {
    setShowBrowser(false);
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAddedToWishlist && onAddToWishlist) {
      try {
        await onAddToWishlist(product);
        setIsAddedToWishlist(true);
      } catch (error) {
        console.error('Error adding to wishlist:', error);
      }
    }
  };

  return (
    <>
      <div 
        className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer overflow-hidden"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e as any);
          }
        }}
      >
        <div className="relative h-48 bg-gray-800">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          
          {/* Wishlist Button */}
          {showWishlistButton && (
            <button
              onClick={handleAddToWishlist}
              disabled={isAddedToWishlist}
              className={`absolute top-2 right-2 px-3 py-2 rounded-full transition-all duration-200 shadow-lg flex items-center space-x-1 ${
                isAddedToWishlist
                  ? 'bg-green-500 text-white cursor-default'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              }`}
              title={isAddedToWishlist ? "Added to Wishlist" : "Add to Wishlist"}
            >
              {isAddedToWishlist ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">Added</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-xs font-medium">Wishlist</span>
                </>
              )}
            </button>
          )}
        </div>
        
        <div className="p-4">
          <a 
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white text-sm line-clamp-2 mb-2 block hover:text-blue-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {product.title}
          </a>
          
          {product.price && (
            <p className="text-green-400 font-medium text-sm mb-2">
              {product.price}
            </p>
          )}
          
          {product.description && (
            <p className="text-gray-300 text-xs line-clamp-2">
              {product.description}
            </p>
          )}
          
          <div className="mt-3 flex items-center justify-between">
            <span className="text-purple-400 text-xs font-medium">
              &nbsp;
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* In-App Browser Modal */}
      {showBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">J</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{product.title}</h3>
                  <p className="text-sm text-gray-500">{product.brand || 'Product'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.open(product.link, '_blank')}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  title="Open in new tab"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button
                  onClick={closeBrowser}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Browser Content */}
            <div className="flex-1 relative">
              <iframe
                src={product.link}
                className="w-full h-full border-0"
                title={product.title}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard; 