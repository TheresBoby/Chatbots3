import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import ChatbotSection from './ChatbotSection'; // Import the ChatbotSection component
import './Order.css'; // Import the CSS file
import Button from '@mui/material/Button';

const Order = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const product = location.state?.product;
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setError("User not logged in!");
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!user || !product) return;

    const placeOrder = async () => {
      try {
        const orderRef = await addDoc(collection(db, "orders"), {
          userId: user.uid,
          productId: product.id || Math.random().toString(36).substr(2, 9),
          productName: product.title || "Unknown",
          price: product.price || 0,
          image: product.image || "",
          timestamp: new Date(),
          status: "confirmed",
        });

        setOrderId(orderRef.id);
      } catch (err) {
        setError("Failed to place order. Please try again.");
        console.error("Order Error:", err);
      }
    };

    placeOrder();
  }, [user, product, db]);

  return (
    <div className="split-container">
      {/* Chatbot Section - Left 50% */}
      <ChatbotSection />

      {/* Order Section - Right 50% */}
      <div className="order-section">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
          <h1 className="text-3xl font-bold">Order Confirmation</h1>
          <div className="order-container">
          <h1 className="order-message">Hey, your order has been placed!</h1>
          <p className="delivery-message">Expected delivery in 4 days</p>
        </div>
          {error ? (
            <p className="text-red-500 mt-4">{error}</p>
          ) : orderId ? (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg text-center">
              <p className="text-green-400 text-lg">Order ID: {orderId}</p>
              {product && (
                <>
                  <img src={product.image} alt={product.title} className="w-60 mx-auto" />
                  <h2 className="mt-2 font-semibold">{product.title}</h2>
                  <p className="text-green-400">{product.price}</p>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-400 mt-4">Placing your order...</p>
          )}

          
          <Button onClick={() => navigate("/firstpage")} variant="outlined">Go Home</Button>
        </div>
      </div>
    </div>
  );
};

export default Order;
