import React from "react";
import "../../App.css"; // Link your CSS file here
import { FaShoppingCart } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate and useLocation
import { useCart } from "../../contexts/CartContext"; // Import useCart from CartContext
import ChatbotSection from './ChatbotSection'; // Import the ChatbotSection component
import './Order.css'; // Import the CSS file
import './PurchaseContent.css';

const PurchaseContent = ({ product, onBack }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  if (!product) {
    return <div className="no-product">No product selected!</div>;
  }

  const handleAddToCart = async () => {
    try {
      await addToCart(product);
      navigate("/cart");
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const handleBuyNow = () => {
    navigate("/order", { state: { product } });
  };

  return (
    <div className="purchase-content">
      {/* Back Button */}
      <button onClick={onBack} className="back-button">
        ← Back to Products
      </button>

      {/* Product Details */}
      <div className="product-details">
        <div className="product-image-container">
          <img 
            src={product.image} 
            alt={product.title} 
            className="product-image"
          />
        </div>

        <div className="product-info">
          <h2 className="product-title">{product.title}</h2>
          <div className="price-container">
            <span className="current-price">{product.price}</span>
            <span className="original-price">{product.discountPrice}</span>
            <span className="discount-tag">{product.discount}</span>
          </div>
          
          <p className="description">{product.description}</p>

          <div className="features">
            <p>✓ Free Delivery</p>
            <p>✓ EMI Available</p>
            <p>✓ 1 Year Warranty</p>
          </div>

          <div className="action-buttons">
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
            <button 
              className="buy-now-btn"
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function PurchasePage() {
  const navigate = useNavigate();
  const location = useLocation(); // Get the location object which contains the state passed from another page

  const product = location.state?.product; // Retrieve the product from location state

  if (!product) {
    return <div>No product selected!</div>; // In case no product is passed
  }

  // Function to navigate back to the previous page
  const handleBackClick = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div className="split-container">
      {/* Chatbot Section - Left 50% */}
      <ChatbotSection />

      {/* Purchase Section - Right 50% */}
      <div className="purchase-section">
        <div className="product-page" style={{ width: "100%", height: "100%", backgroundColor: "#808080" }}>
          {/* Search Bar Container */}
          <div className="search-bar-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: '15px', borderRadius: '8px', maxWidth: '100%', margin: '0 auto' }}>
            <div className="search-bar-wrapper" style={{ maxWidth: '600px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Menu Icon */}
              <div className="menu-icon" style={{ marginRight: '10px' }}>
                <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>
                  ☰
                </button>
              </div>

              {/* Search Bar */}
              <div className="search-bar" style={{ display: 'flex', flexGrow: 1, backgroundColor: '#333', borderRadius: '5px', padding: '5px' }}>
                <input type="text" placeholder="What are you looking for?" style={{ flexGrow: 1, padding: '10px', borderRadius: '4px 0 0 4px', border: 'none', outline: 'none' }} />
                <button className="search-button" style={{ backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '0 4px 4px 0', padding: '10px 20px', cursor: 'pointer' }}>
                  🔍
                </button>
              </div>
            </div>
          </div>

          {/* Header with Cart Icon */}
          <header className="header" style={{ position: "relative", padding: "20px", backgroundColor: "#fff" }}>
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-black font-bold">Laptop Store</h1>

              {/* Cart Icon in the top-right corner */}
              <div className="cart-icon" style={{ position: "absolute", top: "20px", right: "20px", cursor: "pointer" }} onClick={() => navigate("/cart")}>
                <FaShoppingCart size={30} color="#000" />
              </div>
            </div>
          </header>

          {/* Product Display */}
          <PurchaseContent product={product} onBack={handleBackClick} />
        </div>
      </div>
    </div>
  );
}

export default PurchasePage;