import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    discount: '',
    rating: '',
    image: '',
    brand: 'HP' // Default brand
  });
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [users, setUsers] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "laptops"));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      
      // Fetch user details for each order
      ordersData.forEach(order => {
        if (order.userId && !users[order.userId]) {
          fetchUserDetails(order.userId);
        }
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Add this function to fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUsers(prev => ({
          ...prev,
          [userId]: userDoc.data().name
        }));
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  // Add input validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validation for price fields
    if (name === 'price' || name === 'discountPrice') {
      // Only allow numbers and decimal points
      const cleanValue = value.replace(/[^\d.]/g, '');
      setProductData(prev => ({
        ...prev,
        [name]: cleanValue
      }));
      return;
    }
  
    // Validation for rating
    if (name === 'rating') {
      const numValue = parseFloat(value);
      if (numValue >= 0 && numValue <= 5) {
        setProductData(prev => ({
          ...prev,
          [name]: value
        }));
      }
      return;
    }
  
    // Default handling for other fields
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // Update the generateDocId function
  const generateDocId = (title, brand) => {
    const brandPrefix = brand.toUpperCase();
    const formattedTitle = title
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .toLowerCase();                 // Convert title to lowercase
    return `${brandPrefix}_${formattedTitle}`;
  };

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      // First, validate required fields
      if (!productData.title || !productData.price || !productData.description) {
        alert('Please fill in all required fields');
        return;
      }
  
      let imageUrl = productData.image;
      if (imageFile) {
        const storageRef = ref(storage, `laptops/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
  
      const formattedPrice = productData.price.startsWith('₹') 
        ? productData.price 
        : `₹${productData.price}`;
      const formattedDiscountPrice = productData.discountPrice 
        ? (productData.discountPrice.startsWith('₹') 
          ? productData.discountPrice 
          : `₹${productData.discountPrice}`)
        : '';
  
      const productWithImage = {
        ...productData,
        price: formattedPrice,
        discountPrice: formattedDiscountPrice,
        image: imageUrl,
        updatedAt: new Date()
      };
  
      if (editingProduct) {
        const updateDocId = `${productData.brand}_${productData.title
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase()}`;
        console.log("Updating document with ID:", updateDocId); // Debug log
        
        await updateDoc(doc(db, "laptops", updateDocId), productWithImage);
        console.log("Product updated successfully");
      } else {
        // Create new product with generated ID
        const docId = generateDocId(productData.title, productData.brand);
        console.log("Creating new document with ID:", docId); // Debug log
        
        await setDoc(doc(db, "laptops", docId), {
          ...productWithImage,
          createdAt: new Date()
        });
        console.log("Product added successfully");
      }
  
      // Reset form
      setProductData({
        title: '',
        description: '',
        price: '',
        discountPrice: '',
        discount: '',
        rating: '',
        image: '',
        brand: 'HP'
      });
      setImageFile(null);
      setEditingProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error("Error submitting product:", error);
      alert("Error saving product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update handleEdit function to extract and store the correct document ID
  const handleEdit = (product) => {
    console.log("Original product ID:", product.id);
    
    const docId = `${product.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()}`;
      
    setEditingProduct({
      ...product,
      id: docId // Store the formatted document ID
    });
  
    // Remove the ₹ symbol from prices when editing
    const cleanPrice = product.price ? product.price.replace('₹', '') : '';
    const cleanDiscountPrice = product.discountPrice ? product.discountPrice.replace('₹', '') : '';
  
    setProductData({
      title: product.title || '',
      description: product.description || '',
      price: cleanPrice,
      discountPrice: cleanDiscountPrice,
      discount: product.discount || '',
      rating: product.rating || '',
      image: product.image || '',
      brand: product.brand || 'HP'
    });
  
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log("Generated document ID for update:", docId);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, "laptops", productId));
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error deleting product");
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <button 
          className={`nav-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button 
          className={`nav-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
      </nav>

      {activeTab === 'products' ? (
        <div className="products-section">
          <form onSubmit={handleSubmit} className="product-form">
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Brand</label>
                <select name="brand" value={productData.brand} onChange={handleInputChange}>
                  <option value="HP">HP</option>
                  <option value="DELL">Dell</option>
                  <option value="ASUS">Asus</option>
                  <option value="APPLE">Apple</option>
                  <option value="SAMSUNG">Samsung</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  name="title"
                  value={productData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Price (₹)</label>
                <input
                  name="price"
                  value={productData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Discount Price (₹)</label>
                <input
                  name="discountPrice"
                  value={productData.discountPrice}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Discount</label>
                <input
                  name="discount"
                  value={productData.discount}
                  onChange={handleInputChange}
                  placeholder="e.g., 20% OFF"
                />
              </div>

              <div className="form-group">
                <label>Rating</label>
                <input
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={productData.rating}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={productData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Image</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                />
              </div>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </form>

          <div className="products-list">
            <h2>Current Products</h2>
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <img src={product.image} alt={product.title} />
                  <div className="product-info">
                    <h3>{product.title}</h3>
                    <p className="brand">Brand: {product.brand}</p>
                    <p className="price">Price: {product.price}</p>
                    {product.discountPrice && (
                      <p className="discount-price">Discount Price: {product.discountPrice}</p>
                    )}
                    {product.discount && (
                      <p className="discount">Discount: {product.discount}</p>
                    )}
                    <div className="product-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="orders-section">
          <h2>Orders</h2>
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <h3>Order ID: {order.id}</h3>
                  <span className="order-status">{order.status}</span>
                </div>
                
                <p>User ID: {order.userId}</p>
                <p>Product: {order.productName}</p>
                <p>Price: {order.price}</p>
                <p>Order Date: {order.timestamp?.toDate().toLocaleString()}</p>
                <p>Payment Status: {order.payment_status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
