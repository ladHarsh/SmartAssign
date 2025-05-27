// // routes/classroom.routes.js
// const express = require('express');
// const router = express.Router();
// const Classroom = require('../models/classroom');
// const User = require('../models/user');
// const authMiddleware = require('../middleware/auth.middleware');
// const { sendInviteEmail } = require('../utils/emailService');
// const crypto = require('crypto');

// const generateRoomCode = () => {
//     return crypto.randomBytes(3).toString('hex').toUpperCase();
// };

// // Get faculty's classrooms - should be before /:id route
// router.get('/faculty-classes', authMiddleware('Faculty'), async (req, res) => {
//     try {
//         const classrooms = await Classroom.find({ faculty: req.user._id })
//             .populate('faculty', 'name email');
//         res.json({ success: true, classrooms });
//     } catch (error) {
//         console.error('Error fetching faculty classrooms:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// });

// // Get student's classrooms
// router.get('/student-classes', authMiddleware('Student'), async (req, res) => {
//     try {
//         const classrooms = await Classroom.find({ students: req.user._id });
//         res.json({ success: true, classrooms });
//     } catch (error) {
//         console.error('Error fetching student classrooms:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// });

// // Admin stats route
// router.get('/admin-stats', authMiddleware('Admin'), async (req, res) => {
//     try {
        

//         // Get all faculty members with their classroom counts
//         const facultyStats = await User.aggregate([
//             { $match: { role: 'Faculty' } },
//             {
//                 $lookup: {
//                     from: 'classrooms',
//                     localField: '_id',
//                     foreignField: 'faculty',
//                     as: 'classrooms'
//                 }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     name: 1,
//                     email: 1,
//                     classroomCount: { $size: '$classrooms' },
//                     classrooms: {
//                         $map: {
//                             input: '$classrooms',
//                             as: 'classroom',
//                             in: {
//                                 name: '$$classroom.name',
//                                 subject: '$$classroom.subject',
//                                 studentCount: { $size: { $ifNull: ['$$classroom.students', []] } }
//                             }
//                         }
//                     }
//                 }
//             }
//         ]);

//         const totalFaculty = await User.countDocuments({ role: 'Faculty' });
//         const totalStudents = await User.countDocuments({ role: 'Student' });
//         const totalClassrooms = await Classroom.countDocuments();

//         const classrooms = await Classroom.find()
//             .populate('faculty', 'name email')
//             .populate('students', 'name email')
//             .sort({ createdAt: -1 });

//         res.json({
//             success: true,
//             stats: {
//                 totalFaculty,
//                 totalStudents,
//                 totalClassrooms,
//                 facultyStats,
//                 classrooms
//             }
//         });
//     } catch (error) {
//         console.error('Error in admin-stats:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching admin statistics',
//             error: error.message
//         });
//     }
// });

// // Create classroom
// router.post('/create', authMiddleware('Faculty'), async (req, res) => {
//     try {
//         const { name, subject, description, studentEmails } = req.body;
//         const faculty = req.user;
//         const roomCode = generateRoomCode();
        
//         const classroom = new Classroom({
//             name,
//             subject,
//             description,
//             faculty: faculty._id,
//             roomCode,
//             invitedEmails: studentEmails.map(email => ({ email, status: 'pending' }))
//         });

//         await classroom.save();

//         // Send invites to all students
//         for (const email of studentEmails) {
//             try {
//                 await sendInviteEmail(email, roomCode, faculty.name, name);
//             } catch (emailError) {
//                 console.error('Error sending invite email:', emailError);
//                 // Continue with other emails even if one fails
//             }
//         }

//         res.status(201).json({
//             success: true,
//             message: 'Classroom created successfully',
//             classroom
//         });
//     } catch (error) {
//         console.error('Classroom creation error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating classroom',
//             error: error.message
//         });
//     }
// });

// // Join classroom
// router.post('/join', authMiddleware('Student'), async (req, res) => {
//     try {
//         const { roomCode } = req.body;
//         const student = req.user;
        
//         const classroom = await Classroom.findOne({ roomCode });
//         if (!classroom) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Classroom not found'
//             });
//         }

//         // Check if student is already in the classroom
//         const isEnrolled = classroom.students.some(
//             id => id.toString() === student._id.toString()
//         );
        
//         if (isEnrolled) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'You are already enrolled in this classroom'
//             });
//         }

//         // Check if student's email was invited
//         const invitedEmailIndex = classroom.invitedEmails.findIndex(
//             invite => invite.email === student.email
//         );

//         if (invitedEmailIndex === -1) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'You were not invited to this classroom'
//             });
//         }

//         // Update invite status and add student
//         classroom.invitedEmails[invitedEmailIndex].status = 'joined';
//         classroom.students.push(student._id);
//         await classroom.save();

//         res.json({
//             success: true,
//             message: 'Successfully joined classroom',
//             classroom
//         });
//     } catch (error) {
//         console.error('Join classroom error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error joining classroom',
//             error: error.message
//         });
//     }
// });

// // Get specific classroom - should be after other GET routes
// router.get('/:id', authMiddleware(['Faculty', 'Student']), async (req, res) => {
//     try {
//         const classroom = await Classroom.findById(req.params.id)
//             .populate('faculty', 'name email')
//             .populate('students', 'name email');

//         if (!classroom) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Classroom not found'
//             });
//         }

//         // Check if the requesting faculty owns this classroom
//         if (classroom.faculty._id.toString() !== req.user._id.toString()) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Not authorized to access this classroom'
//             });
//         }

//         res.json({
//             success: true,
//             classroom
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching classroom',
//             error: error.message
//         });
//     }
// });

// // Admin management routes
// router.delete('/admin/faculty/:id', authMiddleware('Admin'), async (req, res) => {
//     try {
//         const facultyId = req.params.id;

//         // First, get all classrooms associated with this faculty
//         const facultyClassrooms = await Classroom.find({ faculty: facultyId });

//         // Delete all classrooms associated with this faculty
//         await Classroom.deleteMany({ faculty: facultyId });

//         // Delete the faculty user
//         const deletedFaculty = await User.findByIdAndDelete(facultyId);

//         if (!deletedFaculty) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Faculty not found'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'Faculty and associated classrooms removed successfully',
//             deletedFaculty
//         });
//     } catch (error) {
//         console.error('Error removing faculty:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error removing faculty',
//             error: error.message
//         });
//     }
// });

// router.delete('/admin/classroom/:id', authMiddleware('Admin'), async (req, res) => {
//     try {
//         const classroomId = req.params.id;

//         const deletedClassroom = await Classroom.findByIdAndDelete(classroomId);

//         if (!deletedClassroom) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Classroom not found'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'Classroom removed successfully',
//             deletedClassroom
//         });
//     } catch (error) {
//         console.error('Error removing classroom:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error removing classroom',
//             error: error.message
//         });
//     }
// });

// router.delete('/admin/student/:id', authMiddleware('Admin'), async (req, res) => {
//     try {
//         const studentId = req.params.id;

//         // Remove student from all classrooms they're enrolled in
//         await Classroom.updateMany(
//             { students: studentId },
//             { $pull: { students: studentId } }
//         );

//         // Delete the student user
//         const deletedStudent = await User.findByIdAndDelete(studentId);

//         if (!deletedStudent) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Student not found'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'Student removed successfully',
//             deletedStudent
//         });
//     } catch (error) {
//         console.error('Error removing student:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error removing student',
//             error: error.message
//         });
//     }
// });

// // Other routes...
// router.post('/:id/announcements', authMiddleware('Faculty'), async (req, res) => {
//     try {
//         const classroom = await Classroom.findById(req.params.id);
//         if (!classroom) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Classroom not found'
//             });
//         }

//         if (classroom.faculty.toString() !== req.user._id.toString()) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Not authorized to make announcements in this classroom'
//             });
//         }

//         const announcement = new Announcement({
//             classroom: classroom._id,
//             faculty: req.user._id,
//             content: req.body.content
//         });

//         await announcement.save();

//         res.status(201).json({
//             success: true,
//             message: 'Announcement created successfully',
//             announcement
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error creating announcement',
//             error: error.message
//         });
//     }
// });

// router.get('/:id/announcements', authMiddleware(['Faculty', 'Student']), async (req, res) => {
//     try {
//         const announcements = await Announcement.find({ classroom: req.params.id })
//             .populate('faculty', 'name')
//             .sort({ createdAt: -1 });

//         res.json({
//             success: true,
//             announcements
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching announcements',
//             error: error.message
//         });
//     }
// });

// module.exports = router;