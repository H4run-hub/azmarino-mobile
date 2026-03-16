import React, {createContext, useState, useContext, useEffect, useRef, useMemo, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

const CART_STORAGE_KEY = 'azmarino_cart';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({children}) => {
  const [cartItems, setCartItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const isFirstRender = useRef(true);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then(json => {
        if (json) {
          try {
            const items = JSON.parse(json);
            if (Array.isArray(items)) setCartItems(items);
          } catch {}
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  // Persist cart to AsyncStorage whenever it changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!loaded) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)).catch(() => {});
  }, [cartItems, loaded]);

  const buildCartItemId = (item) => {
    const baseId = item.originalId || item.id;
    const sizePart = item.selectedSize ? `|size:${item.selectedSize}` : '';
    const colorPart = item.selectedColor ? `|color:${item.selectedColor}` : '';
    return `${baseId}${sizePart}${colorPart}`;
  };

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const computedId = buildCartItemId(product);
      const existingItem = prevItems.find(item => item.id === computedId);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === computedId
            ? {
                ...item,
                quantity: item.quantity + (product.quantity || 1),
              }
            : item
        );
      }

      return [
        ...prevItems,
        {
          ...product,
          id: computedId,
          quantity: product.quantity || 1,
          selected: product.selected ?? true,
          originalId: product.originalId || product.id,
        },
      ];
    });
  };

  const updateQuantity = (productId, change) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + change;
          if (newQuantity <= 0) {
            return null;
          }
          return {...item, quantity: newQuantity};
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleItemSelection = (productId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? {...item, selected: !item.selected} : item
      )
    );
  };

  const selectAll = () => {
    setCartItems(prevItems => prevItems.map(item => ({...item, selected: true})));
  };

  const deselectAll = () => {
    setCartItems(prevItems => prevItems.map(item => ({...item, selected: false})));
  };

  const getSelectedItems = () => {
    return cartItems.filter(item => item.selected);
  };

  const getSelectedTotal = () => {
    return cartItems
      .filter(item => item.selected)
      .reduce((total, item) => {
        const price = (item.priceNum || parseFloat(String(item.price).replace(/[^0-9.]/g, '')));
        return total + price * item.quantity;
      }, 0)
      .toFixed(2);
  };

  const getCartTotal = () => {
    return cartItems
      .reduce((total, item) => {
        const price = (item.priceNum || parseFloat(String(item.price).replace(/[^0-9.]/g, '')));
        return total + price * item.quantity;
      }, 0)
      .toFixed(2);
  };

  const getSelectedCount = () => {
    return cartItems.filter(item => item.selected).length;
  };

  const removeSelectedItems = () => {
    setCartItems(prevItems => prevItems.filter(item => !item.selected));
  };

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    toggleItemSelection,
    selectAll,
    deselectAll,
    getSelectedItems,
    getSelectedTotal,
    getSelectedCount,
    removeSelectedItems,
  }), [cartItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
