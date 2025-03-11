import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useCart } from '../../contexts/CartContext';
import './LaptopSection.css';

const LaptopPage = ({ brand, searchQuery }) => { // Accept searchQuery as prop
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const laptopsRef = collection(db, "laptops");
        const brandPrefix = brand.toUpperCase() + "_";
        const q = query(laptopsRef, where('__name__', '>=', brandPrefix), 
                                  where('__name__', '<', brandPrefix + '\uf8ff'));
        
        const querySnapshot = await getDocs(q);
        const laptopData = [];
        
        querySnapshot.forEach((doc) => {
          laptopData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        setProducts(laptopData);
      } catch (err) {
        console.error("Error fetching laptops:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (brand) {
      fetchProducts();
    }
  }, [brand]);

  const handleAddToCart = async (product) => {
    try {
      setAddingToCart(product.id);
      await addToCart(product);
      alert('Added to cart successfully!');
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(error.message);
    } finally {
      setAddingToCart(null);
    }
  };

  const handleBuyNow = (product) => {
    setSelectedProduct(product);
  };

  if (selectedProduct) {
    return (
      <div className="laptop-section-wrapper">
        <button 
          className="back-button"
          onClick={() => setSelectedProduct(null)}
        >
          ← Back to Laptops
        </button>
        <div className="product-container">
          <div className="product-image-container">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.title}
              className="product-image"
            />
          </div>
          <div className="product-details">
            <h2 className="product-title">{selectedProduct.title}</h2>
            <div className="price-section">
              <p className="current-price">{selectedProduct.price}</p>
              <p className="original-price">{selectedProduct.discountPrice}</p>
              <span className="discount-tag">{selectedProduct.discount}</span>
            </div>
            <div className="description-section">
              <p className="product-description">
                {selectedProduct.description || "No description available"}
              </p>
            </div>
            <p className="emi-text">EMI Options available</p>
            <div className="action-buttons">
              <button
                className="view-button"
                onClick={() => {
                  navigate('/order', { 
                    state: { 
                      product: selectedProduct 
                    } 
                  });
                }}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-white text-center">Loading laptops...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="laptop-section-wrapper">
      <h2 className="section-title">{brand} Laptops</h2>
      <div className="laptop-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="laptop-card">
              <div className="laptop-image-container">
                <img src={product.image} alt={product.title} className="laptop-image" />
              </div>
              <div className="laptop-info">
                <h3 className="laptop-name">{product.title}</h3>
                <div className="price-info">
                  <p className="laptop-price">{product.price}</p>
                  <p className="laptop-original-price">{product.discountPrice}</p>
                  <span className="discount-tag">{product.discount}</span>
                </div>
                <p className="laptop-description">{product.description}</p>
                <div className="button-group">
                  <button 
                    className="view-button"
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart === product.id}
                  >
                    {addingToCart === product.id ? '...' : 'Add to Cart'}
                  </button>
                  <button 
                    className="view-button"
                    onClick={() => handleBuyNow(product)}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-products">No matching laptops found.</p>
        )}
      </div>
    </div>
  );
};

export default LaptopPage;
