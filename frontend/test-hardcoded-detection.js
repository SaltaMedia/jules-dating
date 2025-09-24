// Test the hardcoded detection logic
function isProductSearchMessage(message) {
  const productKeywords = [
    'shoes', 'sneakers', 'boots', 'shirt', 'jeans', 'pants', 'jacket', 'coat', 'sweater', 'hoodie',
    't-shirt', 'polo', 'henley', 'shorts', 'chinos', 'joggers', 'sweatpants', 'vest', 'waistcoat',
    'loafers', 'vans', 'necklace', 'ring', 'earrings', 'bracelet', 'jewelry', 'pendant', 'chain',
    'button-down', 'button down', 'buttonup', 'button-up', 'blazer', 'suit', 'tie', 'belt', 'watch',
    'sunglasses', 'hat', 'cap', 'beanie', 'scarf', 'gloves', 'underwear', 'socks', 'shoes',
    'running shoes', 'dress shoes', 'casual shoes', 'formal shoes', 'athletic shoes'
  ];
  
  const searchPhrases = [
    'show me', 'find me', 'recommend', 'suggest', 'pull up', 'get me', 'buy', 'purchase', 
    'shop for', 'looking for', 'need', 'under $', 'under ', 'budget', 'affordable', 
    'cheap', 'expensive', 'price', 'links', 'where can i buy', 'where to buy',
    'more', 'other', 'different', 'options', 'alternatives', 'another', 'else'
  ];
  
  const messageLower = message.toLowerCase();
  
  // Check if message contains product keywords
  const hasProductKeyword = productKeywords.some(keyword => 
    messageLower.includes(keyword)
  );
  
  // Check if message contains search phrases
  const hasSearchPhrase = searchPhrases.some(phrase => 
    messageLower.includes(phrase)
  );
  
  // Check for specific patterns that indicate product search
  const hasProductPattern = /\$[\d,]+|under\s+\$[\d,]+|budget|price|buy|shop|purchase|links/i.test(message);
  
  // Check for brand names (new brands that might not be in keywords)
  const hasBrandName = /buck mason|rhone|outdoor voices|ten thousand|vuori|everlane|uniqlo|nike|adidas|lululemon|converse|vans|clarks|new balance|veja|common projects|sperry|red wing|thursday boots|timberland|dr\. martens|blundstone|allen edmonds|beckett simonon|magnanni|to boot new york|oliver cabell|koio|gucci|balenciaga|buck mason|gap|banana republic|muji|jungmaven|j\.crew|bonobos|todd snyder|abercrombie|reiss|taylor stitch|uniqlo|everlane|buck mason|gap|banana republic|muji|jungmaven|j\.crew|bonobos|todd snyder|abercrombie|reiss|taylor stitch/i.test(message);
  
  console.log('Message:', message);
  console.log('hasProductKeyword:', hasProductKeyword);
  console.log('hasSearchPhrase:', hasSearchPhrase);
  console.log('hasProductPattern:', hasProductPattern);
  console.log('hasBrandName:', hasBrandName);
  
  // More specific check: must have product keyword OR brand name AND search intent
  const result = ((hasProductKeyword || hasBrandName) && (hasSearchPhrase || hasProductPattern));
  console.log('Final result:', result);
  
  return result;
}

// Test the specific query
const testMessage = "Can you show me some new white shoes that I can buy for my date? preferably under $100";
console.log('Testing:', testMessage);
const result = isProductSearchMessage(testMessage);
console.log('Should show notification:', result);
