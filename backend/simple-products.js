const express = require('express');
const router = express.Router();
const axios = require('axios');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extract products from Jules's response
function extractProducts(julesResponse) {
  const productRegex = /\*\*([^*]+)\*\*\s*-\s*\$([\d,]+)/g;
  const products = [];
  let match;
  
  while ((match = productRegex.exec(julesResponse)) !== null) {
    products.push({
      title: match[1].trim(),
      price: `$${match[2]}`
    });
  }
  
  return products;
}

// Build search query
function buildSearchQuery(productName, userMessage) {
  const colorMatch = userMessage.toLowerCase().match(/(white|black|blue|red|green|brown|gray|grey|navy|olive|tan|beige|cream|pink|purple|yellow|orange)/);
  const priceMatch = userMessage.toLowerCase().match(/under\s*\$?(\d+)|less\s*than\s*\$?(\d+)|budget\s*\$?(\d+)/);
  
  let query = productName;
  
  if (colorMatch && !productName.toLowerCase().includes(colorMatch[0])) {
    query = `${colorMatch[0]} ${productName}`;
  }
  
  if (priceMatch) {
    const priceLimit = priceMatch[1] || priceMatch[2] || priceMatch[3];
    query += ` under $${priceLimit}`;
  }
  
  return `${query} buy shop`;
}

// Simple product search
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get Jules response
    const systemPrompt = `You are Jules, a fashion AI. When users ask for products, recommend 2-3 specific items with this format:

**Product Name** - $Price
- Why I love these: [reason]

Example:
**Nike Air Force 1 '07** - $100
- Why I love these: Classic and versatile

Current request: ${message}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.8
    });

    const julesResponse = completion.choices[0].message.content;
    const extractedProducts = extractProducts(julesResponse);
    
    // Search for real links
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    
    if (!apiKey || !cseId) {
      return res.json({
        response: julesResponse,
        products: [],
        hasProducts: false
      });
    }

    const allProducts = [];

    for (const product of extractedProducts.slice(0, 3)) {
      const searchQuery = buildSearchQuery(product.title, message);
      console.log(`Searching: ${searchQuery}`);
      
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: apiKey,
            cx: cseId,
            q: searchQuery,
            num: 5,
            safe: 'active'
          }
        });

        const results = (response.data.items || [])
          .filter(item => {
            const url = item.link.toLowerCase();
            const text = (item.title + ' ' + (item.snippet || '')).toLowerCase();
            
            // Block obvious junk only
            if (/youtube\.com|reddit\.com|instagram\.com|facebook\.com|twitter\.com|blog|article|news|review/i.test(url)) {
              return false;
            }
            
            // Must be shopping related
            return /shop|store|buy|product|clothing|fashion|sneaker|shoe|purchase|cart|price/i.test(text);
          })
          .slice(0, 1)
          .map(item => ({
            title: product.title,
            link: item.link,
            image: item.pagemap?.cse_image?.[0]?.src || '',
            price: product.price,
            description: item.snippet || ''
          }));

        allProducts.push(...results);
        
      } catch (error) {
        console.error(`Search error for ${product.title}:`, error.message);
      }
    }

    res.json({
      response: julesResponse,
      products: allProducts,
      hasProducts: allProducts.length > 0,
      totalFound: allProducts.length
    });

  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      error: 'Product search failed',
      products: [],
      hasProducts: false
    });
  }
});

module.exports = router;
