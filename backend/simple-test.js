const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Test route without authentication
app.post('/api/inspiration/test', async (req, res) => {
  console.log('DEBUG: Test endpoint called');
  console.log('DEBUG: Request body:', req.body);
  
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Extract clothing type from message and conversation context
    const clothingType = extractClothingTypeFromContext(message, context);
    console.log(`DEBUG: Clothing type extracted: ${clothingType}`);
    
    // Extract specific outfit pieces from Jules's advice
    const { outfitPieces, styleDescriptors } = extractOutfitPiecesFromAdvice(context);
    console.log(`DEBUG: Extracted outfit pieces: ${outfitPieces.join(', ')}`);
    console.log(`DEBUG: Extracted style descriptors: ${styleDescriptors.join(', ')}`);
    
    // Build search query using the fixed logic
    let searchQuery;
    
    if (context && context.length > 0) {
      // PRIORITY 1: Use specific clothing items found in context (highest priority)
      if (outfitPieces.length > 0) {
        console.log(`DEBUG: PRIORITY 1: Using outfit pieces: ${outfitPieces.join(', ')}`);
        
        // Use the specific outfit pieces Jules mentioned
        const outfitQuery = outfitPieces.slice(0, 3).join(' ');
        searchQuery = `men ${outfitQuery} street style fashion photography`;
        
        console.log(`DEBUG: FINAL SEARCH QUERY: "${searchQuery}"`);
      } else {
        // Fallback to clothing type
        searchQuery = `men ${clothingType} street style fashion photography`;
      }
    } else {
      searchQuery = `men ${clothingType} street style fashion photography`;
    }
    
    // Simple response without external APIs
    const julesResponse = "Here's what that looks like. These are the vibes you want.";
    
    res.json({ 
      response: julesResponse,
      images: [],
      query: searchQuery,
      clothingType: clothingType,
      hasImages: false,
      totalFound: 0,
      debug: {
        outfitPieces: outfitPieces,
        styleDescriptors: styleDescriptors,
        searchQuery: searchQuery
      }
    });
    
  } catch (error) {
    console.error('Inspiration search error:', error);
    res.status(500).json({ 
      error: 'Inspiration search failed',
      images: [],
      hasImages: false
    });
  }
});

// Helper functions (copied from inspiration.js)
function extractClothingTypeFromContext(message, context) {
  const messageLower = message.toLowerCase();
  
  // Look for color + clothing combinations
  const colors = ['olive green', 'light blue', 'dark blue', 'forest green', 'emerald green', 'royal blue', 'navy blue', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey', 'navy', 'olive', 'beige', 'cream', 'tan', 'burgundy', 'maroon', 'coral', 'teal', 'turquoise', 'lime', 'gold', 'silver', 'bronze', 'copper', 'rose', 'lavender', 'mint', 'sage', 'forest', 'emerald', 'royal', 'light', 'dark', 'bright', 'muted', 'pastel', 'neon', 'vintage', 'faded', 'distressed'];
  
  const clothingItems = ['pants', 'jeans', 'shorts', 'chinos', 'khakis', 'trousers', 'leggings', 'joggers', 'shirt', 'tshirt', 't-shirt', 'tee', 'blouse', 'top', 'sweater', 'hoodie', 'jacket', 'blazer', 'coat', 'vest', 'cardigan', 'sweatshirt', 'dress', 'skirt', 'shoes', 'sneakers', 'boots', 'loafers', 'sandals', 'heels', 'flats', 'hat', 'cap', 'scarf', 'belt', 'bag', 'purse'];
  
  // Check longer color names first
  const sortedColors = colors.sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    for (const item of clothingItems) {
      const pattern = new RegExp(`\\b${color}\\s+${item}\\b`, 'i');
      if (pattern.test(message)) {
        return `${color} ${item}`;
      }
    }
  }
  
  // If no clothing type found in current message, look in conversation context
  if (context && context.length > 0) {
    for (let i = context.length - 1; i >= 0; i--) {
      const msg = context[i];
      
      for (const color of sortedColors) {
        for (const item of clothingItems) {
          const pattern = new RegExp(`\\b${color}\\s+${item}\\b`, 'i');
          if (pattern.test(msg.content)) {
            return `${color} ${item}`;
          }
        }
      }
    }
  }
  
  return 'style';
}

function extractOutfitPiecesFromAdvice(context) {
  if (!context || context.length === 0) return { outfitPieces: [], styleDescriptors: [] };
  
  const outfitPieces = [];
  const contextText = context.map(msg => msg.content).join(' ').toLowerCase();
  
  // Look for color + clothing combinations
  const colors = ['olive green', 'light blue', 'dark blue', 'forest green', 'emerald green', 'royal blue', 'navy blue', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey', 'navy', 'olive', 'beige', 'cream', 'tan', 'burgundy', 'maroon', 'coral', 'teal', 'turquoise', 'lime', 'gold', 'silver', 'bronze', 'copper', 'rose', 'lavender', 'mint', 'sage', 'forest', 'emerald', 'royal', 'light', 'dark', 'bright', 'muted', 'pastel', 'neon', 'vintage', 'faded', 'distressed'];
  
  const clothingItems = ['pants', 'jeans', 'shorts', 'chinos', 'khakis', 'trousers', 'leggings', 'joggers', 'shirt', 'tshirt', 't-shirt', 'tee', 'blouse', 'top', 'sweater', 'hoodie', 'jacket', 'blazer', 'coat', 'vest', 'cardigan', 'sweatshirt', 'dress', 'skirt', 'shoes', 'sneakers', 'boots', 'loafers', 'sandals', 'heels', 'flats', 'hat', 'cap', 'scarf', 'belt', 'bag', 'purse'];
  
  const sortedColors = colors.sort((a, b) => b.length - a.length);
  
  for (const color of sortedColors) {
    for (const item of clothingItems) {
      const pattern = new RegExp(`\\b${color}\\s+${item}\\b`, 'gi');
      const matches = contextText.match(pattern);
      if (matches) {
        outfitPieces.push(...matches);
      }
    }
  }
  
  const styleDescriptors = [];
  if (contextText.includes('baggy') || contextText.includes('baggier')) styleDescriptors.push('baggy');
  if (contextText.includes('fitted') || contextText.includes('slim')) styleDescriptors.push('fitted');
  if (contextText.includes('casual')) styleDescriptors.push('casual');
  if (contextText.includes('relaxed')) styleDescriptors.push('relaxed');
  
  return { outfitPieces, styleDescriptors };
}

// Start server
app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/inspiration/test`);
}); 