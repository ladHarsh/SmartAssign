import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import logo from "../../assets/logo.png";

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src={logo} alt="SmartAssign Logo" />
          <span>SmartAssign</span>
        </div>
        <Link to="/login" className="login-button">
          Get Started <i className="fas fa-arrow-right ms-2"></i>
        </Link>
      </header>

      {/* Main Content */}
      <main>
      <div className="landing-content">
        <div className="landing-text">
          <h1 className="landing-title">
            Transform Your Classroom with AI-Powered Assessment
          </h1>
          <p className="landing-subtitle">
            Experience the future of education with our innovative AI-based assessment system. 
            Streamline grading, provide instant feedback, and enhance learning outcomes with 
            cutting-edge technology.
          </p>


        </div>

        <div className="landing-image">
          <img
            src="https://img.freepik.com/free-vector/artificial-intelligence-ai-robot-server-room-digital-technology-banner-computer-equipment_39422-767.jpg"
            alt="SmartAssign Platform"
            loading="lazy"
          />
        </div>
        
      </div>
      <div className="container pb-5">
      <div className="landing-features">
            <div className="feature-card">
              <div className="row align-items-center">
              <div className="feature-icon col-4">
                <i className="fas fa-robot"></i>
              </div>
              <h3 className="feature-title col-8">Intelligent Grading</h3>
              </div>
              <p className="feature-description">
                Advanced AI algorithms provide consistent, accurate, and unbiased assessment 
                of student work, saving you valuable time.
              </p>
            </div>

            <div className="feature-card">
            <div className="row align-items-center">
              <div className="feature-icon col-4">
                <i className="fas fa-comments"></i>
              </div>
              <h3 className="feature-title col-8">Personalized Feedback</h3>
              </div>
              <p className="feature-description">
                Detailed, constructive feedback tailored to each student's work, helping them 
                understand and improve their performance.
              </p>
            </div>

            <div className="feature-card">
            <div className="row align-items-center">
              <div className="feature-icon col-4">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="feature-title col-8">Advanced Analytics</h3>
              </div>
              <p className="feature-description">
                Comprehensive insights into student performance, learning patterns, and 
                progress tracking to inform teaching strategies.
              </p>
            </div>
          </div>
          </div>
          </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <img src={logo} alt="SmartAssign Logo" />
              <span>SmartAssign</span>
            </div>
            <p className="footer-description">
              Empowering educators with AI-driven assessment tools to create more effective 
              and engaging learning experiences.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="text-white font-semibold mb-2">Quick Links</h4>
            <div className="footer-links">
              <Link to="/">
                <i className="fas fa-home"></i>
                Home
              </Link>
              <Link to="/about">
                <i className="fas fa-info-circle"></i>
                About Us
              </Link>
              <Link to="/login">
                <i className="fas fa-sign-in-alt"></i>
                Login
              </Link>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="text-white font-semibold mb-2">Contact Us</h4>
            <div className="footer-links">
              <a href="mailto:contact@smartassign.com">
                <i className="fas fa-envelope"></i>
                contact@smartassign.com
              </a>
              <a href="tel:+1234567890">
                <i className="fas fa-phone"></i>
                +1 (234) 567-890
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="text-white font-semibold mb-2">Connect With Us</h4>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} SmartAssign. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
