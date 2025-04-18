import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { getAuth } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import './notification.css';

const Notification = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newAmount, setNewAmount] = useState('');
  const auth = getAuth();

  useEffect(() => {
    if (!auth.currentUser) return;

    const ordersRef = collection(db, 'orders');
    const userOrdersQuery = query(
      ordersRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(userOrdersQuery, (snapshot) => {
      const orderData = [];
      snapshot.forEach((doc) => {
        orderData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setOrders(orderData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      default: return 'status-pending';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toDate()).toLocaleString();
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to cancel order');
      }
    }
  };

  const handleEditAmount = async (orderId) => {
    if (!newAmount) return;
    
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        amount: newAmount,
        status: 'scheduled' // Reset status when amount is changed
      });
      setEditingOrder(null);
      setNewAmount('');
    } catch (error) {
      console.error('Error updating amount:', error);
      alert('Failed to update amount');
    }
  };

  const renderStatusWithAmount = (order) => {
    if (order.status === 'scheduled') {
      const orderPrice = parseFloat(order.price.replace(/[^\d.]/g, ''));
      const maxAmount = parseFloat(order.amount);
      const status = maxAmount >= orderPrice ? 'confirmed' : 'scheduled';

      return (
        <div className="order-status-container">
          <div className={`order-status ${getStatusColor(status)}`}>
            {status}
          </div>
          <div className="scheduled-info">
            <div className="scheduled-amount">
              Scheduled purchase for: ₹{maxAmount.toLocaleString()}
              {status === 'scheduled' && (
                <button 
                  className="edit-button"
                  onClick={() => setEditingOrder(order.id)}
                >
                  ✏️
                </button>
              )}
            </div>
            {editingOrder === order.id && (
              <div className="edit-amount-form">
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Enter new amount"
                  className="amount-input"
                />
                <button 
                  onClick={() => handleEditAmount(order.id)}
                  className="save-button"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setEditingOrder(null);
                    setNewAmount('');
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            )}
            {status === 'confirmed' && (
              <div className="confirmation-message">
                Price (₹{orderPrice.toLocaleString()}) is within your budget!
              </div>
            )}
          </div>
          <button 
            className="delete-button"
            onClick={() => handleDelete(order.id)}
          >
            Cancel Order
          </button>
        </div>
      );
    }
    return (
      <div className={`order-status ${getStatusColor(order.status)}`}>
        {order.status}
      </div>
    );
  };

  if (loading) {
    return <div className="notification-loading">Loading orders...</div>;
  }

  return (
    <div className="notification-container">
      <h2 className="notification-title">Your Orders</h2>
      {orders.length === 0 ? (
        <p className="no-orders">No orders found</p>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-image">
                <img src={order.image} alt={order.productName} />
              </div>
              <div className="order-details">
                <h3>{order.productName}</h3>
                <p className="order-price">{order.price}</p>
                <p className="order-date">Ordered on: {formatDate(order.timestamp)}</p>
                {renderStatusWithAmount(order)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notification;