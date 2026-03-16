import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL_OVERRIDE} from '../config/apiConfig';

const API_BASE_URL = API_BASE_URL_OVERRIDE || 'https://api.azmarino.online';

/**
 * Send a base64 image to our backend vision proxy which calls Claude.
 * The API key is stored securely on the server, not in the mobile app.
 *
 * @param {string} base64Image - base64 encoded image (no data: prefix)
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @returns {Promise<{identified, category, keywords, confidence}>}
 */
export const identifyProductFromImage = async (base64Image, mimeType = 'image/jpeg') => {
  const token = await AsyncStorage.getItem('azmarino_token');

  const response = await axios.post(
    `${API_BASE_URL}/api/vision/identify`,
    {
      image: base64Image,
      mimeType,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      },
      timeout: 30000,
    },
  );

  const data = response.data;

  if (!data.success) {
    throw new Error(data.message || 'Image analysis failed');
  }

  return {
    identified: data.identified,
    category: data.category,
    keywords: data.keywords || [],
    confidence: data.confidence || 'medium',
  };
};
