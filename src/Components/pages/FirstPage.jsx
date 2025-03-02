import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import ChatbotSection from './ChatbotSection';
import LaptopSection from './LaptopSection';
import LaptopPage from './LaptopPage';
import UserManagement from './UserManagement';
import './chatbot.css';

const FirstPage = () => {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showUserManagement, setShowUserManagement] = useState(false);

  const handleLaptopClick = (brand) => {
    setSelectedBrand(brand);
    setShowUserManagement(false);
  };

  const handleLogout = () => {
    setShowUserManagement(false);
  };

  const handleUserClick = () => {
    setShowUserManagement(true);
    setSelectedBrand(null);
  };

  const handleCart = () => {
    // Instead of navigating, we'll handle this in our component
    setShowUserManagement(false);
    setSelectedBrand(null);
    // You could set a state variable like showCart to true here
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setShowUserManagement(false);
  };

  // Determine which component to show on the right side
  const renderRightComponent = () => {
    if (showUserManagement) {
      return <UserManagement onLogout={handleLogout} />;
    } else if (selectedBrand) {
      return <LaptopPage brand={selectedBrand} />;
    } else {
      return <LaptopSection onLaptopClick={handleLaptopClick} />;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="header-title">Smart Support</h1>
          <div className="search-container">
            <input type="text" placeholder="What are you looking for?" className="search-input" />
            <Search className="search-icon" size={16} />
          </div>
          <div className="header-actions">
            <button onClick={handleCart} className="icon-button">
              <ShoppingCart size={20} />
            </button>
            <button onClick={handleUserClick} className="icon-button">
              <User size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Split Container */}
      <div className="split-container">
        {/* Chatbot Section - Left 50% */}
        <ChatbotSection onBrandSelect={handleBrandSelect} />

        {/* Right 50% - Dynamic Component */}
        <div className="laptop-section-container">
          {renderRightComponent()}
        </div>
      </div>
    </div>
  );
};

export default FirstPage;