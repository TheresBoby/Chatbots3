import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './LaptopSection.css';

const LaptopPage = ({ brand }) => {
const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleBuyNow = (product) => {
    try {
      // Navigate to purchase page with product details
      navigate('/purchase', { 
        state: { product } 
      });
    } catch (error) {
      console.error("Error in buy now:", error);
      alert('Failed to process purchase. Please try again.');
    }
  };

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
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="laptop-card">
              <div className="laptop-image-container">
                <img src={product.image} alt={product.title} className="laptop-image" />
              </div>
              <div className="laptop-info">
                <h3 className="laptop-name">{product.title}</h3>
                <p className="laptop-description">{product.description}</p>
                <p className="laptop-price text-green-400 font-bold">{product.price}</p>
                <p className="text-white line-through">{product.discountPrice}</p>
                <p className="text-yellow-300">{product.rating}</p>
                <button className="view-button" onClick={() => handleBuyNow(product)}>Buy Now</button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-white">No laptops available for this brand.</p>
        )}
      </div>
    </div>
  );
};

export default LaptopPage;