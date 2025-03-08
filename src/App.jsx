import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { auth } from './firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

// Components
import Login from "./Components/pages/Login";
import SignUp from "./Components/pages/Signup";
import FirstPage from "./Components/pages/FirstPage";
import LaptopPage from "./Components/pages/LaptopPage";
import Purchase from "./Components/pages/Purchase";
import CartPage from "./Components/pages/Cart";
import UserManagement from "./Components/pages/UserManagement";
import AdminDashboard from "./Components/pages/AdminDashboard";
import AdminHome from "./Components/pages/AdminHome";
import Order from "./Components/pages/order"; // ✅ Import Order.jsx
import ViewOrders from "./Components/pages/ViewOrders";


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  
  if (loading) {
    return <div>Loading authentication...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const [user, loading] = useAuthState(auth);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <CartProvider>
      <Router>
        <div className="split-screen">
          <div className="right-screen">
            <Suspense fallback={<div>Loading Content... Please wait.</div>}>
              <Routes>
                {/* Authentication Routes */}
                <Route path="/" element={!user ? <Login /> : <Navigate to="/FirstPage" />} />
                <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/FirstPage" />} />

                {/* Protected Routes */}
                <Route path="/FirstPage" element={
                  <ProtectedRoute>
                    <FirstPage />
                  </ProtectedRoute>
                } />
                <Route path="/user-management" element={
                  <ProtectedRoute>
                    <UserManagement user={user} onLogout={handleLogout} />
                  </ProtectedRoute>
                } />
                
                {/* Other Protected Routes */}
                             
                <Route path="/purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
                <Route path="/vieworders" element={<ProtectedRoute><ViewOrders /></ProtectedRoute>} />
                <Route path="/laptops/:brand" element={<ProtectedRoute><LaptopPage /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admindashboard" element={<AdminDashboard />} />
                <Route path="/adminhome" element={<AdminHome />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
