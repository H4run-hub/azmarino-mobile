import {ANTHROPIC_API_KEY, CLAUDE_MODEL} from '../config/apiConfig';

const SYSTEM_PROMPT = `You are a product identification assistant for an e-commerce store called Azmarino.
The store sells: clothing for men, women and kids; electronics (phones, laptops, headphones); shoes; and accessories (bags, backpacks, etc.).

When given an image, identify what product type it is and map it to our store's categories.
Always respond with ONLY valid JSON — no explanation, no markdown, no extra text.`;

const USER_PROMPT = `Look at this image and identify the product.

Respond with ONLY this JSON structure:
{
  "identified": "short product name in English",
  "category": "one of: men-clothing | women-clothing | kids-clothing | electronics | shoes | accessories",
  "keywords": ["3 to 6 relevant search keywords in English"],
  "confidence": "high | medium | low"
}

Rules:
- If you see clothing worn by or clearly for a man → men-clothing
- If you see clothing worn by or clearly for a woman → women-clothing  
- If you see clothing for children → kids-clothing
- If you see a phone, laptop, tablet, headphones, earbuds, computer → electronics
- If you see shoes, boots, sneakers, sandals → shoes
- If you see a bag, backpack, wallet, watch, belt, jewellery → accessories
- keywords should be common search terms a shopper would use
- Always pick the closest category even if uncertain`;

/**
 * Send a base64 image to Claude and get back product identification.
 * @param {string} base64Image - base64 encoded image (no data: prefix)
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @returns {Promise<{identified, category, keywords, confidence}>}
 */
export const identifyProductFromImage = async (base64Image, mimeType = 'image/jpeg') => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: USER_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  // Strip any accidental markdown fences
  const clean = text.replace(/```json|```/gi, '').trim();
  return JSON.parse(clean);
};
