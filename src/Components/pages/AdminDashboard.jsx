import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
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
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = productData.image;

      if (imageFile) {
        const storageRef = ref(storage, `laptops/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const productWithImage = {
        ...productData,
        image: imageUrl
      };

      if (editingProduct) {
        await updateDoc(doc(db, "laptops", editingProduct.id), productWithImage);
      } else {
        await addDoc(collection(db, "laptops"), productWithImage);
      }

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
      fetchProducts();
    } catch (error) {
      console.error("Error submitting product:", error);
      alert("Error saving product");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductData(product);
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
                  <h3>{product.title}</h3>
                  <p>Price: {product.price}</p>
                  <div className="product-actions">
                    <button onClick={() => handleEdit(product)}>Edit</button>
                    <button onClick={() => handleDelete(product.id)}>Delete</button>
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
