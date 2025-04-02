import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import "./Payment.css";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Function to Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ✅ Function to Handle Payment
  const handlePayment = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsProcessing(true);
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Check your internet connection.");
      setIsProcessing(false);
      return;
    }

    const options = {
      key: "rzp_test_lg6GowxZGe2D3a",
      amount: parseFloat(amount) * 100,
      currency: "INR",
      name: "STARTUP_PROJECTS",
      description: "Wallet Recharge",
      handler: async function (response) {
        try {
          // Update wallet balance in Firestore
          const userRef = doc(db, "users", location.state.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const currentBalance = userSnap.data().wallet || 0;
            await updateDoc(userRef, {
              wallet: currentBalance + parseFloat(amount)
            });
          }
          
          // Show success message and redirect
          alert("Payment successful! Your wallet has been updated.");
          navigate("/profile"); // Redirect to user management
        } catch (error) {
          console.error("Error updating wallet:", error);
          alert("Payment successful but wallet update failed. Please contact support.");
        }
      },
      prefill: {
        name: "Aadithyaa",
        email: "aadithyaa@gmail.com",
        contact: "8606783591",
      },
      theme: {
        color: "#4f46e5",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setIsProcessing(false);
  };

  // ✅ Numeric Keypad Functions
  const handleKeyPress = (num) => {
    setAmount((prev) => prev + num);
  };

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  return (
    <div className="payment-container">
      <div className="payment-header">
        <button 
          onClick={() => navigate("/profile")} 
          className="back-button"
        >
          ← Back to Profile
        </button>
        <h2>Add Money to Wallet</h2>
      </div>

      <div className="amount-display">₹{amount || "0"}</div>

      <div className="keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0].map((num) => (
          <button 
            key={num} 
            onClick={() => handleKeyPress(num.toString())}
            disabled={isProcessing}
          >
            {num}
          </button>
        ))}
        <button onClick={handleBackspace} disabled={isProcessing}>⌫</button>
        <button 
          className="confirm-btn" 
          onClick={handlePayment}
          disabled={isProcessing || !amount}
        >
          {isProcessing ? "Processing..." : "✔"}
        </button>
      </div>
    </div>
  );
};

export default Payment;
