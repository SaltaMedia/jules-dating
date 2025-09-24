// Product Variety Helper - Prevents repetitive product recommendations
const productVarietyHelper = {
  // Product categories with multiple options to avoid repetition
  productCategories: {
    sneakers: {
      white: [
        'Nike Air Force 1 \'07',
        'Adidas Stan Smith',
        'Common Projects Achilles Low',
        'Veja Campo',
        'Koio Capri',
        'Oliver Cabell Low 1',
        'Greats Royale',
        'Axel Arigato Clean 90'
      ],
      black: [
        'Nike Air Force 1 \'07',
        'Adidas Stan Smith',
        'Common Projects Achilles Low',
        'Veja Campo',
        'Koio Capri',
        'Oliver Cabell Low 1',
        'Greats Royale',
        'Axel Arigato Clean 90'
      ],
      general: [
        'Nike Air Max 90',
        'Adidas Superstar',
        'Puma Suede Classic',
        'New Balance 574',
        'Vans Old Skool',
        'Converse Chuck Taylor',
        'Reebok Classic',
        'Saucony Jazz'
      ]
    },
    shirts: {
      casual: [
        'Uniqlo U Crew Neck',
        'Everlane Cotton Crew',
        'Buck Mason Pima Cotton',
        'Jungmaven Hemp Tee',
        'Reigning Champ Midweight',
        'Lady White Co. Classic',
        '3sixteen Heavyweight',
        'Wings + Horns Loopwheel'
      ],
      buttonDown: [
        'Uniqlo Oxford Button-Down',
        'Everlane Oxford Shirt',
        'Buck Mason Oxford',
        'J.Crew Ludlow Oxford',
        'Bonobos Oxford',
        'Taylor Stitch Oxford',
        'Flint and Tinder Oxford',
        'Alex Mill Oxford'
      ]
    },
    jeans: {
      slim: [
        'Uniqlo Slim Fit Jeans',
        'Everlane Slim Jeans',
        'Buck Mason Slim Jeans',
        'J.Crew 484 Slim',
        'Bonobos Slim Jeans',
        'Taylor Stitch Slim',
        'Flint and Tinder Slim',
        'Alex Mill Slim'
      ],
      straight: [
        'Uniqlo Straight Fit Jeans',
        'Everlane Straight Jeans',
        'Buck Mason Straight Jeans',
        'J.Crew 770 Straight',
        'Bonobos Straight Jeans',
        'Taylor Stitch Straight',
        'Flint and Tinder Straight',
        'Alex Mill Straight'
      ]
    },
    jackets: {
      casual: [
        'Uniqlo MA-1 Bomber',
        'Everlane Bomber Jacket',
        'Buck Mason Bomber',
        'J.Crew Bomber',
        'Bonobos Bomber',
        'Taylor Stitch Bomber',
        'Flint and Tinder Bomber',
        'Alex Mill Bomber'
      ],
      denim: [
        'Uniqlo Denim Jacket',
        'Everlane Denim Jacket',
        'Buck Mason Denim',
        'J.Crew Denim Jacket',
        'Bonobos Denim Jacket',
        'Taylor Stitch Denim',
        'Flint and Tinder Denim',
        'Alex Mill Denim'
      ]
    }
  },

  // Get alternative products that haven't been suggested recently
  getAlternativeProducts(category, subcategory, recentlySuggested = [], count = 3) {
    const products = this.productCategories[category]?.[subcategory] || 
                    this.productCategories[category]?.general || 
                    this.productCategories[category]?.white || 
                    [];
    
    if (products.length === 0) return [];
    
    // Filter out recently suggested products
    const availableProducts = products.filter(product => 
      !recentlySuggested.some(suggested => 
        suggested.toLowerCase().includes(product.toLowerCase()) ||
        product.toLowerCase().includes(suggested.toLowerCase())
      )
    );
    
    // If we don't have enough alternatives, add some generic options
    if (availableProducts.length < count) {
      const genericOptions = this.getGenericAlternatives(category, recentlySuggested);
      availableProducts.push(...genericOptions);
    }
    
    return availableProducts.slice(0, count);
  },

  // Get generic alternatives when specific options are exhausted
  getGenericAlternatives(category, recentlySuggested = []) {
    const genericOptions = {
      sneakers: [
        'Nike Air Max 270',
        'Adidas Ultraboost',
        'Puma RS-X',
        'New Balance 990',
        'Vans Sk8-Hi',
        'Converse Chuck 70',
        'Reebok Classic',
        'Saucony Ride'
      ],
      shirts: [
        'Uniqlo U Tee',
        'Everlane Tee',
        'Buck Mason Tee',
        'Jungmaven Tee',
        'Reigning Champ Tee',
        'Lady White Co. Tee',
        '3sixteen Tee',
        'Wings + Horns Tee'
      ],
      jeans: [
        'Uniqlo Jeans',
        'Everlane Jeans',
        'Buck Mason Jeans',
        'J.Crew Jeans',
        'Bonobos Jeans',
        'Taylor Stitch Jeans',
        'Flint and Tinder Jeans',
        'Alex Mill Jeans'
      ],
      jackets: [
        'Uniqlo Jacket',
        'Everlane Jacket',
        'Buck Mason Jacket',
        'J.Crew Jacket',
        'Bonobos Jacket',
        'Taylor Stitch Jacket',
        'Flint and Tinder Jacket',
        'Alex Mill Jacket'
      ]
    };
    
    const options = genericOptions[category] || [];
    return options.filter(option => 
      !recentlySuggested.some(suggested => 
        suggested.toLowerCase().includes(option.toLowerCase()) ||
        option.toLowerCase().includes(suggested.toLowerCase())
      )
    );
  },

  // Generate diverse product recommendations
  generateDiverseRecommendations(request, recentlySuggested = [], userPreferences = {}) {
    const recommendations = [];
    
    // Extract product type from request
    const requestLower = request.toLowerCase();
    
    if (requestLower.includes('shoes') || requestLower.includes('sneakers') || requestLower.includes('footwear')) {
      const alternatives = this.getAlternativeProducts('sneakers', 'general', recentlySuggested, 3);
      recommendations.push(...alternatives);
    } else if (requestLower.includes('shirt') || requestLower.includes('tee') || requestLower.includes('top')) {
      const alternatives = this.getAlternativeProducts('shirts', 'casual', recentlySuggested, 3);
      recommendations.push(...alternatives);
    } else if (requestLower.includes('jeans') || requestLower.includes('pants')) {
      const alternatives = this.getAlternativeProducts('jeans', 'slim', recentlySuggested, 3);
      recommendations.push(...alternatives);
    } else if (requestLower.includes('jacket') || requestLower.includes('coat')) {
      const alternatives = this.getAlternativeProducts('jackets', 'casual', recentlySuggested, 3);
      recommendations.push(...alternatives);
    } else {
      // Generic recommendations
      const genericSneakers = this.getAlternativeProducts('sneakers', 'general', recentlySuggested, 1);
      const genericShirts = this.getAlternativeProducts('shirts', 'casual', recentlySuggested, 1);
      const genericJeans = this.getAlternativeProducts('jeans', 'slim', recentlySuggested, 1);
      
      recommendations.push(...genericSneakers, ...genericShirts, ...genericJeans);
    }
    
    // Apply user preferences if available
    if (userPreferences.budget) {
      // Filter by budget (simplified - in real implementation, you'd have actual prices)
      recommendations.splice(0, Math.floor(recommendations.length * 0.3)); // Remove some expensive options
    }
    
    if (userPreferences.brands && userPreferences.brands.length > 0) {
      // Prioritize preferred brands
      const preferred = recommendations.filter(rec => 
        userPreferences.brands.some(brand => 
          rec.toLowerCase().includes(brand.toLowerCase())
        )
      );
      const others = recommendations.filter(rec => 
        !userPreferences.brands.some(brand => 
          rec.toLowerCase().includes(brand.toLowerCase())
        )
      );
      recommendations.splice(0, recommendations.length, ...preferred, ...others);
    }
    
    return recommendations.slice(0, 3);
  },

  // Check if recommendations are diverse enough
  isRecommendationDiverse(recommendations, recentlySuggested = []) {
    if (recommendations.length < 2) return false;
    
    // Check for brand diversity
    const brands = recommendations.map(rec => rec.split(' ')[0]);
    const uniqueBrands = new Set(brands);
    
    // Check for price diversity (simplified)
    const hasVariety = uniqueBrands.size >= 2 && recommendations.length >= 2;
    
    // Check that we're not repeating recent suggestions
    const notRepetitive = recommendations.every(rec => 
      !recentlySuggested.some(suggested => 
        suggested.toLowerCase().includes(rec.toLowerCase()) ||
        rec.toLowerCase().includes(suggested.toLowerCase())
      )
    );
    
    return hasVariety && notRepetitive;
  }
};

module.exports = productVarietyHelper;
