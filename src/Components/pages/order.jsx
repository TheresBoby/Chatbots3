import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import ChatbotSection from './ChatbotSection';
import './Order.css';
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
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load wallet balance
  useEffect(() => {
    const fetchWalletBalance = async (userId) => {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setWalletBalance(userSnap.data().wallet || 0);
      }
    };

    if (user) {
      fetchWalletBalance(user.uid);
    }
  }, [user, db]);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle wallet payment
  const handleWalletPayment = async () => {
    setIsProcessing(true);
    try {
      const productPrice = parseFloat(product.price.replace(/[^0-9.-]+/g, ""));
      if (walletBalance >= productPrice) {
        // Update wallet balance
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          wallet: walletBalance - productPrice
        });

        // Place order
        const orderRef = await addDoc(collection(db, "orders"), {
          userId: user.uid,
          productId: product.id || Math.random().toString(36).substr(2, 9),
          productName: product.title || "Unknown",
          price: product.price || 0,
          image: product.image || "",
          timestamp: new Date(),
          status: "confirmed",
          paymentMethod: "wallet"
        });

        setOrderId(orderRef.id);
        setPaymentMethod("wallet");
      } else {
        setError("Insufficient wallet balance");
      }
    } catch (err) {
      setError("Failed to process wallet payment");
      console.error("Payment Error:", err);
    }
    setIsProcessing(false);
  };

  // Handle Razorpay payment
  const handleOnlinePayment = async () => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load");
      return;
    }

    const productPrice = parseFloat(product.price.replace(/[^0-9.-]+/g, ""));
    const options = {
      key: "rzp_test_lg6GowxZGe2D3a",
      amount: productPrice * 100,
      currency: "INR",
      name: "STARTUP_PROJECTS",
      description: `Payment for ${product.title}`,
      handler: async function (response) {
        try {
          const orderRef = await addDoc(collection(db, "orders"), {
            userId: user.uid,
            productId: product.id || Math.random().toString(36).substr(2, 9),
            productName: product.title || "Unknown",
            price: product.price || 0,
            image: product.image || "",
            timestamp: new Date(),
            status: "confirmed",
            paymentMethod: "online",
            paymentId: response.razorpay_payment_id
          });
          setOrderId(orderRef.id);
          setPaymentMethod("online");
        } catch (err) {
          setError("Failed to process payment");
          console.error("Payment Error:", err);
        }
      },
      prefill: {
        name: user?.displayName || "",
        email: user?.email || "",
      },
      theme: {
        color: "#16a34a"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="split-container">
      <ChatbotSection />
      <div className="order-section">
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
          {!orderId && !error ? (
            <div className="w-full max-w-md space-y-6">
              <h1 className="text-3xl font-bold text-center mb-8">Complete Payment</h1>
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between mb-4">
                  <span>Amount to Pay:</span>
                  <span className="font-bold text-green-400">{product?.price}</span>
                </div>
                <div className="flex justify-between mb-6">
                  <span>Wallet Balance:</span>
                  <span className="font-bold text-blue-400">₹{walletBalance.toFixed(2)}</span>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={handleWalletPayment}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg disabled:opacity-50"
                  >
                    Pay with Wallet
                  </button>
                  <button
                    onClick={handleOnlinePayment}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg disabled:opacity-50"
                  >
                    Pay Online
                  </button>
                </div>
              </div>
            </div>
          ) : orderId ? (
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold">Order Confirmed!</h1>
              <p className="text-green-400">Order ID: {orderId}</p>
              <p className="text-gray-400">Payment Method: {paymentMethod}</p>
              <p className="text-gray-400">Expected delivery in 4 days</p>
              <Button 
                onClick={() => navigate("/firstpage")} 
                variant="outlined"
                className="mt-6"
              >
                Go Home
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-red-500 text-lg">{error}</p>
              <Button 
                onClick={() => navigate("/firstpage")} 
                variant="outlined"
                className="mt-6"
              >
                Go Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Order;
