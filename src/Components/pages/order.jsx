import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";


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
    <div className="order-section">
      <div className="order-content">
        {/* ... existing order content ... */}
      </div>
    </div>
  );
};

export default Order;