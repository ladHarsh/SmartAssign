const express = require('express');
const router = express.Router();
const Classroom = require('../models/classroom');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth.middleware');
const Assignment = require('../models/assignment');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { sendInviteEmail, notifyNewAssignment, notifyGradePosted } = require('../utils/emailService');
const multer = require('multer');
const PDFParser = require('pdf2json');
const axios = require('axios');

// Add this helper function at the top of the file after imports
const extractPDFText = async (filePath) => {
    try {
        const pdfParser = new PDFParser(null, 1);
        const pdfText = await new Promise((resolve, reject) => {
            pdfParser.on('pdfParser_dataReady', (pdfData) => {
                let text = '';
                for (let page of pdfData.Pages) {
                    for (let textItem of page.Texts) {
                        // Handle each text element properly
                        if (textItem.R && textItem.R.length > 0) {
                            text += textItem.R.map(r => decodeURIComponent(r.T)).join('') + ' ';
                        }
                    }
                    text += '\n'; // Add newline between pages
                }
                resolve(text.trim());
            });
            pdfParser.on('pdfParser_dataError', reject);
            pdfParser.loadPDF(filePath);
        });
        return pdfText;
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw error;
    }
};

// Get faculty's classrooms
router.get('/classrooms', authMiddleware('Faculty'), async (req, res) => {
    try {
        const facultyId = req.user._id;
        
        const classrooms = await Classroom.find({ faculty: facultyId })
            .populate('students', 'name email')
            .populate('faculty', 'name email');

        res.json({
            success: true,
            classrooms
        });
    } catch (error) {
        console.error('Error fetching faculty classrooms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch classrooms'
        });
    }
});

// Create new classroom
router.post('/classrooms', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { name, subject, description, studentEmails } = req.body;
        const facultyId = req.user._id;
        const faculty = await User.findById(facultyId);

        // Generate a unique room code
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newClassroom = new Classroom({
            name,
            subject,
            description,
            faculty: facultyId,
            roomCode
        });

        await newClassroom.save();

        // Send invitation emails to students
        if (studentEmails && studentEmails.length > 0) {
            console.log('Sending invites to:', studentEmails);
            const emailPromises = studentEmails.map(email => 
                sendInviteEmail(email, roomCode, faculty.name, name)
            );
            
            try {
                await Promise.all(emailPromises);
                console.log('All invitation emails sent successfully');
            } catch (emailError) {
                console.error('Error sending some invitation emails:', emailError);
                // Continue execution even if some emails fail
            }
        }

        res.json({
            success: true,
            message: 'Classroom created successfully',
            classroom: newClassroom
        });
    } catch (error) {
        console.error('Error creating classroom:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create classroom'
        });
    }
});

// Update classroom
router.put('/classrooms/:classroomId', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { name, subject, description, studentEmails } = req.body;
        const facultyId = req.user._id;
        const faculty = await User.findById(facultyId);

        const classroom = await Classroom.findOne({
            _id: classroomId,
            faculty: facultyId
        });

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found or unauthorized'
            });
        }

        // Update classroom details
        classroom.name = name || classroom.name;
        classroom.subject = subject || classroom.subject;
        classroom.description = description || classroom.description;

        await classroom.save();

        // Ensure studentEmails is an array before processing
        if (Array.isArray(studentEmails) && studentEmails.length > 0) {
            console.log('Sending invites to new students:', studentEmails);
            const emailPromises = studentEmails.map(email => 
                sendInviteEmail(email, classroom.roomCode, faculty.name, classroom.name)
            );
            
            try {
                await Promise.all(emailPromises);
                console.log('All invitation emails sent successfully');
            } catch (emailError) {
                console.error('Error sending some invitation emails:', emailError);
            }
        }

        res.json({
            success: true,
            message: 'Classroom updated successfully',
            classroom
        });
    } catch (error) {
        console.error('Error updating classroom:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update classroom'
        });
    }
});

// Delete classroom
router.delete('/classrooms/:classroomId', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { classroomId } = req.params;
        const facultyId = req.user._id;

        const classroom = await Classroom.findOneAndDelete({
            _id: classroomId,
            faculty: facultyId
        });

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'Classroom deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting classroom:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete classroom'
        });
    }
});

// Remove student from classroom
router.delete('/classrooms/:classroomId/students/:studentId', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { classroomId, studentId } = req.params;
        const facultyId = req.user._id;

        const classroom = await Classroom.findOne({
            _id: classroomId,
            faculty: facultyId
        });

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found or unauthorized'
            });
        }

        classroom.students = classroom.students.filter(
            student => student.toString() !== studentId
        );

        await classroom.save();

        res.json({
            success: true,
            message: 'Student removed successfully'
        });
    } catch (error) {
        console.error('Error removing student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove student'
        });
    }
});

// Get classroom details with students
router.get('/classrooms/:classroomId', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { classroomId } = req.params;
        const facultyId = req.user._id;

        const classroom = await Classroom.findOne({
            _id: classroomId,
            faculty: facultyId
        }).populate('students', 'name email');

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found or unauthorized'
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

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/assignments/'); // Make sure this directory exists
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

// File upload route
router.post('/upload', authMiddleware('Faculty'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileUrl = `/uploads/assignments/${req.file.filename}`;
        
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

// Create assignment route
router.post('/classrooms/:classroomId/assignments', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { title, description, dueDate, maxMarks, assignmentFile } = req.body;
        const facultyId = req.user._id;

        // Extract text from faculty's assignment document
        const assignmentFilePath = path.join(__dirname, '..', assignmentFile);
        const assignmentText = await extractPDFText(assignmentFilePath);
        console.log('Faculty Assignment Text:', assignmentText);

        // Generate ideal answers using AI with better prompt
        const idealAnswersResponse = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-8b-8192",
                messages: [
                    {
                        role: "system",
                        content: "You are a subject matter expert creating ideal answers and marking criteria. Keep answers concise and within token limits."
                    },
                    {
                        role: "user",
                        content: `
                            Based on this assignment:
                            Title: ${title}
                            Description: ${description}
                            Content: ${assignmentText}

                            Create a concise ideal answer sheet with marking criteria.
                            Keep each answer under 200 words.
                            
                            Respond ONLY with this exact JSON structure:
                            {
                                "questions": [
                                    {
                                        "questionNumber": number,
                                        "idealAnswer": "brief answer",
                                        "keyPoints": ["point1", "point2"],
                                        "maxMarks": number,
                                        "markingCriteria": ["criteria1", "criteria2"]
                                    }
                                ],
                                "totalMarks": ${maxMarks}
                            }
                        `
                    }
                ],
                max_tokens: 4000,
                temperature: 0.1
            },
            {
                headers: { 
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Parse and validate the response
        let idealAnswers;
        try {
            const responseContent = idealAnswersResponse.data.choices[0].message.content.trim();
            console.log('Raw AI Response:', responseContent);
            
            // Clean the response string before parsing
            const cleanedContent = responseContent
                .replace(/[\n\r]/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/\\./g, '')
                .replace(/[^\x20-\x7E]/g, '')
                .replace(/```[^`]*```/g, ''); // Remove code blocks
            
            // Try to extract valid JSON
            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                idealAnswers = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No valid JSON found in response');
            }

            // Validate the structure
            if (!idealAnswers.questions || !Array.isArray(idealAnswers.questions)) {
                throw new Error('Invalid response structure');
            }
        } catch (parseError) {
            console.error('AI response parsing error:', parseError);
            throw new Error('Failed to generate ideal answers');
        }

        // Create and save the assignment
        const assignment = new Assignment({
            title,
            description,
            dueDate,
            maxMarks,
            assignmentFile,
            classroom: classroomId,
            createdBy: facultyId,
            idealAnswers
        });

        await assignment.save();

        // Update classroom with new assignment using $push
        await Classroom.updateOne(
            { _id: classroomId },
            { 
                $push: { assignments: assignment._id }
            }
        );

        console.log('Assignment created successfully:', assignment);

        // After successfully creating the assignment, notify students
        const classroomWithStudents = await Classroom.findById(classroomId)
            .populate('students', 'email name');

        // Send notifications to students
        console.log('Sending notifications to students:', classroomWithStudents.students);

        for (const student of classroomWithStudents.students) {
            try {
                await notifyNewAssignment(
                    student,
                    assignment,
                    classroomWithStudents.name // Use classroomWithStudents instead of classroom
                );
            } catch (error) {
                console.error(`Failed to send notification to ${student.email}:`, error);
            }
        }

        res.json({
            success: true,
            message: 'Assignment created and notifications sent',
            assignment
        });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create assignment'
        });
    }
});

// Get classroom assignments
router.get('/classrooms/:classroomId/assignments', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { classroomId } = req.params;
        const facultyId = req.user._id;

        // Verify classroom belongs to faculty
        const classroom = await Classroom.findOne({
            _id: classroomId,
            faculty: facultyId
        });

        if (!classroom) {
            return res.status(404).json({
                success: false,
                message: 'Classroom not found or unauthorized'
            });
        }

        const assignments = await Assignment.find({ classroom: classroomId })
            .populate('submissions.student', 'name email');

        res.json({
            success: true,
            assignments
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assignments'
        });
    }
});

// Grade submission route
router.post('/assignments/:assignmentId/submissions/:submissionId/grade', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { assignmentId, submissionId } = req.params;
        const { grade, feedback } = req.body;

        // Find assignment and populate classroom details
        const assignment = await Assignment.findById(assignmentId)
            .populate('classroom', 'name');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Find the submission
        const submission = assignment.submissions.id(submissionId);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Validate grade
        if (grade < 0 || grade > assignment.maxMarks) {
            return res.status(400).json({
                success: false,
                message: `Grade must be between 0 and ${assignment.maxMarks}`
            });
        }

        // Get student details for email
        const student = await User.findById(submission.student);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Update submission
        submission.grade = grade;
        submission.feedback = feedback;
        await assignment.save();

        // Send email notification
        try {
            await notifyGradePosted(
                student.email,
                student.name,
                assignment.title,
                grade,
                assignment.maxMarks,
                feedback,
                assignment.classroom.name
            );
        } catch (emailError) {
            console.error('Error sending grade notification:', emailError);
            // Don't fail the grading if email fails
        }

        res.json({
            success: true,
            message: 'Grade posted successfully',
            submission: submission
        });

    } catch (error) {
        console.error('Grading error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to post grade'
        });
    }
});

// Update grade route
router.put('/assignments/:assignmentId/submissions/:submissionId/grade', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { assignmentId, submissionId } = req.params;
        const { grade, feedback } = req.body;
        const facultyId = req.user._id;

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            createdBy: facultyId
        }).populate('submissions.student', 'name email')
          .populate('classroom', 'name');  // Add this to get classroom name

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found or unauthorized'
            });
        }

        const submission = assignment.submissions.id(submissionId);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        submission.grade = grade;
        submission.feedback = feedback;
        await assignment.save();

        // Send email notification
        try {
            await notifyGradePosted(
                submission.student.email,
                submission.student.name,
                assignment.title,
                grade,
                assignment.maxMarks,
                feedback,
                assignment.classroom.name
            );
            console.log('Grade notification email sent successfully');
        } catch (emailError) {
            console.error('Error sending grade notification:', emailError);
            // Don't fail the grading if email fails
        }

        res.json({
            success: true,
            message: 'Grade updated successfully',
            submission
        });

    } catch (error) {
        console.error('Error updating grade:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update grade'
        });
    }
});

// Delete assignment
router.delete('/assignments/:assignmentId', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const facultyId = req.user._id;

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            createdBy: facultyId
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found or unauthorized'
            });
        }

        // Delete the assignment file if it exists
        if (assignment.assignmentFile) {
            const filePath = path.join(__dirname, '..', 'uploads', 
                assignment.assignmentFile.split('/').pop()
            );
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete all submission files
        for (const submission of assignment.submissions) {
            if (submission.submissionUrl) {
                const submissionPath = path.join(__dirname, '..', 'uploads', 
                    submission.submissionUrl.split('/').pop()
                );
                if (fs.existsSync(submissionPath)) {
                    fs.unlinkSync(submissionPath);
                }
            }
        }

        await Assignment.deleteOne({ _id: assignmentId });

        res.json({
            success: true,
            message: 'Assignment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete assignment'
        });
    }
});

// Update assignment
router.put('/assignments/:assignmentId', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { title, description, dueDate, maxMarks, assignmentFile } = req.body;
        const facultyId = req.user._id;

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            createdBy: facultyId
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found or unauthorized'
            });
        }

        // Update assignment details
        assignment.title = title;
        assignment.description = description;
        assignment.dueDate = dueDate;
        assignment.maxMarks = maxMarks;
        if (assignmentFile) {
            assignment.assignmentFile = assignmentFile;
        }

        await assignment.save();

        // Send email notifications to all students
        const classroom = await Classroom.findById(assignment.classroom)
            .populate('students', 'email name');
        
        for (const student of classroom.students) {
            await notifyNewAssignment([student], assignment, classroom.name);
        }

        res.json({
            success: true,
            message: 'Assignment updated successfully',
            assignment
        });
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update assignment'
        });
    }
});

// Get assignment statistics
router.get('/assignments/:assignmentId/statistics', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const facultyId = req.user._id;

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            createdBy: facultyId
        }).populate('submissions.student', 'name');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found or unauthorized'
            });
        }

        const classroom = await Classroom.findById(assignment.classroom);
        const totalStudents = classroom.students.length;
        const totalSubmissions = assignment.submissions.length;
        const gradedSubmissions = assignment.submissions.filter(sub => sub.grade !== null).length;
        
        // Calculate average grade
        const grades = assignment.submissions
            .filter(sub => sub.grade !== null)
            .map(sub => sub.grade);
        const averageGrade = grades.length > 0 
            ? grades.reduce((a, b) => a + b, 0) / grades.length 
            : 0;

        // Calculate grade distribution
        const gradeDistribution = {
            '90-100': 0,
            '80-89': 0,
            '70-79': 0,
            '60-69': 0,
            'Below 60': 0
        };

        grades.forEach(grade => {
            const percentage = (grade / assignment.maxMarks) * 100;
            if (percentage >= 90) gradeDistribution['90-100']++;
            else if (percentage >= 80) gradeDistribution['80-89']++;
            else if (percentage >= 70) gradeDistribution['70-79']++;
            else if (percentage >= 60) gradeDistribution['60-69']++;
            else gradeDistribution['Below 60']++;
        });

        res.json({
            success: true,
            statistics: {
                totalStudents,
                totalSubmissions,
                gradedSubmissions,
                averageGrade,
                gradeDistribution,
                submissionRate: (totalSubmissions / totalStudents) * 100,
                gradingProgress: (gradedSubmissions / totalSubmissions) * 100
            }
        });
    } catch (error) {
        console.error('Error fetching assignment statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assignment statistics'
        });
    }
});

// Add assignment submission route
router.post('/assignments/:assignmentId/submit', authMiddleware('Student'), upload.single('file'), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const studentId = req.user._id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check if submission is before due date
        if (new Date() > new Date(assignment.dueDate)) {
            return res.status(400).json({
                success: false,
                message: 'Assignment submission deadline has passed'
            });
        }

        const submissionFile = `/uploads/submissions/${req.file.filename}`;
        
        // Update or create submission
        const submissionIndex = assignment.submissions.findIndex(
            sub => sub.student.toString() === studentId.toString()
        );

        if (submissionIndex > -1) {
            assignment.submissions[submissionIndex].submissionFile = submissionFile;
            assignment.submissions[submissionIndex].submittedAt = new Date();
        } else {
            assignment.submissions.push({
                student: studentId,
                submissionFile,
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

// Get assignments for student
router.get('/student/assignments', authMiddleware('Student'), async (req, res) => {
    try {
        const studentId = req.user._id;

        // Find all classrooms where the student is enrolled
        const classrooms = await Classroom.find({
            students: studentId
        });

        // Get all assignments from these classrooms
        const assignments = await Assignment.find({
            classroom: { $in: classrooms.map(c => c._id) }
        }).populate('classroom', 'name')
          .populate('createdBy', 'name');

        res.json({
            success: true,
            assignments
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assignments'
        });
    }
});

// Auto-grade submission using Groq API
router.post('/assignments/:assignmentId/submissions/:submissionId/autograde', authMiddleware('Faculty'), async (req, res) => {
    try {
        const { assignmentId, submissionId } = req.params;
        const assignment = await Assignment.findById(assignmentId)
            .populate('submissions.student', 'name')
            .populate('classroom', 'name');

        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        const submission = assignment.submissions.id(submissionId);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        // Fix file path handling
        const submissionFileName = submission.submissionUrl ? submission.submissionUrl.split('/').pop() : null;

        if (!submissionFileName) {
            return res.status(404).json({
                success: false,
                message: 'No submission file found'
            });
        }

        const submissionFilePath = path.join(__dirname, '..', 'uploads', 'submissions', submissionFileName);

        console.log('File details:', {
            submissionUrl: submission.submissionUrl,
            fileName: submissionFileName,
            fullPath: submissionFilePath
        });

        if (!fs.existsSync(submissionFilePath)) {
            console.error('File not found:', {
                path: submissionFilePath,
                submissionUrl: submission.submissionUrl
            });
            return res.status(404).json({
                success: false,
                message: 'Submission file not found on server'
            });
        }

        try {
            const dataBuffer = fs.readFileSync(submissionFilePath);
            // Read PDF content using pdf2json
            const pdfParser = new PDFParser();
            const pdfContent = await new Promise((resolve, reject) => {
                pdfParser.on('pdfParser_dataReady', (pdfData) => {
                    const text = pdfData.Pages.map(page => 
                        page.Texts.map(text => decodeURIComponent(text.R[0].T)).join(' ')
                    ).join('\n');
                    resolve(text);
                });
                pdfParser.on('pdfParser_dataError', reject);
                pdfParser.loadPDF(submissionFilePath);
            });

            console.log('PDF Content extracted successfully');

            // Extract text from student's submission
            const submissionText = await extractPDFText(submissionFilePath);
            console.log('Student Submission Text:', submissionText);

            // Get ideal answers from assignment
            const idealAnswers = assignment.idealAnswers;

            // Compare with ideal answers
            const gradingResponse = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: "You are grading a student submission against ideal answers."
                        },
                        {
                            role: "user",
                            content: `
                                Compare this submission with the ideal answers:

                                Ideal Answers: ${JSON.stringify(idealAnswers)}
                                
                                Student Submission: ${submissionText}

                                Assignment Maximum Marks: ${assignment.maxMarks}

                                Grade based on matching key points and criteria.
                                Important: The grade should be calculated out of ${assignment.maxMarks} marks, not out of 100.
                                Respond in JSON: {"grade": number, "feedback": "string"}
                            `
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.3,
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Parse the AI response with error handling
            try {
                const responseContent = gradingResponse.data.choices[0].message.content.trim();
                console.log('Raw API Response:', responseContent);
                
                // Clean the response string before parsing
                const cleanedContent = responseContent
                    .replace(/[\n\r]/g, ' ') // Remove newlines
                    .replace(/\s+/g, ' ') // Normalize spaces
                    .replace(/\\./g, '') // Remove escape sequences
                    .replace(/[^\x20-\x7E]/g, ''); // Remove non-printable characters
                
                let aiResponse;
                try {
                    aiResponse = JSON.parse(cleanedContent);
                } catch (parseError) {
                    // If JSON parse fails, try to extract JSON from the text
                    const jsonMatch = cleanedContent.match(/\{[^{}]*\}/);
                    if (jsonMatch) {
                        aiResponse = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('Could not parse API response as JSON');
                    }
                }

                // Validate the response format
                if (!aiResponse || typeof aiResponse.grade === 'undefined' || !aiResponse.feedback) {
                    throw new Error('Invalid response format from API');
                }

                // Calculate proportional grade
                const finalGrade = Math.min(Math.max(0, parseFloat(aiResponse.grade)), assignment.maxMarks);

                // Update submission
                submission.grade = finalGrade;
                submission.feedback = aiResponse.feedback;
                submission.isAutoGraded = true;
                await assignment.save();

                // Send the converted grade to frontend
                res.json({
                    success: true,
                    message: 'Assignment auto-graded successfully',
                    grade: finalGrade,
                    feedback: aiResponse.feedback
                });
            } catch (parseError) {
                console.error('Error parsing API response:', parseError);
                res.status(500).json({
                    success: false,
                    message: 'Failed to parse auto-grading response'
                });
            }
        } catch (error) {
            console.error('File reading error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error reading submission file'
            });
        }
    } catch (error) {
        console.error('Auto-grading error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to auto-grade assignment'
        });
    }
});

module.exports = router;