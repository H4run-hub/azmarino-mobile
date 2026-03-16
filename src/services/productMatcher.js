/**
 * Score a single product against the vision result.
 * Higher = better match.
 */
const scoreProduct = (product, {category, keywords}) => {
  let score = 0;
  const haystack = `${product.name} ${product.tigrinya || ''} ${product.description || ''}`.toLowerCase();

  // Category match is the strongest signal
  if (product.category === category) score += 10;

  // Broad category family match (e.g. any clothing)
  const clothingCats = ['men-clothing', 'women-clothing', 'kids-clothing'];
  if (
    clothingCats.includes(category) &&
    clothingCats.includes(product.category)
  ) {
    score += 4;
  }

  // Keyword matches in product text
  keywords.forEach(kw => {
    if (haystack.includes(kw.toLowerCase())) score += 3;
  });

  // Boost bestsellers and featured slightly so fallbacks are quality items
  if (product.bestseller) score += 1;
  if (product.featured) score += 1;

  return score;
};

/**
 * Given a Claude vision result, return a sorted list of products.
 * ALWAYS returns results — never an empty array.
 *
 * @param {{identified, category, keywords, confidence}} visionResult
 * @param {Array} [productList] — optional list to match against (e.g. from API); falls back to local products
 * @returns {{ results: Product[], label: string, isFallback: boolean }}
 */
export const matchProducts = (visionResult, productList) => {
  const {identified, category, keywords = [], confidence} = visionResult;
  const list = Array.isArray(productList) && productList.length > 0 ? productList : [];

  // Score every product
  const scored = list
    .map(p => ({product: p, score: scoreProduct(p, {category, keywords})}))
    .sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score ?? 0;

  // Strong match: at least one product scored well (category + keyword hit)
  if (topScore >= 10) {
    const results = scored.filter(s => s.score >= 8).map(s => s.product);
    return {
      results,
      label: identified,
      isFallback: false,
    };
  }

  // Medium match: same category exists but no keyword overlap
  if (topScore >= 10 || category) {
    const sameCat = scored.filter(s => s.score >= 4).map(s => s.product);
    if (sameCat.length > 0) {
      return {
        results: sameCat,
        label: identified,
        isFallback: false,
      };
    }
  }

  // Fallback: return top-scored products regardless (always has items)
  return {
    results: scored.slice(0, 6).map(s => s.product),
    label: identified,
    isFallback: true,
  };
};
