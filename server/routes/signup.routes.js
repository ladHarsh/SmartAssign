const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check admin limit if role is Admin
        if (role === 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin' });
            if (adminCount >= 2) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Maximum number of admins (2) has been reached. Cannot register new admin." 
                });
            }
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();

        const token = jwt.sign({ _id: user._id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ success: true, message: "Registration successful", token });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: "Server error during registration" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        const token = jwt.sign(
            { 
                _id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.status(200).json({ 
            success: true, 
            message: "Login successful", 
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Server error during login" 
        });
    }
});

router.post("/logout", (req, res) => {
    res.status(200).json({ success: true, message: "Logged out successfully" });
});

router.get("/admin-dashboard", authMiddleware("Admin"), (req, res) => {
    res.json({ success: true, message: "Admin dashboard data", userId: req.user._id });
});

router.get("/faculty-dashboard", authMiddleware("Faculty"), (req, res) => {
    res.json({ success: true, message: "Faculty dashboard data", userId: req.user._id });
});

router.get("/student-dashboard", authMiddleware("Student"), (req, res) => {
    res.json({ success: true, message: "Student dashboard data", userId: req.user._id });
});

router.get('/status', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                isAuthenticated: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id).select('-password');

        if (!user) {
            return res.status(401).json({
                isAuthenticated: false,
                message: 'User not found'
            });
        }

        res.json({
            isAuthenticated: true,
            userRole: user.role,
            userName: user.name
        });
    } catch (error) {
        console.error('Auth status check error:', error);
        res.status(401).json({
            isAuthenticated: false,
            message: 'Invalid token'
        });
    }
});

// Add this new route
router.get("/check-admin-limit", async (req, res) => {
    try {
        const adminCount = await User.countDocuments({ role: 'Admin' });
        res.json({ 
            success: true, 
            adminLimitReached: adminCount >= 2 
        });
    } catch (error) {
        console.error('Error checking admin limit:', error);
        res.status(500).json({ 
            success: false, 
            message: "Error checking admin limit" 
        });
    }
});

module.exports = router;