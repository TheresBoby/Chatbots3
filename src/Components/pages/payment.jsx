import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "./Payment.css"; // Include styles

const Payment = () => {
  const location = useLocation();
  const [amount, setAmount] = useState("");

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

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Check your internet connection.");
      return;
    }

    const options = {
      key: "rzp_test_lg6GowxZGe2D3a", // Replace with your Razorpay Key
      amount: parseFloat(amount) * 100, // Convert to paise
      currency: "INR",
      name: "STARTUP_PROJECTS",
      description: "Wallet Recharge",
      handler: function (response) {
        console.log("Payment Successful! ID:", response.razorpay_payment_id);
        alert("Payment successful! ID: " + response.razorpay_payment_id);
      },
      prefill: {
        name: "Aadithyaa",
        email: "aadithyaa@gmail.com",
        contact: "8606783591",
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
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
      <h2>Enter Amount to Add</h2>
      <div className="amount-display">₹{amount || "0"}</div>

      {/* Numeric Keypad */}
      <div className="keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0].map((num) => (
          <button key={num} onClick={() => handleKeyPress(num.toString())}>
            {num}
          </button>
        ))}
        <button onClick={handleBackspace}>⌫</button>
        <button className="confirm-btn" onClick={handlePayment}>
          ✔
        </button>
      </div>
    </div>
  );
};

export default Payment;
