import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from '../../firebase/firebase';
import { useId } from "react";

const getProductDetails = async (productId) => {
    try {
      const productRef = doc(db, "laptops", productId.toString()); // Ensure productId is a string
      const productSnap = await getDoc(productRef);
  
      if (productSnap.exists()) {
        return { id: productSnap.id, ...productSnap.data() };
      } else {
        console.error("Product not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      throw error;
    }
  };
  
  // Function to create an order
  const createOrder = async (userId, productId) => {
    try {
      console.log(userId);
      console.log(productId);
      if (!userId || !productId) throw new Error("Invalid order data");
  
      // Fetch product details
      const product = await getProductDetails(productId);
  
      if (!product) {
        throw new Error("Product not found in database.");
      }
  
      // Create order entry in Firestore
      const ordersRef = collection(db, "orders");
  
      const newOrderRef = await addDoc(ordersRef, {
        userId: userId,
        productId: product.id,
        productName: product.model, // Ensure Firestore has "name" field in laptops
        image: product.image || "", // Store product image if available
        price: product.price || "₹0", // Ensure price is a string format
        status: "confirmed", // Default status
        timestamp: serverTimestamp(), // Firestore auto timestamp
      });
  
      console.log("Order created with ID:", newOrderRef.id);
      return newOrderRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };
  
  // Function to create an order
  const scheduleOrder = async (userId, productId, amount) => {
    console.log(userId);
    console.log(productId);
    console.log(amount);
    try {
      if (!userId || !productId) throw new Error("Invalid order data");
  
      // Fetch product details
      const product = await getProductDetails(productId);
  
      if (!product) {
        throw new Error("Product not found in database.");
      }
  
      // Create order entry in Firestore
      const ordersRef = collection(db, "orders");
  
      const newOrderRef = await addDoc(ordersRef, {
        userId: userId,
        productId: product.id,
        productName: product.model, // Ensure Firestore has "name" field in laptops
        image: product.image || "", // Store product image if available
        price: product.price || "₹0", // Ensure price is a string format
        status: "scheduled", // Default status
        timestamp: serverTimestamp(), // Firestore auto timestamp
        amount: amount
      });
  
      console.log("Order created with ID:", newOrderRef.id);
      return newOrderRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };
  export { createOrder, scheduleOrder };