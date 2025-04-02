import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./Wallet.css";
import { FiBell, FiShoppingBag, FiMoreVertical } from "react-icons/fi";

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setBalance(userSnap.data().wallet || 0);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddMoney = () => {
    navigate("/payment", { state: { userId } });
  };

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        {/* Header */}
        <div className="wallet-header">
          <h2>My Wallet</h2>
          <div className="wallet-icons">
            <FiBell size={22} />
            <FiShoppingBag size={22} />
            <FiMoreVertical size={22} />
          </div>
        </div>

        {/* Balance Section */}
        <div className="balance-card">
          <p className="available-balance">Available Balance</p>
          <h1 className="balance-amount">₹{balance.toLocaleString()}</h1>
          <button className="add-money-btn" onClick={handleAddMoney}>
            + Add Money
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
