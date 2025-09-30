const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { buildJulesContext } = require('../utils/contextBuilder');
const axios = require('axios');

// Function to fetch real product data using Google Custom Search API
const fetchRealProductData = async (category, preferences, userContext = null, offset = 0, clickCount = 0) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {
      console.log('Missing Google API credentials');
      return [];
    }
    
    console.log(`Fetching ${category} products from Google Custom Search API...`);
    console.log(`Click count: ${clickCount}, User context: ${userContext ? 'Available' : 'None'}`);
    
    // Build context-aware queries based on user profile
    const categoryQueries = buildContextAwareQueries(category, userContext);
    const queries = categoryQueries[category] || [];
    
    if (queries.length === 0) {
      console.log('No queries available for category:', category);
      return [];
    }
    
    // Use different queries based on click count to get variety
    const queriesPerBatch = 3;
    const startIndex = (clickCount * queriesPerBatch) % queries.length;
    
    // Get the next 3 queries, cycling through the list
    const selectedQueries = [];
    for (let i = 0; i < queriesPerBatch; i++) {
      const queryIndex = (startIndex + i) % queries.length;
      selectedQueries.push(queries[queryIndex]);
    }
    
    console.log(`Using queries: ${selectedQueries.join(', ')}`);
    
    const products = [];
    
    // Search for each specific query
    for (const query of selectedQueries) {
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: apiKey,
            cx: searchEngineId,
            q: query,
            searchType: 'image',
            num: 1,
            imgSize: 'medium',
            safe: 'active'
          }
        });
        
        if (response.data.items && response.data.items.length > 0) {
          const item = response.data.items[0];
          
          // Filter out garbage results
          if (isValidProduct(item, category, preferences, userContext)) {
            const productId = `${category}_${Date.now()}_${Math.random()}`;
            
            // Check for duplicates
            const isDuplicate = products.some(existingProduct => 
              existingProduct.title === item.title || 
              existingProduct.link === (item.image?.contextLink || item.link)
            );
            
            if (!isDuplicate) {
                              const extractedPrice = extractRealPriceFromGoogleResult(item);
                products.push({
                  _id: productId,
                  title: item.title || `${category} product`,
                  brand: extractBrandFromTitle(item.title),
                  price: extractedPrice || 'Price not available',
                  image: item.link,
                  link: item.image?.contextLink || item.link,
                  category: category
                });
            }
          }
        }
      } catch (error) {
        console.log(`Error searching for query "${query}":`, error.message);
      }
    }
    
    console.log(`Found ${products.length} products for ${category}`);
    return products.slice(0, 3);
    
  } catch (error) {
    console.error('Error fetching product data:', error);
    return [];
  }
};

// Build dynamic queries based on user profile and preferences
const buildContextAwareQueries = (category, userContext) => {
  // Generate dynamic queries based on category and user context
  const generateQueries = (category, userContext) => {
    const queries = [];
    
    // Get user's preferred brands if available
    const preferredBrands = userContext?.style?.preferred || [];
    const lifestyle = userContext?.lifestyle || 'casual';
    const investment = userContext?.investment || 'moderate';
    
    // Define category-specific terms
    const categoryTerms = {
      outerwear: ['jacket', 'coat', 'hoodie', 'sweater', 'blazer'],
      tops: ['shirt', 't-shirt', 'polo', 'sweater', 'hoodie'],
      bottoms: ['jeans', 'pants', 'joggers', 'shorts', 'trousers'],
      shoes: ['sneakers', 'shoes', 'boots', 'sandals', 'loafers'],
      accessories: ['hat', 'bag', 'backpack', 'wallet', 'belt']
    };
    
    const terms = categoryTerms[category] || ['product'];
    
    // Generate queries based on user preferences
    if (preferredBrands.length > 0) {
      // Use user's preferred brands
      for (const brand of preferredBrands.slice(0, 5)) {
        for (const term of terms.slice(0, 3)) {
          queries.push(`${brand} ${term} men buy`);
        }
      }
    } else {
      // Generate generic queries based on category and lifestyle
      const genericBrands = ['Nike', 'Adidas', 'Uniqlo', 'Levi\'s', 'Lululemon'];
      for (const brand of genericBrands) {
        for (const term of terms.slice(0, 3)) {
          queries.push(`${brand} ${term} men buy`);
        }
      }
    }
    
    // Add lifestyle-specific queries
    if (lifestyle === 'athletic') {
      terms.forEach(term => queries.push(`athletic ${term} men buy`));
    } else if (lifestyle === 'business') {
      terms.forEach(term => queries.push(`business ${term} men buy`));
    }
    
    // Add investment-level specific queries
    if (investment === 'premium') {
      terms.forEach(term => queries.push(`premium ${term} men buy`));
    } else if (investment === 'budget') {
      terms.forEach(term => queries.push(`affordable ${term} men buy`));
    }
    
    return queries.slice(0, 15); // Limit to 15 queries
  };
  
  const queries = generateQueries(category, userContext);
  
  return {
    [category]: queries
  };
};

// Helper function to extract brand from title
const extractBrandFromTitle = (title) => {
  if (!title) return 'Brand';
  
  const titleLower = title.toLowerCase();
  
  // List of brands Jules would recommend - check in order of preference
  const brands = [
    'Levi\'s', 'Alpha Industries', 'AllSaints', 'Carhartt', 'The North Face',
    'Patagonia', 'Uniqlo', 'Nike', 'Lululemon', 'Adidas', 'Vans', 
    'Common Projects', 'Tommy Hilfiger', 'Calvin Klein', 'H&M', 'Zara', 
    'J.Crew', 'Banana Republic', 'Gap', 'J.Crew', 'Banana Republic'
  ];
  
  for (const brand of brands) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Additional brand checks for common variations
  if (titleLower.includes('levi') || titleLower.includes('levis')) return 'Levi\'s';
  if (titleLower.includes('alpha')) return 'Alpha Industries';
  if (titleLower.includes('allsaints')) return 'AllSaints';
  if (titleLower.includes('carhartt')) return 'Carhartt';
  if (titleLower.includes('north face')) return 'The North Face';
  if (titleLower.includes('patagonia')) return 'Patagonia';
  if (titleLower.includes('uniqlo')) return 'Uniqlo';
  if (titleLower.includes('nike')) return 'Nike';
  if (titleLower.includes('lululemon')) return 'Lululemon';
  if (titleLower.includes('adidas')) return 'Adidas';
  if (titleLower.includes('vans')) return 'Vans';
  if (titleLower.includes('common projects')) return 'Common Projects';
  if (titleLower.includes('tommy hilfiger')) return 'Tommy Hilfiger';
  if (titleLower.includes('calvin klein')) return 'Calvin Klein';
  if (titleLower.includes('j.crew') || titleLower.includes('jcrew')) return 'J.Crew';
  if (titleLower.includes('banana republic')) return 'Banana Republic';
  if (titleLower.includes('gap')) return 'Gap';
  
  // Try to extract brand from the beginning of the title
  const words = title.split(' ');
  if (words.length > 0) {
    const firstWord = words[0].replace(/[^\w]/g, ''); // Remove special characters
    if (firstWord.length > 2) {
      return firstWord;
    }
  }
  
  return 'Brand';
};

// Helper function to extract real price from Google result
const extractRealPriceFromGoogleResult = (item) => {
  if (!item) return null;
  
  // Try to extract price from title
  const title = item.title || '';
  const priceMatch = title.match(/\$(\d+)/);
  if (priceMatch) {
    return `$${priceMatch[1]}`;
  }
  
  // Try to extract price from snippet
  const snippet = item.snippet || '';
  const snippetPriceMatch = snippet.match(/\$(\d+)/);
  if (snippetPriceMatch) {
    return `$${snippetPriceMatch[1]}`;
  }
  
  // Try to extract price from link
  const link = item.link || '';
  const linkPriceMatch = link.match(/\$(\d+)/);
  if (linkPriceMatch) {
    return `$${linkPriceMatch[1]}`;
  }
  
  // If no price found, return null - no hardcoded fallbacks
  return null;
};



// Filter out garbage results that Jules would never recommend
const isValidProduct = (item, category, preferences = {}, userContext = null) => {
  if (!item || !item.title) return false;
  
  const title = item.title.toLowerCase();
  const link = item.link?.toLowerCase() || '';
  
  // Filter out generic/bad results
  const badKeywords = [
    'pajama', 'pajamas', 'thermal', 'work pants', 'duck canvas', 'graduation',
    'buying tips', 'guide', 'how to', 'article', 'blog', 'review',
    'generic', 'brand', 'followme', 'houjiilollnsdx', 'rocky'
  ];
  
  // Check if title contains bad keywords
  for (const keyword of badKeywords) {
    if (title.includes(keyword)) {
      return false;
    }
  }
  
  // Filter out non-product pages
  if (title.includes('amazon.com:') && !title.includes('product')) {
    return false;
  }
  
  // Filter out generic "Brand" results
  if (title.includes('brand') && !title.includes('nike') && !title.includes('adidas') && !title.includes('lululemon')) {
    return false;
  }
  
  // Ensure it's actually a product image, not a guide or article
  if (title.includes('tips') || title.includes('guide') || title.includes('article')) {
    return false;
  }
  
  // TEMPORARILY DISABLE DISLIKED PRODUCTS FILTERING FOR TESTING
  // Check if this product was already disliked by the user
  if (preferences.dislikedProducts && preferences.dislikedProducts.length > 0) {
    const brand = extractBrandFromTitle(item.title);
    const isDisliked = preferences.dislikedProducts.some(dislikedId => 
      dislikedId.includes(category) && 
      (dislikedId.includes(item.title) || dislikedId.includes(brand))
    );
    // Temporarily allow disliked products to pass through for testing
    // if (isDisliked) {
    //   return false;
    // }
  }
  
  // TEMPORARILY DISABLE SHOWN PRODUCTS FILTERING FOR TESTING
  // Check if this product was already shown to the user
  if (preferences.shownProducts && preferences.shownProducts[category]) {
    const brand = extractBrandFromTitle(item.title);
    const isAlreadyShown = preferences.shownProducts[category].some(shownProduct => 
      shownProduct.title === item.title || 
      shownProduct.link === (item.image?.contextLink || item.link) ||
      (shownProduct.brand === brand && shownProduct.category === category)
    );
    // Temporarily allow shown products to pass through for testing
    // if (isAlreadyShown) {
    //   return false;
    // }
  }
  
  return true;
};

// Get personalized picks for a user
const getPersonalizedPicks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user and user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
        const userProfile = await UserProfile.findOne({ userId });
    let userContext = null;
    
    // Build context from UserProfile if available
    if (userProfile) {
      try {
        userContext = buildJulesContext(userProfile);
        console.log('Using UserProfile context for personalized picks');
      } catch (contextError) {
        console.error('Error building context from UserProfile:', contextError);
        // Fallback to basic user data
        userContext = {
          name: user.name,
          style: {
            preferred: user.stylePreferences?.brands || [],
            fit: user.stylePreferences?.style || 'casual'
          },
          lifestyle: {
            city: user.onboarding?.cityOrZipCode,
            monthlyClothingBudget: user.onboarding?.monthlyClothingBudget || '$100–$250'
          }
        };
      }
    } else {
      // Fallback to basic user data
      userContext = {
        name: user.name,
        style: {
          preferred: user.stylePreferences?.brands || [],
          fit: user.stylePreferences?.style || 'casual'
        },
        lifestyle: {
          city: user.onboarding?.cityOrZipCode,
          monthlyClothingBudget: user.onboarding?.monthlyClothingBudget || '$100–$250'
        }
      };
      console.log('Using basic user data for personalized picks');
    }

    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.shownProducts) {
      user.preferences.shownProducts = {};
    }
    if (!user.preferences.seeMoreCounts) {
      user.preferences.seeMoreCounts = {};
    }
    
    // Generate personalized picks based on user context and preferences
    const picks = await generatePersonalizedPicks(user, userContext);
    
    // Track shown products
    for (const [category, products] of Object.entries(picks)) {
      if (!user.preferences.shownProducts[category]) {
        user.preferences.shownProducts[category] = [];
      }
      
      products.forEach(product => {
        const existingProduct = user.preferences.shownProducts[category].find(p => 
          p.title === product.title || p.link === product.link
        );
        if (!existingProduct) {
          user.preferences.shownProducts[category].push({
            title: product.title,
            link: product.link,
            brand: product.brand,
            category: category
          });
        }
      });
    }
    
    await user.save();
    
    res.json({ 
      picks,
      userContext: userContext ? 'Available' : 'None',
      system: userProfile ? 'UserProfile' : 'Basic User'
    });
  } catch (error) {
    console.error('Error getting personalized picks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Handle thumbs up (like) - moves item to wishlist
const likeProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { product } = req.body; // Get product data from request body
    
    // Find the user and update their preferences
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.likedProducts) {
      user.preferences.likedProducts = [];
    }
    if (!user.preferences.dislikedProducts) {
      user.preferences.dislikedProducts = [];
    }
    
    // Remove from disliked if it was there
    user.preferences.dislikedProducts = user.preferences.dislikedProducts.filter(id => id !== productId);
    
    // Add to liked if not already there
    if (!user.preferences.likedProducts.includes(productId)) {
      user.preferences.likedProducts.push(productId);
    }
    
    // Add to wishlist
    if (product) {
      // Add to wishlist items in User model (for backward compatibility)
      if (!user.wishlistItems) {
        user.wishlistItems = [];
      }
      
      const wishlistItem = {
        name: product.title,
        type: product.category,
        brand: product.brand,
        imageUrl: product.image,
        link: product.link,
        tags: [{ brand: product.brand }],
        createdAt: new Date().toISOString()
      };
      
      // Check if item already exists in user's wishlist array
      const existingItem = user.wishlistItems.find(item => 
        item.name === product.title && item.brand === product.brand
      );
      
      if (!existingItem) {
        user.wishlistItems.push(wishlistItem);
      }
      
    }
    
    await user.save();
    
    res.json({ 
      message: 'Product liked and added to wishlist successfully', 
      preferences: user.preferences,
      wishlistItems: user.wishlistItems 
    });
  } catch (error) {
    console.error('Error liking product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Handle thumbs down (dislike) - removes product and adds new one
const dislikeProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { category } = req.body; // Get category to generate new product
    
    // Find the user and update their preferences
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.likedProducts) {
      user.preferences.likedProducts = [];
    }
    if (!user.preferences.dislikedProducts) {
      user.preferences.dislikedProducts = [];
    }
    
    // Remove from liked if it was there
    user.preferences.likedProducts = user.preferences.likedProducts.filter(id => id !== productId);
    
    // Add to disliked if not already there
    if (!user.preferences.dislikedProducts.includes(productId)) {
      user.preferences.dislikedProducts.push(productId);
    }
    
    await user.save();
    
    // Generate a new product to replace the disliked one
    let newProduct = null;
    if (category) {
      const newProducts = await fetchRealProductData(category, user.preferences);
      if (newProducts.length > 0) {
        newProduct = newProducts[0];
      }
    }
    
    res.json({ 
      message: 'Product disliked successfully', 
      preferences: user.preferences,
      newProduct: newProduct
    });
  } catch (error) {
    console.error('Error disliking product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate personalized picks based on user context and preferences
const generatePersonalizedPicks = async (user, userContext) => {
  const categories = ['outerwear', 'tops', 'bottoms', 'shoes', 'accessories'];
  const picks = {};
  
  for (const category of categories) {
    picks[category] = await generateCategoryPicks(category, user.preferences, userContext);
  }
  
  return picks;
};

// Generate picks for a specific category
const generateCategoryPicks = async (category, preferences, userContext) => {
  // Fetch real product data from Google Custom Search API with user context
  return await fetchRealProductData(category, preferences, userContext);
};

// Get more products for a specific category
const getMoreProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;
    const { count = 3 } = req.query; // Default to 3 more products
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.seeMoreCounts) {
      user.preferences.seeMoreCounts = {};
    }
    if (!user.preferences.dislikedProducts) {
      user.preferences.dislikedProducts = [];
    }
    if (!user.preferences.shownProducts) {
      user.preferences.shownProducts = {};
    }
    if (!user.preferences.shownProducts[category]) {
      user.preferences.shownProducts[category] = [];
    }
    
    // Track how many times "See More" has been clicked for this category
    if (!user.preferences.seeMoreCounts[category]) {
      user.preferences.seeMoreCounts[category] = 0;
    }
    
    // Get the current click count before incrementing
    const currentClickCount = user.preferences.seeMoreCounts[category];
    
    // Increment the click count
    user.preferences.seeMoreCounts[category]++;
    
    console.log(`=== SHOW MORE DEBUG ===`);
    console.log(`Category: ${category}`);
    console.log(`Previous click count: ${currentClickCount}`);
    console.log(`New click count: ${user.preferences.seeMoreCounts[category]}`);
    
    // Calculate offset based on how many times "See More" has been clicked
    // Each "See More" click should use different queries to get different products
    const offset = (user.preferences.seeMoreCounts[category] - 1) * parseInt(count);
    
    console.log(`See More clicked ${user.preferences.seeMoreCounts[category]} times for ${category}, offset: ${offset}`);
    
    // Save the updated preferences immediately
    await user.save();
    
    // Get user context for better personalization
    let userContext = null;
    const userProfile = await UserProfile.findOne({ userId });
    if (userProfile) {
      userContext = buildJulesContext(userProfile);
    }
    
    // Generate more products for the category with offset and context
    console.log(`Using click count: ${user.preferences.seeMoreCounts[category]} for ${category}`);
    
    // Create a copy of preferences with the updated click count
    const updatedPreferences = {
      ...user.preferences,
      seeMoreCounts: {
        ...user.preferences.seeMoreCounts,
        [category]: user.preferences.seeMoreCounts[category]
      }
    };
    
    const moreProducts = await fetchRealProductData(category, updatedPreferences, userContext, offset, user.preferences.seeMoreCounts[category]);
    
    // Track the new products as shown
    const finalProducts = moreProducts.slice(0, parseInt(count));
    finalProducts.forEach(product => {
      const existingProduct = user.preferences.shownProducts[category].find(p => 
        p.title === product.title || 
        p.link === product.link ||
        p.brand === product.brand
      );
      if (!existingProduct) {
        user.preferences.shownProducts[category].push({
          title: product.title,
          link: product.link,
          brand: product.brand,
          category: category,
          image: product.image
        });
      }
    });
    
    await user.save();
    
    console.log(`Loading ${moreProducts.length} more products for ${category} with offset ${offset}`);
    
    res.json({ 
      products: finalProducts,
      category: category
    });
  } catch (error) {
    console.error('Error getting more products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset user preferences for testing
const resetUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Reset all personalized picks related preferences
    if (user.preferences) {
      user.preferences.seeMoreCounts = {};
      user.preferences.shownProducts = {};
      user.preferences.likedProducts = [];
      user.preferences.dislikedProducts = [];
    }
    
    await user.save();
    
    res.json({ 
      message: 'User preferences reset successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPersonalizedPicks,
  likeProduct,
  dislikeProduct,
  getMoreProducts,
  resetUserPreferences
}; 