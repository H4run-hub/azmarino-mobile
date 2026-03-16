import {Platform, Vibration} from 'react-native';

// Safe vibration wrapper — never throws even if VIBRATE permission is missing
const safeVibrate = (pattern) => {
  try {
    Vibration.vibrate(pattern);
  } catch (_) {
    // Permission not granted or device doesn't support vibration — silently skip
  }
};

/** Light haptic tap (10ms vibration on Android, noop on iOS without native module) */
export const lightTap = () => {
  if (Platform.OS === 'android') {
    safeVibrate(10);
  }
};

/** Medium haptic tap (25ms) */
export const mediumTap = () => {
  if (Platform.OS === 'android') {
    safeVibrate(25);
  }
};

/** Success haptic pattern */
export const successTap = () => {
  if (Platform.OS === 'android') {
    safeVibrate([0, 15, 60, 15]);
  }
};
