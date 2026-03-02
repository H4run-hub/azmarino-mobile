import React, {createContext, useContext, useState} from 'react';
import translations from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({children}) => {
  const [language, setLanguage] = useState('ti'); // 'ti' | 'en'

  const toggleLanguage = () =>
    setLanguage(prev => (prev === 'ti' ? 'en' : 'ti'));

  const t = key => translations[language]?.[key] ?? translations['ti']?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{language, toggleLanguage, t}}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
