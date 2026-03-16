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
    bg: isDark ? '#1a1a1a' : '#f5f5f5',
    cardBg: isDark ? '#2d2d2d' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a1a',
    subText: isDark ? '#b0b0b0' : '#666666',
    border: isDark ? '#404040' : '#e9ecef',
    primary: '#FF0000',
    primaryLight: isDark ? '#ff4444' : '#ff6b6b',
    success: '#27ae60',
    warning: '#f39c12',
    shadow: isDark
      ? {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 5,
        }
      : {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{theme, isDark, toggleTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};
