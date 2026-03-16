/**
 * Responsive scaling utilities
 * Scales all sizes relative to a 375px (iPhone SE/standard) base width.
 * On smaller screens text shrinks, on larger screens it grows — nothing gets cut off.
 *
 * Usage:
 *   import { s, vs, fs } from '../utils/scale';
 *   fontSize: fs(14),        // font size that scales with screen
 *   paddingHorizontal: s(12), // horizontal spacing
 *   paddingVertical: vs(8),   // vertical spacing
 */
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375; // design reference width
const BASE_HEIGHT = 812; // design reference height

/**
 * Horizontal scale — use for widths, horizontal padding/margin, horizontal positions
 */
export const s = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

/**
 * Vertical scale — use for heights, vertical padding/margin, vertical positions
 */
export const vs = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

/**
 * Font scale — uses a moderated scale factor so fonts don't get too big/small.
 * Blends between fixed and scaled (60% scaled, 40% fixed) for readability.
 * Also respects PixelRatio for crisp rendering.
 */
export const fs = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * (0.5 + scale * 0.5); // moderate: 50% fixed + 50% scaled
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Line height — proportional to font size with comfortable reading ratio
 */
export const lh = (fontSize) => Math.round(fontSize * 1.45);

export default { s, vs, fs, lh };
