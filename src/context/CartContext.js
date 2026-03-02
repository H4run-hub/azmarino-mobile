import React, {createContext, useState, useContext} from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({children}) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? {...item, quantity: item.quantity + 1}
            : item
        );
      }
      
      // Add new item with selected: true by default
      return [...prevItems, {...product, quantity: 1, selected: true}];
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

  // NEW: Toggle item selection
  const toggleItemSelection = (productId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? {...item, selected: !item.selected} : item
      )
    );
  };

  // NEW: Select all items
  const selectAll = () => {
    setCartItems(prevItems => prevItems.map(item => ({...item, selected: true})));
  };

  // NEW: Deselect all items
  const deselectAll = () => {
    setCartItems(prevItems => prevItems.map(item => ({...item, selected: false})));
  };

  // NEW: Get only selected items
  const getSelectedItems = () => {
    return cartItems.filter(item => item.selected);
  };

  // NEW: Get total for selected items only
  const getSelectedTotal = () => {
    return cartItems
      .filter(item => item.selected)
      .reduce((total, item) => {
        const price = parseFloat(item.price.replace('€', ''));
        return total + price * item.quantity;
      }, 0)
      .toFixed(2);
  };

  // Original: Get total for all items
  const getCartTotal = () => {
    return cartItems
      .reduce((total, item) => {
        const price = parseFloat(item.price.replace('€', ''));
        return total + price * item.quantity;
      }, 0)
      .toFixed(2);
  };

  // NEW: Count selected items
  const getSelectedCount = () => {
    return cartItems.filter(item => item.selected).length;
  };

  // NEW: Remove selected items (after checkout)
  const removeSelectedItems = () => {
    setCartItems(prevItems => prevItems.filter(item => !item.selected));
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    // New selection functions
    toggleItemSelection,
    selectAll,
    deselectAll,
    getSelectedItems,
    getSelectedTotal,
    getSelectedCount,
    removeSelectedItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
