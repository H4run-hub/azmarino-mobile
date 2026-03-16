import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({children}) => {
  const [language, setLanguage] = useState('ti');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('azmarino_language')
      .then(stored => {
        if (stored === 'ti' || stored === 'en') setLanguage(stored);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const toggleLanguage = () =>
    setLanguage(prev => {
      const next = prev === 'ti' ? 'en' : 'ti';
      AsyncStorage.setItem('azmarino_language', next);
      return next;
    });

  const t = key => translations[language]?.[key] ?? translations['ti']?.[key] ?? key;

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{language, toggleLanguage, t}}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
