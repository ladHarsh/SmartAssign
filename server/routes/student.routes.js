const express = require('express');
const router = express.Router();
const Classroom = require('../models/classroom');
const authMiddleware = require('../middleware/auth.middleware');
const Assignment = require('../models/assignment');
const { sendSubmissionConfirmation } = require('../utils/emailService');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/submissions';
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Get enrolled classrooms
router.get('/classrooms/enrolled', authMiddleware('Student'), async (req, res) => {
    try {
        const studentId = req.user._id;
        
        const enrolledClassrooms = await Classroom.find({
            students: studentId
        }).populate('faculty', 'name email');

        res.json({
            success: true,
            classrooms: enrolledClassrooms
        });
    } catch (error) {
        console.error('Error fetching enrolled classrooms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch enrolled classrooms'
        });
    }
});

// Join classroom
router.post('/classrooms/join', authMiddleware('Student'), async (req, res) => {
    try {
        const { roomCode } = req.body;
        const studentId = req.user._id;

        // Find classroom with the given room code
        const classroom = await Classroom.findOne({ roomCode });

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Invalid room code'
            });
        }

        // Check if student is already enrolled
        if (classroom.students.includes(studentId)) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this classroom'
            });
        }

        // Add student to classroom
        classroom.students.push(studentId);
        await classroom.save();

        res.json({
            success: true,
            message: 'Successfully joined classroom',
            classroom
        });
    } catch (error) {
        console.error('Error joining classroom:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join classroom'
        });
    }
});

// Get classroom details
router.get('/classrooms/:classroomId', authMiddleware('Student'), async (req, res) => {
    try {
        const { classroomId } = req.params;
        const studentId = req.user._id;

        const classroom = await Classroom.findOne({
            _id: classroomId,
            students: studentId
        }).populate('faculty', 'name email');

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found or access denied'
            });
        }

        res.json({
            success: true,
            classroom
        });
    } catch (error) {
        console.error('Error fetching classroom details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch classroom details'
        });
    }
});

// Get assignments for a classroom
router.get('/classrooms/:classroomId/assignments', authMiddleware('Student'), async (req, res) => {
    try {
        const { classroomId } = req.params;
        const studentId = req.user._id;

        // Verify student is enrolled in classroom
        const classroom = await Classroom.findOne({
            _id: classroomId,
            students: studentId
        });

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found or not enrolled'
            });
        }

        const assignments = await Assignment.find({ classroom: classroomId })
            .populate('createdBy', 'name');

        // Add submission status for each assignment
        const assignmentsWithStatus = assignments.map(assignment => {
            const submission = assignment.submissions.find(
                sub => sub.student.toString() === studentId.toString()
            );
            return {
                ...assignment.toObject(),
                submitted: !!submission,
                submission: submission || null
            };
        });

        res.json({
            success: true,
            assignments: assignmentsWithStatus
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assignments'
        });
    }
});

// File upload route
router.post('/upload', authMiddleware('Student'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileUrl = `/uploads/submissions/${req.file.filename}`;
        
        res.json({
            success: true,
            fileUrl,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload file'
        });
    }
});

// Submit assignment route
router.post('/assignments/:assignmentId/submit', authMiddleware('Student'), upload.single('file'), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const studentId = req.user._id;

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const assignment = await Assignment.findById(assignmentId)
            .populate('classroom', 'name')
            .populate('createdBy', 'email');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check submission deadline
        if (new Date() > new Date(assignment.dueDate)) {
            return res.status(400).json({
                success: false,
                message: 'Assignment submission deadline has passed'
            });
        }

        // Create submission URL
        const submissionUrl = `/uploads/submissions/${req.file.filename}`;

        // Update or create submission
        const submissionIndex = assignment.submissions.findIndex(
            sub => sub.student.toString() === studentId.toString()
        );

        if (submissionIndex > -1) {
            assignment.submissions[submissionIndex].submissionUrl = submissionUrl;
            assignment.submissions[submissionIndex].submittedAt = new Date();
        } else {
            assignment.submissions.push({
                student: studentId,
                submissionUrl: submissionUrl,
                submittedAt: new Date()
            });
        }

        await assignment.save();

        res.json({
            success: true,
            message: 'Assignment submitted successfully'
        });
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit assignment'
        });
    }
});

// Add exit classroom route
router.post('/classrooms/:classroomId/exit', authMiddleware('Student'), async (req, res) => {
    try {
        const { classroomId } = req.params;
        const studentId = req.user._id;

        // Find the classroom and remove the student
        const classroom = await Classroom.findByIdAndUpdate(
            classroomId,
            {
                $pull: { students: studentId }
            },
            { new: true }
        );

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found'
            });
        }

        res.json({
            success: true,
            message: 'Successfully exited classroom'
        });
    } catch (error) {
        console.error('Error exiting classroom:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to exit classroom'
        });
    }
});

module.exports = router; 