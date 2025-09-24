'use client';

import React, { useState } from 'react';
import ProductCard from './ProductCard';

interface Product {
  title: string;
  link: string;
  image: string;
  price: string;
  description: string;
}

interface ProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  onProductClick?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  showWishlistButton?: boolean;
  hasMore?: boolean;
  totalFound?: number;
  onShowMore?: () => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  title, 
  subtitle, 
  onProductClick,
  onAddToWishlist,
  showWishlistButton = false,
  hasMore = false,
  totalFound = 0,
  onShowMore
}) => {

  if (!products || products.length === 0) {
    return null;
  }

  // Use the products passed in (they should already be filtered by the parent)
  const displayProducts = products;

  return (
    <div className="w-full">
      {/* Single scrollable row instead of grid */}
      <div className="relative">
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {displayProducts.map((product, index) => (
            <div
              key={`${product.title}-${index}`}
              className="flex-shrink-0 w-64"
            >
              <ProductCard
                product={product}
                onClick={() => onProductClick?.(product)}
                onAddToWishlist={onAddToWishlist}
                showWishlistButton={showWishlistButton}
              />
            </div>
          ))}
        </div>
      </div>

      {hasMore && onShowMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onShowMore}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
          >
            Show More ({totalFound - products.length} more products)
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid; 