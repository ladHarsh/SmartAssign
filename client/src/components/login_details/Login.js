import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './login.css';
import Header from '../header/Header';
import { getApiUrl } from '../../config/api.config';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, userRole } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        // If already authenticated, redirect based on role
        if (isAuthenticated && userRole) {
            switch (userRole) {
                case 'Admin':
                    navigate('/admin-dashboard');
                    break;
                case 'Faculty':
                    navigate('/faculty-dashboard');
                    break;
                case 'Student':
                    navigate('/student-dashboard');
                    break;
                default:
                    break;
            }
        }
    }, [isAuthenticated, userRole, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(getApiUrl('/auth/login'), formData);

            if (response.data.success) {
                login(
                    response.data.token,
                    response.data.user.role,
                    response.data.user.name
                );
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <>
            <Header />
            <div className="auth-container">
                <div className="auth-form-container">
                    <div className="form-wrapper">
                        <h2>Welcome Back</h2>
                        <p className="subtitle">Sign in to continue to your dashboard</p>
                        
                        {error && (
                            <div className="error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
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
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="auth-button">
                                <i className="fas fa-sign-in-alt me-2"></i>
                                Sign In
                            </button>
                        </form>
                        <p className="mt-4 text-center">
                            Don't have an account?{" "}
                            <Link to="/signup" className="auth-link">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;