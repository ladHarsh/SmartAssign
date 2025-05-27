// components/auth/SignUp.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import Header from "../header/Header";
import { getApiUrl } from "../../config/api.config";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [availableRoles, setAvailableRoles] = useState(["Faculty", "Student"]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Add this useEffect to check admin count when component mounts
  useEffect(() => {
    checkAdminLimit();
  }, []);

  const checkAdminLimit = async () => {
    try {
      const response = await axios.get(getApiUrl("/auth/check-admin-limit"));
      if (response.data.adminLimitReached) {
        setAvailableRoles(["Faculty", "Student"]);
      }
    } catch (error) {
      console.error("Error checking admin limit:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(getApiUrl("/auth/signup"), formData);

      if (response.data.success) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      setError(errorMessage);

      // If it's the admin limit error, update available roles
      if (errorMessage.includes("Maximum number of admins")) {
        setAvailableRoles(["Faculty", "Student"]);
      }
    }
  };

  return (
    <>
      <Header />
      <div className="auth-container">
        <div className="auth-form-container">
          <div className="form-wrapper">
            <h2>Create Account</h2>
            <p className="subtitle">Join us to get started with your journey</p>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-field">
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-field">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-field">
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-field">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your role</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="auth-button">
                <i className="fas fa-user-plus me-2"></i>
                Create Account
              </button>
            </form>
            <p className="mt-4 text-center">
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;
