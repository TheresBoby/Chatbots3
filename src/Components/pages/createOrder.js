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
  const scheduleOrder = async (userId, productId, amount, context) => {
    console.log(userId);
    console.log(productId);
    console.log(amount);
    var resp_txt = '';
    try {
      if (!userId || !productId) throw new Error("Invalid order data");
  
      // Fetch product details
      const product = await getProductDetails(productId);
  
      if (!product) {
        throw new Error("Product not found in database.");
      }
  
      // Create order entry in Firestore
      const ordersRef = collection(db, "orders");
      if(amount > product.price) {
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
        resp_txt = "The " + product.model + " currently costs ₹" + product.price + ", which is above your maximum budget of ₹" + amount +". We'll notify you when the price drops below your budget."
        var order_id = newOrderRef.id;
      }
      else {
        resp_txt = "The " + product.model + " currently costs ₹" + product.price + ", which is lesser than your budget of ₹" + amount +". You can buy it now with a lesser price. <button id='buy' data-message=" + productId +" data-type='buy' type='button' class='bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50 mr-2'>Buy Now</button>";
        var order_id = null;
      }
      return {order_id: order_id,
        response: resp_txt,
        context:context,
        info: 'schedule_amount',
        ui_actions:[]
      };
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };
  export { createOrder, scheduleOrder };