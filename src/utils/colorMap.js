// Map Tigrinya color names (as stored in products.js) to translation keys
const COLOR_KEY_MAP = {
  'ጸሊም': 'colorBlack',
  'ጻዕዳ': 'colorWhite',
  'ሰማያዊ': 'colorBlue',
  'ቀይሕ': 'colorRed',
  'ሲልቨር': 'colorSilver',
  'ቡናዊ': 'colorBrown',
  'ሮዛ': 'colorPink',
  'ቢጫ': 'colorYellow',
  'ሓምላዊ': 'colorGreen',
  'ብሩህ': 'colorBright',
};

/**
 * Translate a color name using the i18n `t()` function.
 * Handles Tigrinya color values stored in product data and returns
 * the translated label for the current language.
 *
 * @param {string} color  – raw color value from product data
 * @param {Function} t    – translation function from useLanguage()
 * @returns {string}
 */
export const getColorLabel = (color, t) => {
  if (!color || typeof color !== 'string') return color;
  const key = COLOR_KEY_MAP[color.trim()];
  return key ? t(key) : color;
};
