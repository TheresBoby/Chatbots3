import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase/firebase.js"; // Adjust path as needed
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import "./signup.css"; // Import the CSS file

const SignUp = () => {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formValues.password !== formValues.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      // 1. Create authentication user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formValues.email,
        formValues.password
      );

      // 2. Get the user object
      const user = userCredential.user;

      // 3. Create user document in Firestore
      const userData = {
        uid: user.uid,
        name: formValues.name,
        email: formValues.email,
        createdAt: new Date(),
        wallet: 0,
        totalOrders: 0,
        lastOrderDate: null,
        avatar: ''
      };

      // 4. Set the document in Firestore
      await setDoc(doc(db, 'users', user.uid), userData);

      // 5. Update auth profile
      await updateProfile(user, {
        displayName: formValues.name
      });

      // 6. Clear error and redirect
      setErrorMessage('');
      navigate('/firstpage');
      
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <div className="input-container">
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formValues.name}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <div className="input-container">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formValues.email}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-container">
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formValues.password}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-container">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formValues.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          {errorMessage && <p className="error">{errorMessage}</p>}
          <button type="submit" className="signup-btn">
            Sign Up
          </button>
        </form>
        <div className="login-text">
          Already have an account?{" "}
          <a href="/">Login here</a>
        </div>
      </div>
    </div>
  );
};

export default SignUp;