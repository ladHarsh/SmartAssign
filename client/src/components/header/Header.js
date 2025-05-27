import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';
import logo from '../../assets/logo.png';  // Update import

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    // Add this function to check if we're on auth pages
    const isAuthPage = () => {
        return location.pathname === '/login' || location.pathname === '/signup';
    };

    // Function to get dashboard title based on current path
    const getDashboardTitle = () => {
        if (location.pathname.includes('faculty')) {
            return 'Faculty Dashboard';
        } else if (location.pathname.includes('student')) {
            return 'Student Dashboard';
        } else if (location.pathname.includes('admin')) {
            return 'Admin Dashboard';
        }
        return '';
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="logo">
                    <img src={logo} alt="Logo" />
                    <span>SmartAssign</span>
                </div>
                <div className="dashboard-title">
                    <h4>{getDashboardTitle()}</h4>
                </div>
                {!isAuthPage() && (
                    <button onClick={handleLogout} className="logout-button">
                        <span>Logout</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;