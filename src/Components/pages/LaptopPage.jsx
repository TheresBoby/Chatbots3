import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useCart } from '../../contexts/CartContext';
import './LaptopSection.css';

const LaptopPage = ({ brand, onBuyNow }) => { // Add onBuyNow prop
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);

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
    if (onBuyNow) {
      onBuyNow(product);
    }
  };

  if (loading) {
    return <div className="text-white text-center">Loading laptops...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  return (
    <div className="laptop-page">
      {products.map((product) => (
        <div key={product.id} className="product-card">
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
                className="add-cart-button"
                onClick={() => handleAddToCart(product)}
                disabled={addingToCart === product.id}
              >
                {addingToCart === product.id ? '...' : 'Add to Cart'}
              </button>
              <button 
                onClick={() => handleBuyNow(product)}
                className="buy-now-button"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LaptopPage;