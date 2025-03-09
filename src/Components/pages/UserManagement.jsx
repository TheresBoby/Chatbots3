import React, { useEffect, useState } from "react";
import {
  Clock,
  CreditCard,
  LogOut,
  Package,
  Settings,
  User,
  Wallet,
} from "lucide-react";
import { auth, db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection, query, where } from "firebase/firestore";

const UserManagement = ({ onLogout = () => {} }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "Guest User",
    email: "No email provided",
    avatar: "",
    joinDate: "New User",
    wallet: 0,
    totalOrders: 0,
    lastOrderDate: "No orders yet",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const { displayName, email, photoURL, metadata } = currentUser;
        const userRef = doc(db, "users", currentUser.uid);

        // Fetch user data in real-time
        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser((prevUser) => ({
              ...prevUser,
              name: displayName || "No Name Provided",
              email: email || "No email provided",
              avatar: photoURL || "",
              joinDate: new Date(metadata.creationTime).toLocaleDateString(),
              wallet: userData.wallet || 0,
            }));
          }
        });

        // Listen to user's orders collection
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userId", "==", currentUser.uid));

        const unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
          const totalOrders = querySnapshot.size;
          let lastOrderDate = "No orders yet";

          if (!querySnapshot.empty) {
            const lastOrder = querySnapshot.docs[querySnapshot.docs.length - 1].data();
            lastOrderDate = new Date(lastOrder.orderDate).toLocaleDateString();
          }

          setUser((prevUser) => ({
            ...prevUser,
            totalOrders,
            lastOrderDate,
          }));
        });

        return () => {
          unsubscribeSnapshot();
          unsubscribeOrders();
        };
      } else {
        setUser({
          name: "Guest User",
          email: "No email provided",
          avatar: "",
          joinDate: "New User",
          wallet: 0,
          totalOrders: 0,
          lastOrderDate: "No orders yet",
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleViewOrders = () => {
    navigate("/vieworders");
  };

  const handleSettings = () => {
    console.log("Opening Settings");
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-24 w-24 border-2 border-zinc-700 rounded-full overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="object-cover w-full h-full" />
              ) : (
                <User className="h-12 w-12 text-zinc-400" />
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-zinc-400">{user.email}</p>
              <p className="text-sm text-zinc-500">Member since {user.joinDate}</p>
            </div>
            <button
              onClick={handleSettings}
              className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-md flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Wallet className="h-4 w-4 text-emerald-400" />
              </div>
              <h3 className="ml-4 text-sm font-medium text-zinc-300">Wallet Balance</h3>
            </div>
            <div className="mt-4 text-2xl font-bold text-white">₹{user.wallet.toFixed(2)}</div>
            <p className="text-xs text-zinc-500">Available balance</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-900/30 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-400" />
              </div>
              <h3 className="ml-4 text-sm font-medium text-zinc-300">Total Orders</h3>
            </div>
            <div className="mt-4 text-2xl font-bold text-white">{user.totalOrders}</div>
            <p className="text-xs text-zinc-500">Lifetime orders</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-900/30 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-400" />
              </div>
              <h3 className="ml-4 text-sm font-medium text-zinc-300">Last Order</h3>
            </div>
            <div className="mt-4 text-2xl font-bold text-white">{user.lastOrderDate}</div>
            <p className="text-xs text-zinc-500">Most recent purchase</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <h3 className="text-zinc-200">Quick Actions</h3>
            <button onClick={handleViewOrders} className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md flex items-center gap-2">
              <Package className="h-4 w-4" />
              View Orders
            </button>
          </div>

          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <h3 className="text-zinc-200">Account Security</h3>
            <button onClick={handleLogout} className="w-full px-4 py-2 bg-red-900/80 hover:bg-red-900 text-red-100 rounded-md flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
