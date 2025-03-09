import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';

function CartPage() {
  const { cartItems, removeFromCart, clearCart, loading } = useCart();
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[^\d.-]/g, ''));
      return sum + price;
    }, 0);
  };

  const placeOrder = async () => {
    try {
      if (!auth.currentUser) {
        alert('Please login to place an order');
        navigate('/login');
        return;
      }

      const totalAmount = calculateTotal();

      // Create order in Firestore
      const orderRef = await addDoc(collection(db, "orders"), {
        userId: auth.currentUser.uid,
        products: cartItems.map(item => ({
          productId: item.id || '',
          productName: item.title || 'Unknown Product',
          price: item.price || '0',
          image: item.image || ''
        })),
        totalAmount: totalAmount,
        timestamp: new Date(),
        status: "confirmed"
      });

      try {
        // Update user's order count and last order date
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          totalOrders: increment(1),
          lastOrderDate: new Date()
        });
      } catch (userUpdateError) {
        console.error('Error updating user data:', userUpdateError);
        // Continue with order process even if user stats update fails
      }

      // Navigate to order confirmation page
      navigate('/order', {
        state: {
          orderId: orderRef.id,
          products: cartItems,
          totalAmount: totalAmount
        }
      });
      
      // Clear the cart after successful order
      clearCart();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-800">
        <div className="text-white text-2xl">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Your Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center text-white py-8">
            <p className="text-xl mb-4">Your cart is empty!</p>
            <button 
              onClick={() => navigate('/firstpage')}
              className="bg-blue-600 px-6 py-2 rounded text-white hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div 
                  key={item.id || index} 
                  className="bg-gray-700 p-4 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-24 h-24 object-contain"
                    />
                    <div>
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      <p className="text-green-400">{item.price}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center text-white mb-4">
                <span className="text-xl font-semibold">Total Amount:</span>
                <span className="text-2xl text-green-400">₹{calculateTotal()}</span>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={clearCart}
                  className="bg-gray-600 px-6 py-2 rounded text-white hover:bg-gray-700"
                >
                  Clear Cart
                </button>
                <button
                  onClick={placeOrder}
                  className="bg-green-600 px-6 py-2 rounded text-white hover:bg-green-700"
                >
                  Place Order
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartPage;