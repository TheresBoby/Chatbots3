import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import './chatbot.css';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createOrder, scheduleOrder } from "./createOrder";

const ChatbotSection = ({ onBrandSelect }) => {  // Add this prop
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState('');
  const [resInfo, setResInfo] = useState('');
  const [lapId, setLapId] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [context, setContext] = useState('product_inquiry');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const [uid, setUid] = useState('');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log(currentUser);
      if (currentUser) {
        setUser(currentUser);
        setUid(currentUser.uid);
        console.log(uid);
      } else {
        setError("User not logged in!");
      }
    });
    

  return () => unsubscribe();

}, []); // Run only once when component mounts



useEffect(() => {
    const handleButtonClick = async (event) => {
      console.log({user});
      console.log(uid);
      if (event.target.tagName === 'BUTTON' && event.target.dataset.message) {
        const buttonMessage = event.target.dataset.message;
        setMessage(buttonMessage);
        setInfo(event.target.dataset.type);
        console.log(user['uid']);
        if (event.target.dataset.type === "buy") {
          const productId = buttonMessage; // Assuming button has data-product-id

          if (!productId) {
            console.error("Product ID is missing");
            return;
          }

          try {
            const orderId = await createOrder(user.uid, [productId]);
            console.log("Order created:", orderId);
          } catch (error) {
            console.error("Failed to create order:", error);
          }
        }
        console.log({info});
        if (info === "schedule_amount") {
          const productId = buttonMessage; // Assuming button has data-product-id
          console.log(buttonMessage);
          if (!productId) {
            console.error("Product ID is missing");
            return;
          }

          try {
            console.log(message);
            const orderId = await scheduleOrder(user.uid, productId, message);
            console.log("Order created:", orderId);
          } catch (error) {
            console.error("Failed to create order:", error);
          }
        }
        document.getElementById('submit-button').click();
      }
    };
    document.addEventListener('click', handleButtonClick);

    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleButtonClick);
    };
  }, []);

  const handleUIAction = (action) => {
    if (action.type === 'triggerBrandView' && onBrandSelect) {
      onBrandSelect(action.brand);
    }
  };

  const ViewMessage = ({ message }) => {
    if (message.sender === "bot") {
      try {
        const parsedMessage = JSON.parse(message.text);
        return (
          <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`message ${message.sender === "user" ? "user-message" : "bot-message"}`}>
              <ul>
                {Object.entries(parsedMessage).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {typeof value === "object" ? JSON.stringify(value) : value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      } catch (error) {
        return (
          <>
            {message.text.split("~").map((txt, idx) => (
              <div key={idx} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`message ${message.sender === "user" ? "user-message" : "bot-message"}`}>
                  <p dangerouslySetInnerHTML={{ __html: txt }} />
                  {message.context && (
                    <span className="context-label">Context: {message.context}</span>
                  )}
                </div>
              </div>
            ))}
          </>
        );
      }
    }
    return null;
  };

  const ChatMessage = ({ message }) => (
    <>
      {message.text.split('~').map((txt, idx) => (
        <div key={idx} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}>
            <p dangerouslySetInnerHTML={{ __html: txt }} />
            {message.context && (
              <span className="context-label">Context: {message.context}</span>
            )}
          </div>
        </div>
      ))}
    </>
  );

  const sendMessageToBackend = async (userMessage, context) => {
    try {
      if(info == 'schedule') {
        setLapId(userMessage);
      }
      if(info == '') {
        setLapId(userMessage);
      }
      if(info == 'schedule_amount') {
          const productId = lapId; // Assuming button has data-product-id
          console.log(lapId);
          if (!productId) {
            console.error("Product ID is missing");
            return;
          }

          try {
            console.log(message);
            const orderId = await scheduleOrder(uid, productId, userMessage);
            console.log("Order created:", orderId);
          } catch (error) {
            console.error("Failed to create order:", error);
          }
      }
      console.log('---------------------');
      console.log(lapId);
      console.log('---------------------');
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:8000/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          context: context,
          info: info,
          user_id: user.uid,
          lap_id: lapId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setResInfo(data.info ? data.info : '');
      setInfo(data.info == 'schedule' ? 'schedule_amount' : '');

      // Handle UI actions
      if (data.ui_actions && data.ui_actions.length > 0) {
        data.ui_actions.forEach(action => handleUIAction(action));
      }

      return data.response;
    } catch (error) {
      console.error('Chatbot error:', error);
      return 'Sorry, I couldn\'t process your message right now. Please try again later.';
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (message.trim() && !isLoading) {
      const userMessage = { sender: 'user', text: message.trim() };
      setChatHistory((prev) => [...prev, userMessage]);
      setMessage('');

      const botReply = await sendMessageToBackend(message, context);
      const botMessage = { sender: 'bot', text: botReply };
      setChatHistory((prev) => [...prev, botMessage]);
      
      inputRef.current?.focus();
    }
  };

  return (
    <div className="chatbot-section">
      {showWelcome && (
        <div className="welcome-message">
          <h2>Welcome! 👋</h2>
          <p>I'm your AI shopping assistant. How can I help you today?</p>
        </div>
      )}

      <div className="chat-messages">
        {resInfo === "view" ? (
          chatHistory.map((message, index) => (
            <ViewMessage key={index} message={message} />
          ))
        ) : (
          chatHistory.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))
        )}
        {isLoading && (
          <div className="loading-indicator">
            <Loader className="animate-spin" size={16} />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSendMessage} className="chat-form">
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="context-select"
          >
            <option value="product_inquiry">Product Inquiry</option>
            <option value="technical">Technical Support</option>
            <option value="billing">Billing</option>
          </select>
          
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
            disabled={isLoading}
          />
          
          <button
            type="submit"
            id="submit-button"
            className="send-button"
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotSection;
