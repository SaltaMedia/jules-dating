const context = [
  { role: 'user', content: 'I need help with a coffee date outfit' }, 
  { role: 'assistant', content: 'For a coffee date, I\'d recommend olive green pants with a white crew neck tee and a denim jacket. It\'s the perfect smart casual look.' }
];

function extractOutfitPiecesFromAdvice(context) {
  if (!context || context.length === 0) return { outfitPieces: [], styleDescriptors: [] };
  
  const outfitPieces = [];
  const contextText = context.map(msg => msg.content).join(' ').toLowerCase();
  
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
  
  return { outfitPieces, styleDescriptors: [] };
}

const { outfitPieces, styleDescriptors } = extractOutfitPiecesFromAdvice(context);
console.log('Outfit pieces found:', outfitPieces);
console.log('Style descriptors:', styleDescriptors);

let searchQuery;
if (context && context.length > 0) {
  if (outfitPieces.length > 0) {
    console.log('PRIORITY 1: Using outfit pieces');
    const outfitQuery = outfitPieces.slice(0, 3).join(' ');
    searchQuery = `men ${outfitQuery} street style fashion photography`;
    console.log('FINAL SEARCH QUERY:', searchQuery);
  } else {
    console.log('Fallback to generic query');
    searchQuery = 'men casual outfit';
  }
}

console.log('RESULT - Search Query:', searchQuery);
console.log('EXPECTED: men olive green pants street style fashion photography');
console.log('ACTUAL:  ', searchQuery);
console.log('MATCH:   ', searchQuery === 'men olive green pants street style fashion photography' ? '✅ PASS' : '❌ FAIL'); 