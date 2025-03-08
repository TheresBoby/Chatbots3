import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { getAuth } from "firebase/auth";
import { useCart } from "../../contexts/CartContext";
import "./Purchase.css";

function PurchasePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const { product, buyNow } = location.state || {};

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="text-xl text-white">No product selected!</div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!auth.currentUser) {
      setError("Please login to add items to cart");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addToCart(product);
      navigate("/cart");
    } catch (error) {
      setError("Failed to add item to cart");
      console.error("Cart error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!auth.currentUser) {
      setError("Please login to proceed with purchase");
      return;
    }

    navigate("/order", { 
      state: { 
        product,
        quantity: 1
      } 
    });
  };

  return (
    <div className="product-page">
      {/* Header */}
      <header className="header">
        <h1>Laptop Store</h1>
        <div className="search-cart">
          <input
            type="text"
            placeholder="Search products..."
            className="search-input"
          />
          <button onClick={() => navigate("/cart")} className="cart-button">
            <FaShoppingCart size={24} />
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Product Content */}
      <div className="content">
        {/* Image Gallery */}
        <div className="image-gallery">
          {product.images?.map((image, index) => (
            <div
              key={index}
              className={`thumbnail ${selectedImage === index ? 'selected' : ''}`}
              onClick={() => setSelectedImage(index)}
            >
              <img src={image} alt={`${product.title} - ${index + 1}`} />
            </div>
          ))}
        </div>

        {/* Main Product Image */}
        <div className="product-image">
          <img
            src={product.images?.[selectedImage] || product.image}
            alt={product.title}
            className="main-image"
          />
        </div>

        {/* Product Details */}
        <div className="product-details">
          <h2>{product.title}</h2>
          <p className="description">{product.description}</p>
          
          <div className="price-section">
            <span className="price">{product.price}</span>
            <span className="mrp">{product.discountPrice}</span>
            <span className="discount">{product.discount} OFF</span>
          </div>

          <div className="specifications">
            <h4>Key Features</h4>
            <ul>
              {product.specifications?.map((spec, index) => (
                <li key={index}>{spec}</li>
              ))}
            </ul>
          </div>

          <div className="action-buttons">
            {!buyNow && (
              <button 
                onClick={handleAddToCart}
                disabled={loading}
                className="add-to-cart-btn"
              >
                {loading ? 'Adding...' : 'Add to Cart'}
              </button>
            )}
            <button 
              onClick={handleBuyNow}
              disabled={loading}
              className={`buy-now-btn ${buyNow ? 'full-width' : ''}`}
            >
              {loading ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchasePage;
