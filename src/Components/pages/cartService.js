import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export const CartService = {
  // Initialize cart for user
  initializeCart: async (userId) => {
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);
    
    if (!cartSnap.exists()) {
      await setDoc(cartRef, { items: [] });
    }
    return cartRef;
  },

  // Add item to cart
  addToCart: async (userId, product) => {
    try {
      const cartRef = doc(db, "carts", userId);
      const cartSnap = await getDoc(cartRef);
      
      if (!cartSnap.exists()) {
        await setDoc(cartRef, { items: [product] });
      } else {
        const currentItems = cartSnap.data().items || [];
        const existingItem = currentItems.find(item => item.id === product.id);
        
        if (!existingItem) {
          await updateDoc(cartRef, {
            items: [...currentItems, product]
          });
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (userId, productId) => {
    try {
      const cartRef = doc(db, "carts", userId);
      const cartSnap = await getDoc(cartRef);
      
      if (cartSnap.exists()) {
        const currentItems = cartSnap.data().items || [];
        const updatedItems = currentItems.filter(item => item.id !== productId);
        
        await updateDoc(cartRef, {
          items: updatedItems
        });
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  },

  // Clear cart
  clearCart: async (userId) => {
    try {
      const cartRef = doc(db, "carts", userId);
      await updateDoc(cartRef, {
        items: []
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  },

  // Subscribe to cart changes
  subscribeToCart: (userId, onUpdate) => {
    const cartRef = doc(db, "carts", userId);
    return onSnapshot(cartRef, 
      (doc) => {
        if (doc.exists()) {
          onUpdate(doc.data().items || []);
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        console.error("Error subscribing to cart:", error);
      }
    );
  }
};