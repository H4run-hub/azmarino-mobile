import React, {createContext, useContext, useState, useCallback, useEffect, useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RecentlyViewedContext = createContext();

const MAX_RECENT = 20;
const RV_STORAGE_KEY = 'azmarino_recently_viewed';

export const RecentlyViewedProvider = ({children}) => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const isFirstRender = useRef(true);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(RV_STORAGE_KEY)
      .then(json => {
        if (json) {
          try {
            const items = JSON.parse(json);
            if (Array.isArray(items)) setRecentlyViewed(items);
          } catch {}
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  // Persist whenever list changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!loaded) return;
    AsyncStorage.setItem(RV_STORAGE_KEY, JSON.stringify(recentlyViewed)).catch(() => {});
  }, [recentlyViewed, loaded]);

  const addToRecentlyViewed = useCallback(product => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  return (
    <RecentlyViewedContext.Provider
      value={{recentlyViewed, addToRecentlyViewed, clearRecentlyViewed}}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);
