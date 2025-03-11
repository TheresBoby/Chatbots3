import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import ChatbotSection from './ChatbotSection';
import LaptopSection from './LaptopSection';
import LaptopPage from './LaptopPage';
import UserManagement from './UserManagement';
import './chatbot.css';
import IconButton from '@mui/material/IconButton';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AlarmIcon from '@mui/icons-material/Alarm';

const FirstPage = () => {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Search state

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
  const handleNotification = () => {
    setShowUserManagement(false);
    setSelectedBrand(null);
    navigate('/notifications');
  };

  const handleCart = () => {
    setShowUserManagement(false);
    setSelectedBrand(null);
    navigate('/cart'); // Navigate to the cart page
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setShowUserManagement(false);
  };

  // Update search query when user types
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Determine which component to show on the right side
  const renderRightComponent = () => {
    if (showUserManagement) {
      return <UserManagement onLogout={handleLogout} />;
    } else if (selectedBrand) {
      return <LaptopPage brand={selectedBrand} searchQuery={searchQuery} />; // Pass search query
    } else {
      return <LaptopSection onLaptopClick={handleLaptopClick} searchQuery={searchQuery} />; // Pass search query
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="header-title">Smart Support</h1>
          <div className="search-container">
            <input
              type="text"
              placeholder="What are you looking for?"
              className="search-input"
              value={searchQuery} // Bind searchQuery state
              onChange={handleSearchChange} // Handle input changes
            />
            <Search className="search-icon" size={16} />
          </div>
          <div className="header-actions">
          <IconButton onClick={handleNotification} color="secondary" aria-label="add an alarm">
        <AlarmIcon />
      </IconButton>
            <IconButton onClick={handleCart} color="primary" aria-label="add to shopping cart">
        <AddShoppingCartIcon />
      </IconButton>
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