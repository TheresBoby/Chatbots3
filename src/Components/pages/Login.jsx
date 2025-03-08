import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase/firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css"; // Import the CSS file

const Login = () => {
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formValues.email === "" || formValues.password === "") {
      setErrorMessage("All fields are required!");
      return;
    }
    
    if(formValues.email === "admin@gmail.com" && formValues.password === "admin123"){
      navigate("/admindashboard");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formValues.email, 
        formValues.password
      );
      const user = userCredential.user;
      console.log("User logged in:", user);
      setErrorMessage("");
      navigate("/firstpage");
    } catch (error) {
      console.error("Login error:", error.message);
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formValues.email}
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formValues.password}
              onChange={handleChange}
            />
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
        <div className="extra-options">
          <p>
            Don't have an account?{" "}
            <a href="/signup">Sign Up here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;