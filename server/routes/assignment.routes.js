// const express = require('express');
// const router = express.Router();
// const Assignment = require('../models/assignment');
// const Classroom = require('../models/classroom');
// const User = require('../models/user');
// const authMiddleware = require('../middleware/auth.middleware');
// const { sendAssignmentNotification } = require('../utils/emailService');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Create uploads directory if it doesn't exist
// const uploadsDir = path.join(__dirname, '../uploads/assignments');
// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Configure multer for file upload
// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, 'uploads/assignments/');
//     },
//     filename: function(req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));
//     }
// });

// const upload = multer({ 
//     storage: storage,
//     fileFilter: (req, file, cb) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         if(ext !== '.pdf') {
//             return cb(new Error('Only PDF files are allowed'));
//         }
//         cb(null, true);
//     },
//     limits: {
//         fileSize: 5 * 1024 * 1024 // 5MB limit
//     }
// });

// // Create assignment
// router.post('/create', authMiddleware('Faculty'), upload.single('document'), async (req, res) => {
//     try {
//         console.log('Received assignment data:', req.body);
//         const { title, description, classroomId, dueDate, maxScore } = req.body;

//         // Validate required fields
//         if (!title || !description || !classroomId || !dueDate || !maxScore) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'All fields are required'
//             });
//         }

//         // Create new assignment with empty submissions array
//         const assignment = new Assignment({
//             title,
//             description,
//             classroomId,
//             dueDate,
//             maxScore,
//             documentUrl: req.file ? req.file.path : null,
//             submissions: [], // Initialize empty submissions array
//             createdAt: new Date()
//         });

//         await assignment.save();
//         console.log('Assignment created:', assignment);

//         res.status(201).json({
//             success: true,
//             message: 'Assignment created successfully',
//             assignment
//         });

//     } catch (error) {
//         console.error('Create assignment error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating assignment',
//             error: error.message
//         });
//     }
// });

// // Get classroom assignments
// router.get('/classroom/:classroomId', authMiddleware(['Faculty', 'Student']), async (req, res) => {
//     try {
//         const assignments = await Assignment.find({ 
//             classroomId: req.params.classroomId 
//         })
//         .populate('submissions.student', 'name email')
//         .sort({ createdAt: -1 });

//         console.log('Fetched assignments:', assignments);

//         res.json({
//             success: true,
//             assignments
//         });
//     } catch (error) {
//         console.error('Fetch assignments error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching assignments'
//         });
//     }
// });

// // Get single assignment with submissions
// router.get('/:assignmentId', authMiddleware(['Faculty', 'Student']), async (req, res) => {
//     try {
//         const assignment = await Assignment.findById(req.params.assignmentId)
//             .populate('submissions.student', 'name email');
        
//         if (!assignment) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Assignment not found'
//             });
//         }

//         res.json({
//             success: true,
//             assignment
//         });
//     } catch (error) {
//         console.error('Fetch assignment error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching assignment'
//         });
//     }
// });

// // Submit assignment
// router.post('/:assignmentId/submit', authMiddleware('Student'), upload.single('submission'), async (req, res) => {
//     try {
//         console.log('Submission request received:', {
//             assignmentId: req.params.assignmentId,
//             file: req.file,
//             body: req.body
//         });

//         const { assignmentId } = req.params;
        
//         // Get student ID from JWT
//         const studentId = req.user._id;
        
//         if (!studentId) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'User not authenticated'
//             });
//         }

//         // Check if file was uploaded
//         if (!req.file) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No file uploaded'
//             });
//         }

//         // Find the assignment
//         const assignment = await Assignment.findById(assignmentId);
//         if (!assignment) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Assignment not found'
//             });
//         }

//         // Check if submission is late
//         const isLate = new Date() > new Date(assignment.dueDate);

//         // Create submission object
//         const submission = {
//             student: studentId,
//             submissionUrl: req.file.path,
//             submissionDate: new Date(),
//             status: isLate ? 'late' : 'submitted',
//             score: null
//         };

//         // Check if student has already submitted
//         const existingSubmissionIndex = assignment.submissions.findIndex(
//             sub => sub.student.toString() === studentId.toString()
//         );

//         if (existingSubmissionIndex !== -1) {
//             // Update existing submission
//             assignment.submissions[existingSubmissionIndex] = submission;
//         } else {
//             // Add new submission
//             assignment.submissions.push(submission);
//         }

//         await assignment.save();
//         console.log('Assignment submission saved successfully');

//         res.json({
//             success: true,
//             message: isLate ? 'Assignment submitted late' : 'Assignment submitted successfully',
//             submission
//         });

//     } catch (error) {
//         console.error('Submit assignment error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error submitting assignment',
//             error: error.message
//         });
//     }
// });

// module.exports = router;