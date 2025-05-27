const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Classroom = require('../models/classroom');
const authMiddleware = require('../middleware/auth.middleware');

// Get all users
router.get('/users', authMiddleware('Admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ 
            success: true,
            users
        });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// Delete user
router.delete('/users/:userId', authMiddleware('Admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow admin to delete themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Remove user from all classrooms
        await Classroom.updateMany(
            { students: user._id },
            { $pull: { students: user._id } }
        );

        // Delete classrooms where user is faculty
        if (user.role === 'Faculty') {
            await Classroom.deleteMany({ faculty: user._id });
        }

        await User.findByIdAndDelete(req.params.userId);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
});

// Get all classrooms
router.get('/classrooms', authMiddleware('Admin'), async (req, res) => {
    try {
        const classrooms = await Classroom.find()
            .populate('faculty', 'name email')
            .populate('students', 'name email');
        
        res.json({
            success: true,
            classrooms
        });
    } catch (error) {
        console.error('Fetch classrooms error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch classrooms'
        });
    }
});

// Delete classroom
router.delete('/classrooms/:classroomId', authMiddleware('Admin'), async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.classroomId);
        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found'
            });
        }

        await Classroom.findByIdAndDelete(req.params.classroomId);

        res.json({
            success: true,
            message: 'Classroom deleted successfully'
        });
    } catch (error) {
        console.error('Delete classroom error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete classroom'
        });
    }
});

module.exports = router; 