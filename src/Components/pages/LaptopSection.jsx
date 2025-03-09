import React from 'react';
import './LaptopSection.css';

const LaptopSection = ({ onLaptopClick, searchQuery }) => {
  const laptops = [
    { name: 'HP', imgSrc: '/images/hpimage.jpg', description: 'High-performance laptops for work and play' },
    { name: 'DELL', imgSrc: '/images/dellimage.avif', description: 'Reliable business and gaming machines' },
    { name: 'ASUS', imgSrc: '/images/asus.jpg', description: 'Innovative design with cutting-edge technology' },
    { name: 'SAMSUNG', imgSrc: '/images/samsung.jpg', description: 'Sleek, powerful laptops with vibrant displays' },
    { name: 'APPLE', imgSrc: '/images/apple.webp', description: 'Premium build quality with seamless ecosystem' },
  ];

  // Filter laptops based on the search query
  const filteredLaptops = laptops.filter((laptop) =>
    laptop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClick = (e, laptopName) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onLaptopClick) {
      onLaptopClick(laptopName);
    }
  };

  return (
    <div className="laptop-section-wrapper">
      <h2 className="section-title">Available Laptop Brands</h2>
      <p className="section-description">Browse our selection of premium laptops from top manufacturers</p>

      <div className="laptop-grid">
        {filteredLaptops.length > 0 ? (
          filteredLaptops.map((laptop) => (
            <div 
              key={laptop.name}
              className="laptop-card"
              onClick={(e) => handleClick(e, laptop.name)}
            >
              <div className="laptop-image-container">
                <img 
                  src={laptop.imgSrc} 
                  alt={laptop.name}
                  className="laptop-image"
                />
              </div>
              <div className="laptop-info">
                <h3 className="laptop-name">{laptop.name}</h3>
                <p className="laptop-description">{laptop.description}</p>
                <button className="view-button" onClick={(e) => handleClick(e, laptop.name)}>View Models</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No matching laptops found.</p>
        )}
      </div>
    </div>
  );
};

export default LaptopSection;
