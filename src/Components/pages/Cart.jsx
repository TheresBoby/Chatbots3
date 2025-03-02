import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

function CartPage() {
  const { cartItems, removeFromCart, clearCart, loading } = useCart();
  const navigate = useNavigate();

  const placeOrder = () => {
    try {
      // Add your order placement logic here
      clearCart();
      alert('Your order has been placed successfully!');
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
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
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
            
            <div className="mt-8 flex justify-end space-x-4">
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
          </>
        )}
      </div>
    </div>
  );
}

export default CartPage;
