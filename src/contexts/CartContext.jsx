import React, { createContext, useState, useContext, useEffect } from "react";
import { CartService } from "../Components/pages/cartService";
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Initialize cart
          await CartService.initializeCart(user.uid);
          
          // Subscribe to cart changes
          const unsubscribeCart = CartService.subscribeToCart(
            user.uid,
            (items) => {
              console.log('Cart items updated:', items); // Debug log
              setCartItems(items || []);
              setLoading(false);
            }
          );
          return () => unsubscribeCart();
        } catch (error) {
          console.error('Error initializing cart:', error);
          setLoading(false);
        }
      } else {
        setCartItems([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const addToCart = async (item) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Please login to add items to cart');
      }
      console.log('Adding to cart:', item); // Debug log
      await CartService.addToCart(auth.currentUser.uid, item);
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (id) => {
    try {
      if (!auth.currentUser) return;
      await CartService.removeFromCart(auth.currentUser.uid, id);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      if (!auth.currentUser) return;
      await CartService.clearCart(auth.currentUser.uid);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      clearCart,
      loading 
    }}>
      {children}
    </CartContext.Provider>
  );
};
