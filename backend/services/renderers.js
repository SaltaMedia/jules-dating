function renderOutfitJsonToProse(json) {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (!data?.outfits?.length) return null;

    const lines = data.outfits.map((o, i) => {
      const items = (o.items || []).join(', ');
      const swaps = (o.swaps || []).join(' · ');
      return [
        `${o.name || `Option ${i+1}`}: ${items}.`,
        `Why: ${o.why || 'Balanced for the context.'}`,
        swaps ? `Swaps: ${swaps}.` : null
      ].filter(Boolean).join(' ');
    });

    return lines.join('\n\n');
  } catch {
    return null;
  }
}

module.exports = { renderOutfitJsonToProse };
