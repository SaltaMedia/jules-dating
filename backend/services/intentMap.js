function normalizeIntent(raw) {
  const t = (raw || '').toLowerCase();
  if (['style', 'outfit', 'styling', 'style_feedback'].includes(t)) return 'style_feedback';
  if (['images', 'inspo', 'style_images'].includes(t)) return 'style_images';
  if (['shop', 'buy', 'links', 'product', 'product_recommendation'].includes(t)) return 'style_feedback'; // Redirect to style_feedback
  if (['conf', 'confidence', 'confidence_boost'].includes(t)) return 'confidence_boost';
  return 'conversation';
}

module.exports = { normalizeIntent };
