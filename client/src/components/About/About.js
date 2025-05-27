import React from "react";
import { Link } from "react-router-dom";
import "./About.css";
import logo from "../../assets/logo.png";
import harsh from "../../assets/Harsh.jpg"

const About = () => {
  return (
    <div className="about-container">
      <header className="about-header">
        <div className="about-logo">
          <img src={logo} alt="Logo" />
          <span>SmartAssign</span>
        </div>
        <div className="header-links">
          <Link to="/" className="nav-link">
            <i className="fas fa-home"></i>
            Home
          </Link>
          <Link to="/login" className="login-button">
            Login <i className="fas fa-arrow-right ms-2"></i>
          </Link>
        </div>
      </header>

      <main className="about-content">
        <h1 className="about-title">About Us</h1>
        <div className="about-sections">
          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              To revolutionize educational assessment through cutting-edge AI
              technology, making evaluation more efficient, consistent, and
              insightful for both educators and students.
            </p>
          </section>

          <section className="team-section">
            <h2>Our Leadership</h2>
            <div className="">
              <div className="team-member">
                <div className="member-image">
                  <img src={harsh} alt="Harsh Lad" />
                </div>
                <div className="member-info">
                  <h3>Harsh Lad</h3>
                  <p>Full Stack Developer</p>
                </div>
                <p className="member-bio">
                  I am a dedicated student at Drs. Kiran & Pallavi Patel Global
                  University with a strong passion for Artificial Intelligence
                  and software development. My project, SmartAssign, is designed
                  to transform the way assignments are managed and evaluated in
                  educational institutions. It allows teachers to seamlessly
                  upload assignments and students to submit their work online.
                  What makes SmartAssign unique is its intelligent plagiarism
                  detection model that compares submissions against previous
                  ones to identify copied content and provide a similarity
                  percentage. Additionally, it features smart assignment
                  allocation tailored to each student's performance, ensuring
                  personalized learning experiences. An integrated AI assistant
                  further supports students by offering real-time guidance and
                  assistance throughout their learning journey. With
                  SmartAssign, I aim to combine my passion for AI and
                  development to create smarter, fairer, and more efficient
                  academic environments.
                </p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>What We Do</h2>
            <div className="features-grid">
              <div className="feature">
                <i className="fas fa-robot"></i>
                <h3>AI-Powered Grading</h3>
                <p>
                  Automated assessment using advanced machine learning
                  algorithms
                </p>
              </div>
              <div className="feature">
                <i className="fas fa-comments"></i>
                <h3>Smart Feedback</h3>
                <p>Detailed and personalized feedback for improved learning</p>
              </div>
              <div className="feature">
                <i className="fas fa-chart-line"></i>
                <h3>Analytics</h3>
                <p>Comprehensive insights into student performance</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Our Vision</h2>
            <p>
              We envision a future where AI enhances education by providing
              fair, efficient, and insightful assessment tools that help
              educators focus more on teaching and students focus more on
              learning.
            </p>
          </section>
        </div>
      </main>

      {/* Reuse the same footer from LandingPage */}
    </div>
  );
};

export default About;
