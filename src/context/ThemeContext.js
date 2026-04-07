import React, {createContext, useState, useContext, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({children}) => {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('azmarino_darkMode')
      .then(stored => {
        if (stored === 'true') setIsDark(true);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem('azmarino_darkMode', String(next));
      return next;
    });
  };

  const theme = {
    isDark,
    bg: isDark ? '#0F0F0F' : '#F9FAFB',
    cardBg: isDark ? '#1C1C1E' : '#FFFFFF',
    glassBg: isDark ? 'rgba(28, 28, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    glassBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    text: isDark ? '#FFFFFF' : '#111827',
    subText: isDark ? '#A1A1AA' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
    primary: '#E60000',
    primaryLight: isDark ? '#FF453A' : '#FF3B30',
    success: '#34C759',
    warning: '#FF9F0A',
    radius: {
      sm: 12,
      md: 20,
      lg: 32,
    },
    shadow: isDark
      ? {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 8,
        }
      : {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 10},
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 5,
        },
    glassShadow: isDark
      ? {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 8},
          shadowOpacity: 0.6,
          shadowRadius: 16,
          elevation: 10,
        }
      : {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 12},
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 6,
        },
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{theme, isDark, toggleTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};
