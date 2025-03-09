import React, { useState } from 'react';
import ChatbotSection from './ChatbotSection';
import LaptopSection from './LaptopSection';
import Order from './order';

const MainPage = () => {
  const [activeSection, setActiveSection] = useState('laptop'); // Toggle between laptop and order

  return (
    <div className="main-container">
      {/* Chatbot always on the left */}
      <div className="chatbot-container">
        <ChatbotSection />
      </div>

      {/* Right section switches between LaptopSection and OrderSection */}
      <div className="right-section">
        {activeSection === 'laptop' ? <LaptopSection /> : <Order />}
      </div>
    </div>
  );
};

export default page;
