import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Remove useHistory, add useLocation
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import Notification from '../Notification';
import AssignmentModal from '../Assignment/AssignmentModal';
import GradeSubmissionModal from '../Assignment/GradeSubmissionModal';
import CreateClassroomModal from '../Classroom/CreateClassroomModal';
import Header from '../header/Header';
import './Dashboard.css';
import { useUpdate } from '../../context/UpdateContext';
import { getApiUrl } from '../../config/api.config';
import { getBaseUrl } from '../../config/api.config';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const FacultyDashboard = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        description: '',
        studentEmails: []
    });
    const { logout, userName, userRole } = useAuth();
    const navigate = useNavigate();
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [activeView, setActiveView] = useState('assignments');
    const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [showSubmissions, setShowSubmissions] = useState(false);
    const { updateTrigger, triggerUpdate } = useUpdate();
    const [autoGradingStatus, setAutoGradingStatus] = useState({});
    const [gradeModalData, setGradeModalData] = useState(null);
    const [urlValidationResults, setUrlValidationResults] = useState({});

    const location = useLocation();

    const getBackgroundColor = (index) => {
        const colors = [
            '#4F46E5', // Indigo
            '#7C3AED', // Purple
            '#2563EB', // Blue
            '#059669', // Emerald
            '#DC2626', // Red
            '#0891B2', // Cyan
            '#2E3280', // Dark Blue
            '#7E22CE', // Purple
            '#0369A1', // Sky Blue
            '#BE123C'  // Rose
        ];
        return colors[index % colors.length];
    };

    const getAssignmentColor = (letter) => {
        const colors = {
            'A': '#4F46E5', // Indigo
            'B': '#2563EB', // Blue
            'C': '#0891B2', // Cyan
            'D': '#059669', // Emerald
            'E': '#0369A1', // Sky Blue
            'F': '#7C3AED', // Purple
            'G': '#BE123C', // Rose
            'H': '#2E3280', // Dark Blue
            'I': '#7E22CE', // Purple
            'J': '#DC2626', // Red
            'K': '#0369A1', // Sky Blue
            'L': '#4F46E5', // Indigo
            'M': '#2563EB', // Blue
            'N': '#059669', // Emerald
            'O': '#0891B2', // Cyan
            'P': '#7C3AED', // Purple
            'Q': '#BE123C', // Rose
            'R': '#2E3280', // Dark Blue
            'S': '#7E22CE', // Purple
            'T': '#DC2626', // Red
            'U': '#0369A1', // Sky Blue
            'V': '#4F46E5', // Indigo
            'W': '#2563EB', // Blue
            'X': '#059669', // Emerald
            'Y': '#0891B2', // Cyan
            'Z': '#7C3AED'  // Purple
        };
        return colors[letter.toUpperCase()] || '#4F46E5'; // Default color
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFormattedTimeRemaining = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;

        if (diff < 0) return 'Past due';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days} days remaining`;
        if (hours > 0) return `${hours} hours remaining`;
        return 'Due soon';
    };

    const getTimeRemainingClass = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        return due < now ? 'text-danger' : 'text-success';
    };

    // Add this function at the top of the file with other utility functions
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Add this function at the beginning of your component function

    // Function to show feedback popup
    const showFeedbackPopup = (submissionId) => {
        document.getElementById(`feedback-popup-${submissionId}`).style.display = 'block';
        document.getElementById(`feedback-overlay-${submissionId}`).style.display = 'block';
    };

    // Function to hide feedback popup
    const hideFeedbackPopup = (submissionId) => {
        document.getElementById(`feedback-popup-${submissionId}`).style.display = 'none';
        document.getElementById(`feedback-overlay-${submissionId}`).style.display = 'none';
    };

    // Add this utility function in your component

    // Function to check if a URL exists
    const checkUrlExists = async (url) => {
        if (!url || !url.startsWith('http')) return false;
        
        try {
            const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            return true; // If we get here, the resource exists
        } catch (error) {
            console.error("Error checking URL:", error);
            return false;
        }
    };

    // Add this function to export submissions to Excel
    const exportSubmissionsToExcel = () => {
        if (!selectedAssignment || !selectedAssignment.submissions || selectedAssignment.submissions.length === 0) {
            setError("No submissions to export");
            return;
        }
    
        try {
            // Format the data for Excel
            const submissionsData = selectedAssignment.submissions.map((submission, index) => {
                // Get student info
                const student = submission.student || 
                    selectedClassroom.students?.find(s => s._id === submission.studentId) || 
                    { name: 'Unknown Student' };
                
                // Create row data
                return {
                    'No.': index + 1,
                    'Student Name': student.name,
                    'Email': student.email || '',
                    'Submission Date': new Date(submission.submittedAt).toLocaleString(),
                    'Status': submission.grade !== undefined ? 'Graded' : 'Not Graded',
                    'Grade': submission.grade !== undefined ? `${submission.grade}/${selectedAssignment.maxMarks}` : 'N/A',
                    'Grading Method': submission.isAutoGraded ? 'AI Graded' : submission.grade !== undefined ? 'Manually Graded' : 'Not Graded',
                    'Feedback': submission.feedback || '',
                    'Submission URL': submission.submissionUrl || ''
                };
            });
            
            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(submissionsData);
            
            // Create column widths
            const columnWidths = [
                { wch: 5 },   // No.
                { wch: 25 },  // Student Name
                { wch: 30 },  // Email
                { wch: 20 },  // Submission Date
                { wch: 15 },  // Status
                { wch: 10 },  // Grade
                { wch: 15 },  // Grading Method
                { wch: 40 },  // Feedback
                { wch: 50 }   // Submission URL
            ];
            worksheet['!cols'] = columnWidths;
            
            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
            
            // Generate Excel file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // Create filename
            const filename = `${selectedAssignment.title}_submissions_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Save file
            saveAs(fileData, filename);
            
            setSuccess('Submissions exported successfully');
        } catch (error) {
            console.error('Error exporting submissions:', error);
            setError('Failed to export submissions');
        }
    };

    // Update the fetchClassrooms function to include assignments count
    const fetchClassrooms = useCallback(async () => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            const response = await axios.get(
                getApiUrl('/faculty/classrooms'),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                const classroomsWithAssignmentsCount = await Promise.all(
                    response.data.classrooms.map(async (classroom) => {
                        const assignmentsResponse = await axios.get(
                            getApiUrl(`/faculty/classrooms/${classroom._id}/assignments`),
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    'X-Session-ID': sessionId
                                }
                            }
                        );

                        return {
                            ...classroom,
                            assignmentsCount: assignmentsResponse.data.assignments.length
                        };
                    })
                );

                setClassrooms(classroomsWithAssignmentsCount);
            }
        } catch (error) {
            console.error('Error fetching classrooms:', error);
            setError(error.response?.data?.message || 'Failed to fetch classrooms');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClassrooms();
    }, [fetchClassrooms]);

    useEffect(() => {
        if (selectedClassroom) {
            const timer = setTimeout(async () => {
                if (selectedClassroom) {
                    await fetchClassrooms();
                }
            }, 1000); // Reduced timeout for faster refresh

            return () => clearTimeout(timer);
        }
    }, [updateTrigger, selectedClassroom]);

    // Add this useEffect to handle assignment updates
    useEffect(() => {
        const refreshAssignments = async () => {
            if (selectedClassroom && showSubmissions) {
                const updatedAssignments = await fetchAssignments(selectedClassroom._id);
                if (selectedAssignment) {
                    const updatedAssignment = updatedAssignments?.find(
                        a => a._id === selectedAssignment._id
                    );
                    if (updatedAssignment) {
                        setSelectedAssignment(updatedAssignment);
                    }
                }
            }
        };

        refreshAssignments();
    }, [updateTrigger]);

    // Then you could use this in useEffect to validate URLs for displayed submissions
    useEffect(() => {
        if (activeView === 'submissions' && selectedAssignment?.submissions?.length > 0) {
            // Validate submission URLs
            const validateUrls = async () => {
                const validationResults = {};
                
                for (const submission of selectedAssignment.submissions) {
                    if (submission.submissionUrl) {
                        validationResults[submission._id] = await checkUrlExists(submission.submissionUrl);
                    }
                }
                
                setUrlValidationResults(validationResults);
            };
            
            validateUrls();
        }
    }, [activeView, selectedAssignment]);

    // Add this useEffect to handle browser history
    useEffect(() => {
        // When a classroom is selected, push that state to browser history
        if (selectedClassroom) {
            // Use navigate instead of history.push
            navigate(location.pathname, {
                state: { 
                    view: 'classroom', 
                    classroomId: selectedClassroom._id,
                    activeView: activeView
                }
            });
        }
    }, [selectedClassroom, activeView, navigate, location.pathname]);
    
    // Add this useEffect to handle browser navigation events
    useEffect(() => {
        // Handle popstate event (back/forward button)
        const handlePopState = (event) => {
            const state = event.state?.state;
            
            // If we have state and it indicates we were viewing a classroom
            if (state && state.view === 'classroom') {
                // Find the classroom by ID
                const classroom = classrooms.find(c => c._id === state.classroomId);
                
                // If found, set it as selected
                if (classroom) {
                    setSelectedClassroom(classroom);
                    setActiveView(state.activeView || 'assignments');
                    fetchAssignments(classroom._id);
                }
            } else {
                // If no classroom in state, go back to list view
                setSelectedClassroom(null);
                setShowSubmissions(false);
                setSelectedAssignment(null);
                setAssignments([]);
                setActiveView('assignments');
            }
        };
        
        // Add event listener
        window.addEventListener('popstate', handlePopState);
        
        // Cleanup
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [classrooms]);

    // Modify handleCreateClassroom
    const handleCreateClassroom = async (formData) => {
        try {
            setLoading(true);
            
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            // Process student emails properly
            const studentEmails = typeof formData.studentEmails === 'string' 
                ? formData.studentEmails.split(',').map(email => email.trim()).filter(email => email)
                : Array.isArray(formData.studentEmails) 
                    ? formData.studentEmails 
                    : [];

            const response = await axios.post(
                getApiUrl('/faculty/classrooms'), 
                {
                    name: formData.name,
                    subject: formData.subject,
                    description: formData.description,
                    studentEmails: studentEmails
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                // Add the new classroom to our state
                const newClassroom = {
                    ...response.data.classroom,
                    students: [],
                    assignmentsCount: 0
                };
                setClassrooms(prevClassrooms => [...prevClassrooms, newClassroom]);
                
                setSuccess('Classroom created successfully');
                setShowCreateModal(false);
                
                // Refresh data
                triggerUpdate();
            }
        } catch (error) {
            console.error('Error creating classroom:', error);
            setError(error.response?.data?.message || 'Failed to create classroom');
        } finally {
            setLoading(false);
        }
    };

    // Modify handleUpdateClassroom
    const handleUpdateClassroom = async (updatedData) => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            const response = await axios.put(
                getApiUrl(`/faculty/classrooms/${selectedClassroom._id}`),
                updatedData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                // Show success notification
                setSuccess('Classroom updated successfully');
                setShowEditModal(false);
                
                // Update local state immediately
                setClassrooms(prevClassrooms => 
                    prevClassrooms.map(classroom => 
                        classroom._id === selectedClassroom._id 
                            ? { ...classroom, ...updatedData }
                            : classroom
                    )
                );
                
                // Update selected classroom if viewing it
                if (selectedClassroom) {
                    setSelectedClassroom(prev => ({
                        ...prev,
                        ...updatedData
                    }));
                }
                
                // Trigger background refresh
                triggerUpdate();
                
                // Fetch fresh data after a short delay
                setTimeout(async () => {
                    await fetchClassrooms();
                }, 1000);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update classroom');
        }
    };

    // Modify handleDeleteClassroom
    const handleDeleteClassroom = async (classroomId) => {
        if (window.confirm('Are you sure you want to delete this classroom?')) {
            try {
                const sessionId = sessionStorage.getItem('sessionId');
                const token = sessionStorage.getItem(`token_${sessionId}`);

                const response = await axios.delete(
                    getApiUrl(`/faculty/classrooms/${classroomId}`),
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'X-Session-ID': sessionId
                        }
                    }
                );

                if (response.data.success) {
                    // Show success notification
                    setSuccess('Classroom deleted successfully');
                    
                    // Update local state immediately
                    setClassrooms(prevClassrooms => 
                        prevClassrooms.filter(classroom => classroom._id !== classroomId)
                    );
                    
                    // If viewing the deleted classroom, go back to list
                    if (selectedClassroom?._id === classroomId) {
                        setSelectedClassroom(null);
                    }
                    
                    // Trigger background refresh
                    triggerUpdate();
                    
                    // Fetch fresh data after a short delay
                    setTimeout(async () => {
                        await fetchClassrooms();
                    }, 1000);
                }
            } catch (error) {
                setError(error.response?.data?.message || 'Failed to delete classroom');
            }
        }
    };

    const handleRemoveStudent = async (classroomId, studentId) => {
        if (window.confirm('Are you sure you want to remove this student?')) {
            try {
                const sessionId = sessionStorage.getItem('sessionId');
                const token = sessionStorage.getItem(`token_${sessionId}`);

                const response = await axios.delete(
                    getApiUrl(`/faculty/classrooms/${classroomId}/students/${studentId}`),
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-Session-ID': sessionId
                        }
                    }
                );

                if (response.data.success) {
                    setSuccess('Student removed successfully');
                    // Update the local state immediately
                    setSelectedClassroom(prevClassroom => ({
                        ...prevClassroom,
                        students: prevClassroom.students.filter(student => student._id !== studentId)
                    }));
                    // Trigger global update
                    triggerUpdate();
                    // Force refresh classroom data
                    setTimeout(async () => {
                        await fetchClassrooms();
                        if (selectedClassroom) {
                            const updatedClassroomResponse = await axios.get(
                                getApiUrl(`/faculty/classrooms/${classroomId}`),
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'X-Session-ID': sessionId
                                    }
                                }
                            );
                            if (updatedClassroomResponse.data.success) {
                                setSelectedClassroom(updatedClassroomResponse.data.classroom);
                            }
                        }
                    }, 1000);
                }
            } catch (error) {
                setError(error.response?.data?.message || 'Failed to remove student');
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            setError('Logout failed');
        }
    };

    const fetchAssignments = async (classroomId) => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);
    
            const response = await axios.get(
                getApiUrl(`/faculty/classrooms/${classroomId}/assignments`),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                setAssignments(response.data.assignments);
                return response.data.assignments;
            }

            // Add this right after you fetch assignments in fetchAssignments function
            console.log('Assignments with submissions:', response.data.assignments);

            // For a specific student, check how submissions are stored
            const testStudent = selectedClassroom.students[0];
            if (testStudent) {
                console.log('Test student:', testStudent);
                assignments.forEach(assignment => {
                    const matchingSubmissions = assignment.submissions?.filter(
                        sub => {
                            // Log the details to see structure
                            console.log('Checking submission:', {
                                submissionId: sub._id,
                                submissionStudentId: sub.studentId,
                                submissionStudent: sub.student,
                                testStudentId: testStudent._id
                            });
                            
                            return (sub.studentId === testStudent._id) || 
                                   (sub.student && sub.student._id === testStudent._id) ||
                                   (sub.student && sub.student.email === testStudent.email);
                        }
                    );
                    console.log(`Assignment ${assignment.title} - matching submissions:`, matchingSubmissions);
                });
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch assignments');
        }
    };

    const handleCreateAssignment = async (formData) => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            // Upload file first if it exists
            if (formData.get('assignmentFile')) {
                const fileFormData = new FormData();
                fileFormData.append('file', formData.get('assignmentFile'));

                const uploadResponse = await axios.post(
                    getApiUrl('/faculty/upload'),
                    fileFormData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-Session-ID': sessionId,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (uploadResponse.data.success) {
                    formData.set('assignmentFile', uploadResponse.data.fileUrl);
                }
            }

            const response = await axios.post(
                getApiUrl(`/faculty/classrooms/${selectedClassroom._id}/assignments`),
                {
                    title: formData.get('title'),
                    description: formData.get('description'),
                    dueDate: formData.get('dueDate'),
                    maxMarks: formData.get('maxMarks'),
                    assignmentFile: formData.get('assignmentFile')
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                setSuccess('Assignment created successfully');
                setShowAssignmentModal(false);
                await fetchAssignments(selectedClassroom._id);
                triggerUpdate();
            }
        } catch (error) {
            console.error('Assignment creation error:', error);
            setError(error.response?.data?.message || 'Failed to create assignment');
            throw error;
        }
    };

    // Add this function after handleCreateAssignment
    const handleDeleteAssignment = async (assignmentId) => {
        if (window.confirm('Are you sure you want to delete this assignment?')) {
            try {
                const sessionId = sessionStorage.getItem('sessionId');
                const token = sessionStorage.getItem(`token_${sessionId}`);

                const response = await axios.delete(
                    getApiUrl(`/faculty/assignments/${assignmentId}`),
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'X-Session-ID': sessionId
                        }
                    }
                );

                if (response.data.success) {
                    setSuccess('Assignment deleted successfully');
                    await fetchAssignments(selectedClassroom._id);
                    triggerUpdate();
                }
            } catch (error) {
                setError(error.response?.data?.message || 'Failed to delete assignment');
            }
        }
    };

    // Modify the handleGradeSubmission function
    const handleGradeSubmission = async (gradeData) => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            const response = await axios.put(
                getApiUrl(`/faculty/assignments/${selectedAssignment._id}/submissions/${selectedSubmission._id}/grade`),
                {
                    grade: parseInt(gradeData.grade),
                    feedback: gradeData.feedback || ''
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                // Show success notification
                setSuccess('Submission graded successfully');
                
                // Close the modal
                setShowGradeModal(false);
                setSelectedSubmission(null);
                
                // Immediately update the UI
                setAssignments(prevAssignments => 
                    prevAssignments.map(assignment => {
                        if (assignment._id === selectedAssignment._id) {
                            const updatedSubmissions = assignment.submissions.map(sub => {
                                if (sub._id === selectedSubmission._id) {
                                    return {
                                        ...sub,
                                        grade: parseInt(gradeData.grade),
                                        feedback: gradeData.feedback,
                                        status: 'graded' // Update the status
                                    };
                                }
                                return sub;
                            });
                            return { ...assignment, submissions: updatedSubmissions };
                        }
                        return assignment;
                    })
                );

                // Update selected assignment if in submission view
                if (showSubmissions && selectedAssignment) {
                    setSelectedAssignment(prev => ({
                        ...prev,
                        submissions: prev.submissions.map(sub => {
                            if (sub._id === selectedSubmission._id) {
                                return {
                                    ...sub,
                                    grade: parseInt(gradeData.grade),
                                    feedback: gradeData.feedback,
                                    status: 'graded'
                                };
                            }
                            return sub;
                        })
                    }));
                }

                // Trigger background refresh
                triggerUpdate();

                // Fetch fresh data after a short delay
                setTimeout(async () => {
                    await fetchAssignments(selectedClassroom._id);
                }, 1000);
            }
        } catch (error) {
            console.error('Error grading submission:', error);
            setError(error.response?.data?.message || 'Failed to grade submission');
        }
    };

    const handleEditAssignment = async (formData) => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            // First handle file upload if there's a new file
            let assignmentFileUrl = editingAssignment.assignmentFile;
            if (formData.get('assignmentFile')) {
                const fileFormData = new FormData();
                fileFormData.append('file', formData.get('assignmentFile'));

                const uploadResponse = await axios.post(
                    getApiUrl('/faculty/upload'),
                    fileFormData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-Session-ID': sessionId,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (uploadResponse.data.success) {
                    assignmentFileUrl = uploadResponse.data.fileUrl;
                }
            }

            // Now update the assignment
            const response = await axios.put(
                getApiUrl(`/faculty/assignments/${editingAssignment._id}`),
                {
                    title: formData.get('title'),
                    description: formData.get('description'),
                    dueDate: formData.get('dueDate'),
                    maxMarks: formData.get('maxMarks'),
                    assignmentFile: assignmentFileUrl
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                setSuccess('Assignment updated successfully');
                setShowEditAssignmentModal(false);
                setEditingAssignment(null);
                await fetchAssignments(selectedClassroom._id);
                triggerUpdate();
            }
        } catch (error) {
            console.error('Error updating assignment:', error);
            setError(error.response?.data?.message || 'Failed to update assignment');
        }
    };

    const handleEditClick = (classroom, e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedClassroom(classroom); // Need this for updating
        setFormData({
            name: classroom.name || '',
            subject: classroom.subject || '',
            description: classroom.description || '',
            studentEmails: classroom.students?.map(student => student.email).join(', ') || ''
        });
        setShowEditModal(true);
    };

    const handleClassroomClick = (classroom) => {
        setSelectedClassroom(classroom);
        setActiveView('assignments');
        fetchAssignments(classroom._id);
    };

    // Add this function to handle auto-grade review
    const handleReviewAutoGrade = async (assignmentId, submissionId, currentGrade) => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            // Update the grade if faculty wants to modify it
            const response = await axios.put(
                getApiUrl(`/faculty/assignments/${assignmentId}/submissions/${submissionId}/grade`),
                {
                    grade: parseInt(currentGrade),
                    feedback: gradeModalData?.feedback || 'Reviewed auto-graded submission',
                    isReviewed: true
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                setSuccess('Grade reviewed successfully');
                setShowGradeModal(false);
                setGradeModalData(null);
                triggerUpdate();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to review grade');
        }
    };

    const [isProcessing, setIsProcessing] = useState(false);

const handleAutoGrade = async (assignmentId, submissionId) => {
    try {
        setIsProcessing(true); // Set loading state to true before processing
        const sessionId = sessionStorage.getItem('sessionId');
        const token = sessionStorage.getItem(`token_${sessionId}`);

        setAutoGradingStatus(prev => ({ ...prev, [submissionId]: 'processing' }));

        const response = await axios.post(
            getApiUrl(`/faculty/assignments/${assignmentId}/submissions/${submissionId}/autograde`),
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Session-ID': sessionId
                }
            }
        );

        if (response.data.success) {
            setSuccess('Assignment auto-graded successfully');
            triggerUpdate();
        }
    } catch (error) {
        setError(error.response?.data?.message || 'Failed to auto-grade assignment');
    } finally {
        setIsProcessing(false); // Reset loading state
        setAutoGradingStatus(prev => ({ ...prev, [submissionId]: 'completed' }));
    }
};

    // Add this function to your component to handle batch grading

const handleBatchAutoGrade = async () => {
    // Get all ungraded submissions
    const ungradedSubmissions = selectedAssignment.submissions.filter(
        sub => sub.grade === undefined || sub.grade === null
    );
    
    if (ungradedSubmissions.length === 0) {
        setSuccess("All submissions are already graded!");
        return;
    }
    
    // Create a copy of the current status
    const newStatus = { ...autoGradingStatus };
    
    // Set loading state
    setLoading(true);
    
    // Show starting notification
    setSuccess(`Started grading ${ungradedSubmissions.length} submissions...`);
    
    let completedCount = 0;
    
    // Process each submission sequentially
    for (const submission of ungradedSubmissions) {
        try {
            // Update status for this submission
            newStatus[submission._id] = 'processing';
            setAutoGradingStatus({ ...newStatus });
            
            // Get auth credentials
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);
            
            // Call the API to grade this submission
            const response = await axios.post(
                getApiUrl(`/faculty/assignments/${selectedAssignment._id}/submissions/${submission._id}/autograde`),
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );
            
            if (response.data.success) {
                // Update submission with grade
                completedCount++;
                
                // Update the status
                newStatus[submission._id] = 'completed';
                setAutoGradingStatus({ ...newStatus });
                
                // Update progress notification every few submissions
                if (completedCount % 3 === 0 || completedCount === ungradedSubmissions.length) {
                    setSuccess(`Progress: ${completedCount}/${ungradedSubmissions.length} submissions graded`);
                }
                
                // Update the assignments state with new grade
                setAssignments(prevAssignments => 
                    prevAssignments.map(assignment => {
                        if (assignment._id === selectedAssignment._id) {
                            const updatedSubmissions = assignment.submissions.map(sub => {
                                if (sub._id === submission._id) {
                                    return {
                                        ...sub,
                                        grade: parseInt(response.data.grade),
                                        feedback: response.data.feedback,
                                        isAutoGraded: true,
                                        status: 'graded'
                                    };
                                }
                                return sub;
                            });
                            return { ...assignment, submissions: updatedSubmissions };
                        }
                        return assignment;
                    })
                );
                
                // Update selected assignment if we're viewing it
                if (selectedAssignment) {
                    setSelectedAssignment(prev => ({
                        ...prev,
                        submissions: prev.submissions.map(sub => {
                            if (sub._id === submission._id) {
                                return {
                                    ...sub,
                                    grade: parseInt(response.data.grade),
                                    feedback: response.data.feedback,
                                    isAutoGraded: true,
                                    status: 'graded'
                                };
                            }
                            return sub;
                        })
                    }));
                }
            }
        } catch (error) {
            console.error(`Error grading submission ${submission._id}:`, error);
            newStatus[submission._id] = 'error';
            setAutoGradingStatus({ ...newStatus });
        }
    }
    
    // All done
    setLoading(false);
    setSuccess(`Successfully graded ${completedCount} out of ${ungradedSubmissions.length} submissions!`);
    triggerUpdate(); // Refresh data
};

    // Update the submissions table rendering
    const renderSubmissionsTable = () => {
        return (
            <div className="table-responsive mt-4">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Submitted On</th>
                            <th>Status</th>
                            <th>Grade</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedAssignment.submissions.map((submission) => (
                            <tr key={submission._id}>
                                <td>{submission.student.name}</td>
                                <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                                <td>
                                    <span className={`badge ${
                                        submission.isAutoGraded 
                                            ? 'bg-info' 
                                            : submission.grade 
                                                ? 'bg-success' 
                                                : 'bg-warning'
                                    }`}>
                                        {submission.isAutoGraded 
                                            ? 'Auto-graded' 
                                            : submission.grade 
                                                ? 'Manually Graded' 
                                                : 'Pending'
                                        }
                                    </span>
                                </td>
                                <td>
                                    {submission.grade !== undefined ? (
                                        <div>
                                            {submission.grade} / {selectedAssignment.maxMarks}
                                            {submission.feedback && (
                                                <small className="text-muted d-block">
                                                    Feedback: {submission.feedback}
                                                </small>
                                            )}
                                        </div>
                                    ) : (
                                        '--'
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div className="d-flex flex-wrap" style={{ gap: '8px' }}>
                                        {/* View submission button - Add URL validation */}
                                        {submission.submissionUrl && submission.submissionUrl.trim() !== '' && (
                                            <a 
                                                href={getBaseUrl(submission.submissionUrl)}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={(e) => {
                                                    // Add validation before opening
                                                    const url = getBaseUrl(submission.submissionUrl);
                                                    if (!url) {
                                                        e.preventDefault();
                                                        setError('Invalid submission URL');
                                                        return;
                                                    }
                                                }}
                                            >
                                                <i className="fas fa-external-link-alt me-1"></i> View
                                            </a>
                                        )}
                                        
                                        {/* AI Grade button - Fixed condition to check if grade is null or undefined */}
                                        {(submission.grade === null || submission.grade === undefined) && (
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => handleAutoGrade(selectedAssignment._id, submission._id)}
                                                disabled={autoGradingStatus[submission._id] === 'processing'}
                                                title="Grade using AI"
                                            >
                                                <i className="fas fa-robot me-1"></i>
                                                {autoGradingStatus[submission._id] === 'processing' ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                        Grading...
                                                    </>
                                                ) : (
                                                    'AI Grade'
                                                )}
                                            </button>
                                        )}
                                        
                                        {/* Manual Grade button - Keep as is */}
                                        <button 
                                            className="btn btn-sm btn-outline-primary submission-action-btn"
                                            onClick={() => {
                                                setSelectedSubmission(submission);
                                                setShowGradeModal(true);
                                            }}
                                        >
                                            <i className={submission.grade !== undefined ? "fas fa-edit" : "fas fa-check"}></i>
                                            <span>{submission.grade !== undefined ? 'Update' : 'Grade'}</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Update the grade modal component
    const renderGradeModal = () => {
        if (!showGradeModal || !selectedSubmission) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {selectedSubmission.isReviewed ? 'Update Grade' : 'Review Auto-graded Submission'}
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => {
                                setShowGradeModal(false);
                                setGradeModalData(null);
                            }}
                        />
                    </div>
                    <div className="modal-body">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleReviewAutoGrade(
                                selectedAssignment._id,
                                selectedSubmission._id,
                                gradeModalData.grade
                            );
                        }}>
                            <div className="mb-3">
                                <label className="form-label">Grade (out of {selectedAssignment.maxMarks})</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={gradeModalData?.grade || ''}
                                    onChange={(e) => setGradeModalData(prev => ({
                                        ...prev,
                                        grade: e.target.value
                                    }))}
                                    min="0"
                                    max={selectedAssignment.maxMarks}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Feedback</label>
                                <textarea
                                    className="form-control"
                                    value={gradeModalData?.feedback || ''}
                                    onChange={(e) => setGradeModalData(prev => ({
                                        ...prev,
                                        feedback: e.target.value
                                    }))}
                                    rows="3"
                                />
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => {
                                        setShowGradeModal(false);
                                        setGradeModalData(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-color"
                                >
                                    {selectedSubmission.isReviewed ? 'Update' : 'Confirm Grade'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const [isWebsiteLoading, setIsWebsiteLoading] = useState(true);

    // Add this useEffect at the top level of your component
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsWebsiteLoading(false);
        }, 1500); // Adjust time as needed
    
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="relative">
            {isWebsiteLoading && (
                <div className="website-loading-overlay" style={{background: "linear-gradient(135deg, #1a1f2c 0%, #2d3748 100%)"}}>
                    <div className="loading-content" style={{background: 'rgba(26, 31, 44, 0.8)'}}>
                        <div className="loading-spinner">
                            <i className="fas fa-graduation-cap"></i>
                        </div>
                        <h1 className="loading-text" style={{color: 'rgb(99, 102, 241)'}}>Loading Your Dashboard</h1>
                        <p className="loading-subtext">Please wait while we set things up...</p>
                    </div>
                </div>
            )}
            
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner">
                            <i className="fas fa-robot fa-spin"></i>
                        </div>
                        <h4>AI is evaluating...</h4>
                        <p className="text-muted">Please wait while we process the submission</p>
                    </div>
                </div>
            )}
            
            <div className="min-vh-100 bg-indigo">
                <Header 
                    userName={userName}
                    onLogout={handleLogout}
                />
                
                <div className="container-fluid pt-4 " style={{ 
                    marginTop: '70px', 
                    paddingLeft: '5px',
                    paddingRight: '5px',
                    maxWidth: '98%',
                    margin: '70px auto 0'
                }}>
                    {error && <Notification type="error" message={error} onClose={() => setError('')} />}
                    {success && <Notification type="success" message={success} onClose={() => setSuccess('')} />}

                    {/* Welcome Section */}
                    <div 
    className="card mb-4"
    style={{
        borderRadius: '16px',
        border: 'none',
        background: 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
        overflow: 'hidden'
    }}
>
    <div 
        className="card-body d-flex justify-content-between align-items-center p-4"
        style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        {/* Background pattern overlay */}
        <div 
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.1,
                backgroundImage: 'radial-gradient(circle, #ffffff 10%, transparent 10.5%), radial-gradient(circle, #ffffff 10%, transparent 10.5%)',
                backgroundSize: '30px 30px',
                backgroundPosition: '0 0, 15px 15px'
            }}
        ></div>
        
        <div style={{ position: 'relative', zIndex: 5 }}>
            <h2 className="mb-1" style={{ color: 'white', fontWeight: '600' }}>
                Welcome back, {userName}
            </h2>
            <p className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {classrooms.length} Active {classrooms.length === 1 ? 'Classroom' : 'Classrooms'}
            </p>
        </div>
        
        <button
            onClick={() => setShowCreateModal(true)}
            className="btn px-4 py-2"
            style={{
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#6366f1',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                zIndex: 5,
                transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            }}
        >
            <i className="fas fa-plus me-2"></i> Create Classroom
        </button>
    </div>
</div>

                    {!selectedClassroom ? (
                        // Classroom Cards Grid - Modern redesign with FontAwesome icons
                        <div className="classrooms-grid">
    {classrooms.map((classroom, index) => (
        <div 
            key={classroom._id} 
            className="card classroom-card shadow-sm"
            onClick={() => handleClassroomClick(classroom)}
            style={{
                cursor: 'pointer',
                borderRadius: '12px',
                border: 'none',
                overflow: 'hidden'
            }}
        >
            {/* Card Header with colored background and actions */}
            <div 
                className="card-header py-3 border-0 d-flex justify-content-between align-items-center"
                style={{
                    backgroundColor: getBackgroundColor(index),
                    color: 'white',
                    borderRadius: '12px 12px 0 0',
                    position: 'relative'
                }}
            >
                {/* Left side - Icon and Title */}
                <div className="d-flex align-items-center">
                    <div 
                        className="d-flex justify-content-center align-items-center me-2"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <i className="fas fa-graduation-cap"></i>
                    </div>
                    <h5 className="card-title text-white fw-bold mb-0" style={{ 
                        fontSize: '1.1rem',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }}>
                        {classroom.name}
                    </h5>
                </div>

                {/* Right side - Action Buttons */}
                <div className="d-flex" style={{ gap: '8px' }}>
                    <button 
                        className="btn btn-sm p-1"
                        style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            border: 'none'
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClick(classroom, e);
                        }}
                        title="Edit classroom"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    <button 
                        className="btn btn-sm p-1"
                        style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            border: 'none'
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClassroom(classroom._id);
                        }}
                        title="Delete classroom"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            
            {/* Card Body */}
            <div className="card-body p-3" style={{background: '#edf2f7'}}>
                {/* Code and Subject row */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    {/* Room Code */}
                    <div className="d-flex align-items-center">
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            backgroundColor: '#f0f9ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            marginRight: '8px'
                        }}>
                            <i className="fas fa-key" style={{ color: '#0ea5e9' }}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Room Code</div>
                            <div className="fw-bold" style={{ color: '#111827' }}>
                                {classroom.roomCode}
                            </div>
                        </div>
                    </div>
                    
                    {/* Subject */}
                    <div className="d-flex align-items-center">
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            backgroundColor: '#f0fdf4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            marginRight: '8px'
                        }}>
                            <i className="fas fa-book" style={{ color: '#6366f1' }}></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Subject</div>
                            <div className="fw-bold" style={{ color: '#111827' }}>
                                {classroom.subject}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Description */}
                <div className="classroom-description mb-3" style={{ 
                    height: '44px', 
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <p className="card-text text-muted" style={{
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: '2',
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.5',
                        margin: 0
                    }}>
                        {classroom.description || 'No description available for this classroom.'}
                    </p>
                </div>
                
                {/* Metrics Sections */}
                <div className="mt-auto">
                    <div className="row g-2 row-cols-2">
                        {/* Students Metric */}
                        <div className="col">
                            <div className="p-2 rounded-3 metric-tile" style={{ backgroundColor: '#f9fafb' }}>
                                <div className="d-flex align-items-center">
                                    <div style={{ 
                                        width: '36px', 
                                        height: '36px', 
                                        backgroundColor: '#f0f9ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '8px',
                                        marginRight: '12px'
                                    }}>
                                        <i className="fas fa-users" style={{ color: '#0ea5e9' }}></i>
                                    </div>
                                    <div>
                                        <div className="h5 m-0" style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                                            {classroom.students?.length || 0}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Students</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Assignments Metric */}
                        <div className="col">
                            <div className="p-2 rounded-3 metric-tile" style={{ backgroundColor: '#f9fafb' }}>
                                <div className="d-flex align-items-center">
                                    <div style={{ 
                                        width: '36px', 
                                        height: '36px', 
                                        backgroundColor: '#f0fdf4',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '8px',
                                        marginRight: '12px'
                                    }}>
                                        <i className="fas fa-clipboard-list" style={{ color: '#6366f1' }}></i>
                                    </div>
                                    <div>
                                        <div className="h5 m-0" style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                                            {classroom.assignmentsCount || 0}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Assignments</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Card Footer with creation date */}
            <div className="card-footer p-3 border-0" style={{ 
                borderRadius: '0 0 12px 12px',
                borderTop: '1px solid #f3f4f6',
                backgroundColor: '#edf2f7'
            }}>
                <div className="d-flex align-items-center">
                    <i className="fas fa-calendar-alt me-2" style={{ color: '#9ca3af', fontSize: '0.875rem' }}></i>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Created on {new Date(classroom.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>
        </div>
    ))}
</div>

                    ) : (
                        // Assignments View
                        <div className="card shadow-sm" style={{background: '#edf2f7'}}>
                            <div className="card-body">
                                <div className="classroom-header">
  <div className="header-main">
    <div className="header-title">
      <div 
        className="classroom-icon"
        style={{
          backgroundColor: getAssignmentColor(selectedClassroom.name.charAt(0).toUpperCase()),
          color: 'white'
        }}
      >
        <i className="fas fa-graduation-cap"></i>
      </div>
      <div>
        <h4 className="mb-0">{selectedClassroom.name}</h4>
        <span className="badge bg-light text-dark border">
          {selectedClassroom.subject}
        </span>
      </div>
    </div>

    <div className="header-actions">
      <div className="stats-badge">
        <i className="fas fa-clipboard-list me-2"></i>
        {assignments.length} Total Assignments
      </div>
      <div className="stats-badge">
        <i className="fas fa-user-graduate me-2"></i>
        {selectedClassroom.students?.length || 0} Students
      </div>
    </div>

    <div className="toggle-buttons">
  <button
    className={`btn ${activeView === 'assignments' ? 'btn-color' : 'btn-light'}`}
    onClick={() => setActiveView('assignments')}
    title="Assignments"
  >
    <i className="fas fa-tasks"></i>
    <span>Assignments</span>
  </button>
  <button
    className={`btn ${activeView === 'students' ? 'btn-color' : 'btn-light'}`}
    onClick={() => setActiveView('students')}
    title="Students"
  >
    <i className="fas fa-users"></i>
    <span>Students</span>
  </button>
</div>

  </div>
</div>

                                {/* Content Area */}
                                {activeView === 'assignments' && selectedClassroom && (
    <div className="assignments-section mt-4">
        <div className="card border-0 shadow-sm">
            <div className="card-header section-header">
  <div className="section-title">
    <i className="fas fa-clipboard-list"></i>
    <h5 className="mb-0">Assignments</h5>
  </div>
  <div className="section-actions">
    <button 
      className="btn btn-color btn-sm d-flex align-items-center gap-2"
      onClick={() => setShowAssignmentModal(true)}
    >
      <i className="fas fa-plus"></i>
      <span>Assignment</span>
    </button>
  </div>
</div>

            
            <div className="card-body p-0">
                {assignments.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover assignment-table mb-0">
                            <thead style={{ backgroundColor: '#f9fafb' }}>
                                <tr>
                                    <th style={{ width: '30%', padding: '12px 16px' }}>Assignment</th>
                                    <th style={{ width: '15%', padding: '12px 16px' }}>Due Date</th>
                                    <th style={{ width: '15%', padding: '12px 16px' }}>Status</th>
                                    <th style={{ width: '15%', padding: '12px 16px' }}>Submissions</th>
                                    <th style={{ width: '25%', padding: '12px 16px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(assignment => {
                                    // Get color based on first letter
                                    const assignmentFirstLetter = assignment.title.charAt(0).toUpperCase();
                                    const assignmentColor = getAssignmentColor(assignmentFirstLetter);
                                    
                                    // Format submission stats
                                    const totalStudents = selectedClassroom.students?.length || 0;
                                    const submissionCount = assignment.submissions?.length || 0;
                                    const submissionRate = totalStudents === 0 
                                        ? 0 
                                        : Math.round((submissionCount / totalStudents) * 100);
                                    
                                    // Calculate time remaining
                                    const timeRemaining = getFormattedTimeRemaining(assignment.dueDate);
                                    const timeClass = getTimeRemainingClass(assignment.dueDate);
                                    
                                    return (
                                        <tr key={assignment._id} className="align-middle">
                                            {/* Assignment Title Cell */}
                                            <td style={{ padding: '16px' }} data-label="Assignment">
                                                <div className="d-flex align-items-center">
                                                    <div 
                                                        className="d-flex justify-content-center align-items-center me-3"
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '8px',
                                                            backgroundColor: `${assignmentColor}20`,
                                                            color: assignmentColor
                                                        }}
                                                    >
                                                        <i className="fas fa-file-alt"></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0 fw-bold" style={{ color: '#111827' }}>
                                                            {assignment.title}
                                                        </h6>
                                                        <small className="text-muted d-block text-truncate" style={{ maxWidth: '250px' }}>
                                                            {assignment.description.substring(0, 60)}
                                                            {assignment.description.length > 60 ? '...' : ''}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {/* Due Date Cell */}
                                            <td style={{ padding: '16px' }} data-label="Due Date">
                                                <div className={`d-flex flex-column ${timeClass}`}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: '500'}}>
                                                        {new Date(assignment.dueDate).toLocaleDateString()}
                                                    </span>
                                                    <small className={`${timeClass}`}>
                                                        {timeRemaining}
                                                    </small>
                                                </div>
                                            </td>
                                            
                                            {/* Status Cell */}
                                            <td style={{ padding: '16px' }} data-label="Status">
                                                {new Date(assignment.dueDate) < new Date() ? (
                                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                                                        <i className="fas fa-clock me-1"></i> Closed
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                                        <i className="fas fa-check-circle me-1"></i> Active
                                                    </span>
                                                )}
                                            </td>
                                            
                                            {/* Submissions Cell */}
                                            <td style={{ padding: '16px' }} data-label="Submissions">
                                                <div className="d-flex align-items-center">
                                                    <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                                        <div 
                                                            className="progress-bar" 
                                                            role="progressbar"
                                                            style={{
                                                                width: `${submissionRate}%`,
                                                                backgroundColor: submissionRate >= 70 ? '#6366f1' : 
                                                                                 submissionRate >= 30 ? '#f59e0b' : '#ef4444'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                                        {submissionCount} / {totalStudents}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Actions Cell */}
                                            <td style={{ padding: '16px' }} data-label="Actions">
                                                <div className="d-flex" style={{ gap: '8px' }}>
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowSubmissions(true);
                                                            setSelectedAssignment(assignment);
                                                            setActiveView('submissions');
                                                        }}
                                                        title="View submissions"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                        <span>Submissions</span>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingAssignment(assignment);
                                                            setShowEditAssignmentModal(true);
                                                        }}
                                                        title="Edit assignment"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                        <span>Edit</span>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAssignment(assignment._id);
                                                        }}
                                                        title="Delete assignment"
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-5">
                        <div style={{ color: '#9ca3af', marginBottom: '16px' }}>
                            <i className="fas fa-clipboard fa-3x"></i>
                        </div>
                        <h5 style={{ color: '#4b5563', fontWeight: '500' }}>No assignments yet</h5>
                        <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 16px' }}>
                            Create your first assignment for this classroom to get started.
                        </p>
                        <button 
                            className="btn btn-color"
                            onClick={() => setShowAssignmentModal(true)}
                        >
                            <i className="fas fa-plus me-2"></i> Create Assignment
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
)}
                                {/* Submissions View */}
                                {activeView === 'submissions' && showSubmissions && selectedAssignment && (
                                    <div className="card border-0 shadow-sm mt-4">
                                        <div className="card-header bg-white p-0">
                                            <div className="submission-header">
    {/* Top Section */}
    <div className="submission-header-top">
        <button 
            className="back-btn"
            onClick={() => {
                setActiveView('assignments');
                setShowSubmissions(false);
            }}
        >
            <i className="fas fa-arrow-left"></i>
        </button>
        <div className="submission-title">
            <i className="fas fa-file-alt" 
               style={{ color: getAssignmentColor(selectedAssignment.title.charAt(0).toUpperCase()) }}
            />
            <h5 className="mb-0">{selectedAssignment.title}</h5>
        </div>
    </div>

    {/* Bottom Section */}
    <div className="submission-header-bottom">
        <div className="submission-count">
            <i className="fas fa-file-alt"></i>
            <span>{selectedAssignment.submissions?.length || 0} Total Submissions</span>
        </div>
        
        <div className="submission-actions">
            <button 
                className="action-btn export-btn"
                onClick={exportSubmissionsToExcel}
                disabled={loading}
            >
                <i className="fas fa-file-excel"></i>
                <span>Export</span>
            </button>
            
            {selectedAssignment.submissions?.some(sub => sub.grade === undefined || sub.grade === null) && (
                <button 
                    className="action-btn grade-btn"
                    onClick={handleBatchAutoGrade}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm" />
                            <span>Grading</span>
                        </>
                    ) : (
                        <>
                            <i className="fas fa-robot"></i>
                            <span>Auto Grade</span>
                        </>
                    )}
                </button>
            )}
        </div>
    </div>
</div>

                                        </div>
                                        <div className="card-body p-0">
                                            {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-hover assignment-table mb-0">
                                                        <thead style={{ backgroundColor: '#f9fafb' }}>
                                                            <tr>
                                                                <th style={{ width: '25%', padding: '12px 16px' }}>Student</th>
                                                                <th style={{ width: '15%', padding: '12px 16px' }}>Submitted On</th>
                                                                <th style={{ width: '10%', padding: '12px 16px' }}>Status</th>
                                                                <th style={{ width: '12%', padding: '12px 16px' }}>Grade</th>
                                                                <th style={{ width: '15%', padding: '12px 16px' }}>Feedback</th>
                                                                <th style={{ width: '23%', padding: '12px 16px' }}>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedAssignment.submissions.map(submission => {
                                                                // Find student info - handle different data structures
                                                                const student = submission.student || 
                                                                    selectedClassroom.students?.find(s => s._id === submission.studentId) || 
                                                                    { name: 'Unknown Student' };
                                                                
                                                                // Determine submission status and class
                                                                const isLate = new Date(submission.submittedAt) > new Date(selectedAssignment.dueDate);
                                                                const statusClass = submission.grade !== undefined 
                                                                    ? 'bg-success-subtle text-success border-success-subtle'
                                                                    : isLate 
                                                                        ? 'bg-warning-subtle text-warning border-warning-subtle'
                                                                        : 'bg-info-subtle text-info border-info-subtle';
                                                                
                                                                const statusText = submission.grade !== undefined 
                                                                    ? 'Graded'
                                                                    : isLate 
                                                                        ? 'Late'
                                                                        : 'Submitted';
                                                                
                                                                const statusIcon = submission.grade !== undefined 
                                                                    ? 'fa-check-circle'
                                                                    : isLate 
                                                                        ? 'fa-clock'
                                                                        : 'fa-paper-plane';
                                                                
                                                                return (
                                                                    <tr key={submission._id} className="align-middle">
                                                                        {/* Student Name Cell */}
                                                                        <td style={{ padding: '16px' }}>
                                                                            <div className="d-flex align-items-center">
                                                                                <div 
                                                                                    className="d-flex justify-content-center align-items-center me-3"
                                                                                    style={{
                                                                                        width: '40px',
                                                                                        height: '40px',
                                                                                        borderRadius: '50%',
                                                                                        backgroundColor: '#f3f4f6',
                                                                                        color: '#4b5563',
                                                                                        fontWeight: '600'
                                                                                    }}
                                                                                >
                                                                                    {getInitials(student.name)}
                                                                                </div>
                                                                                <div>
                                                                                    <h6 className="mb-0 fw-bold" style={{ color: '#111827' }}>
                                                                                        {student.name}
                                                                                    </h6>
                                                                                    <small className="text-muted d-block">
                                                                                        {student.email || ''}
                                                                                    </small>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        
                                                                        {/* Submission Date Cell */}
                                                                        <td style={{ padding: '16px' }}>
                                                                            <div>
                                                                                <span style={{ fontSize: '0.875rem' }}>
                                                                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                                                                </span>
                                                                                <small className="text-muted d-block">
                                                                                    {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </small>
                                                                            </div>
                                                                        </td>
                                                                        
                                                                        {/* Status Cell */}
                                                                        <td style={{ padding: '16px' }}>
                                                                            <span className={`badge ${statusClass} px-2 py-1`}>
                                                                                <i className={`fas ${statusIcon} me-1`}></i> {statusText}
                                                                            </span>
                                                                        </td>
                                                                        
                                                                        {/* Grade Cell */}
                                                                        <td style={{ padding: '16px' }}>
                                                                            {submission.grade !== undefined ? (
                                                                                <div className="d-flex align-items-center">
                                                                                    <span className="fw-bold me-1">{submission.grade}</span>
                                                                                    <span className="text-muted">/ {selectedAssignment.maxMarks}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-muted">Not graded</span>
                                                                            )}
                                                                        </td>
                                                                        
                                                                        {/* NEW: Feedback Column */}
                                                                        <td style={{ padding: '16px' }}>
                                                                            {submission.feedback ? (
                                                                                <button 
                                                                                    className="btn btn-sm btn-outline-info" 
                                                                                    onClick={() => {
                                                                                        // Show feedback in a modal popup
                                                                                        setSelectedSubmission(submission);
                                                                                        document.getElementById(`feedback-popup-${submission._id}`).style.display = 'block';
                                                                                    }}
                                                                                >
                                                                                    <i className="fas fa-comment-dots me-2"></i>
                                                                                    View Feedback
                                                                                </button>
                                                                            ) : (
                                                                                <span className="text-muted fst-italic">No feedback</span>
                                                                            )}
                                                                            
                                                                            {/* Feedback Popup Modal - Hidden by default */}
                                                                            <div 
                                                                                id={`feedback-popup-${submission._id}`}
                                                                                className="feedback-popup" 
                                                                                style={{
                                                                                    display: 'none',
                                                                                    position: 'fixed',
                                                                                    top: '50%',
                                                                                    left: '50%',
                                                                                    transform: 'translate(-50%, -50%)',
                                                                                    backgroundColor: '#fff',
                                                                                    borderRadius: '12px',
                                                                                    padding: '25px',
                                                                                    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.2)',
                                                                                    zIndex: 1000,
                                                                                    maxWidth: '500px',
                                                                                    width: '90%'
                                                                                }}
                                                                            >
                                                                                <div className="d-flex justify-content-between align-items-start mb-4">
                                                                                    <h5 className="mb-0 d-flex align-items-center">
                                                                                        <i className="fas fa-comment-alt me-2" style={{ color: '#6366f1' }}></i>
                                                                                        Feedback for {student.name}
                                                                                    </h5>
                                                                                    <button 
                                                                                        className="btn btn-sm btn-light rounded-circle" 
                                                                                        style={{ width: '30px', height: '30px', padding: '0' }}
                                                                                        onClick={() => document.getElementById(`feedback-popup-${submission._id}`).style.display = 'none'}
                                                                                    >
                                                                                        <i className="fas fa-times"></i>
                                                                                    </button>
                                                                                </div>
                                                                                <div style={{ 
                                                                                    backgroundColor: '#f9fafb', 
                                                                                    borderRadius: '8px',
                                                                                    padding: '16px',
                                                                                    border: '1px solid #e5e7eb'
                                                                                }}>
                                                                                    <div className="mb-3 d-flex align-items-center">
                                                                                        <div 
                                                                                            style={{
                                                                                                width: '40px',
                                                                                                height: '40px',
                                                                                                borderRadius: '50%',
                                                                                                backgroundColor: '#6366f1',
                                                                                                color: '#fff',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                marginRight: '12px'
                                                                                            }}
                                                                                        >
                                                                                            <i className="fas fa-user-tie"></i>
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>From Faculty</div>
                                                                                            <div className="fw-bold">{userName}</div>
                                                                                        </div>
                                                                                        <div className="ms-auto">
                                                                                            <span className="badge" style={{backgroundColor: '#6366f1'}}>
                                                                                                Grade: {submission.grade}/{selectedAssignment.maxMarks}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div style={{ 
                                                                                        backgroundColor: '#fff',
                                                                                        borderRadius: '8px',
                                                                                        padding: '16px',
                                                                                        border: '1px solid #e5e7eb',
                                                                                        minHeight: '100px',
                                                                                        whiteSpace: 'pre-wrap'
                                                                                    }}>
                                                                                        {submission.feedback}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mt-4 d-flex justify-content-end">
                                                                                    <button 
                                                                                        className="btn btn-color"
                                                                                        onClick={() => {
                                                                                            // Hide feedback popup
                                                                                            document.getElementById(`feedback-popup-${submission._id}`).style.display = 'none';
                                                                                            
                                                                                            // Show grade modal for editing
                                                                                            setGradeModalData({
                                                                                                grade: submission.grade || '',
                                                                                                feedback: submission.feedback || ''
                                                                                            });
                                                                                            setShowGradeModal(true);
                                                                                        }}
                                                                                    >
                                                                                        <i className="fas fa-edit me-2"></i>
                                                                                        Edit Feedback
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Overlay for popup */}
                                                                            <div 
                                                                                id={`feedback-overlay-${submission._id}`}
                                                                                className="feedback-overlay" 
                                                                                style={{
                                                                                    display: 'none',
                                                                                    position: 'fixed',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    right: 0,
                                                                                    bottom: 0,
                                                                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                                                                    zIndex: 999
                                                                                }}
                                                                                onClick={() => {
                                                                                    document.getElementById(`feedback-popup-${submission._id}`).style.display = 'none';
                                                                                    document.getElementById(`feedback-overlay-${submission._id}`).style.display = 'none';
                                                                                }}
                                                                            ></div>
                                                                        </td>
                                                                        
                                                                        {/* Actions Column in Submissions Table */}
                                                                        <td style={{ padding: '16px' }}>
                                                                            <div className="submission-actions-container">
                                                                                {/* View submission button */}
                                                                                {submission.submissionUrl && submission.submissionUrl.trim() !== '' && (
                                                                                    <a 
                                                                                        href={getBaseUrl(submission.submissionUrl)}
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer"
                                                                                        className="btn btn-sm btn-outline-secondary submission-action-btn"
                                                                                        onClick={(e) => {
                                                                                            // Add validation before opening
                                                                                            const url = getBaseUrl(submission.submissionUrl);
                                                                                            if (!url) {
                                                                                                e.preventDefault();
                                                                                                setError('Invalid submission URL');
                                                                                                return;
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <i className="fas fa-external-link-alt"></i>
                                                                                        <span>View</span>
                                                                                    </a>
                                                                                )}
                                                                                
                                                                                {/* AI Grade button */}
                                                                                {(submission.grade === null || submission.grade === undefined) && (
                                                                                    <button
                                                                                        className="btn btn-sm btn-outline-info submission-action-btn"
                                                                                        onClick={() => handleAutoGrade(selectedAssignment._id, submission._id)}
                                                                                        disabled={autoGradingStatus[submission._id] === 'processing'}
                                                                                    >
                                                                                        <i className="fas fa-robot"></i>
                                                                                        <span>AI Grade</span>
                                                                                    </button>
                                                                                )}
                                                                                
                                                                                {/* Manual Grade button */}
                                                                                <button 
                                                                                    className="btn btn-sm btn-outline-primary submission-action-btn"
                                                                                    onClick={() => {
                                                                                        setSelectedSubmission(submission);
                                                                                        setShowGradeModal(true);
                                                                                    }}
                                                                                >
                                                                                    <i className={submission.grade !== undefined ? "fas fa-edit" : "fas fa-check"}></i>
                                                                                    <span>{submission.grade !== undefined ? 'Update' : 'Grade'}</span>
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-5">
                                                    <div style={{ color: '#9ca3af', marginBottom: '16px' }}>
                                                        <i className="fas fa-file-upload fa-3x"></i>
                                                    </div>
                                                    <h5 style={{ color: '#4b5563', fontWeight: '500' }}>No submissions yet</h5>
                                                    <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>
                                                        Students haven't submitted any work for this assignment yet.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeView === 'students' && (
    <div className="students-section mt-4">
        <div className="card border-0 shadow-sm">
            <div className="card-header section-header">
  <div className="section-title">
    <i className="fas fa-users" style={{color: "#343a40"}}></i>
    <h5 className="mb-0">Students</h5>
  </div>
  <div className="section-actions">
    <button
      className="btn btn-color btn-sm d-flex align-items-center gap-2"
      onClick={() => {
        setFormData({
          ...selectedClassroom,
          studentEmails: '',
          isAddingStudentsOnly: true
        });
        setShowEditModal(true);
      }}
    >
      <i className="fas fa-user-plus"></i>
      <span>Students</span>
    </button>
  </div>
</div>

            <div className="card-body p-0">
                {selectedClassroom.students?.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead style={{ backgroundColor: '#f9fafb' }}>
                                <tr>
                                    <th style={{ width: '5%', padding: '16px' }}>#</th>
                                    <th style={{ width: '10%', padding: '16px' }}>Avatar</th>
                                    <th style={{ width: '20%', padding: '16px' }}>Student</th>
                                    <th style={{ width: '20%', padding: '16px' }}>Email</th>
                                    <th style={{ width: '15%', padding: '16px' }}>Submissions</th>
                                    <th style={{ width: '15%', padding: '16px' }}>Average Grade</th>
                                    <th style={{ width: '15%', padding: '16px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedClassroom.students.map((student, index) => {
    // Calculate student stats
    let submissionCount = 0;
    let completedAssignments = 0;
    let totalGrade = 0;
    
    // Loop through all assignments to find this student's submissions
    assignments.forEach(assignment => {
        const studentSubmission = assignment.submissions?.find(
            sub => 
                (sub.studentId === student._id) || 
                (sub.student && sub.student._id === student._id) ||
                (sub.student && sub.student.email === student.email)
        );
        
        if (studentSubmission) {
            submissionCount++;
            if (studentSubmission.grade !== undefined && studentSubmission.grade !== null) {
                completedAssignments++;
                totalGrade += parseInt(studentSubmission.grade);
            }
        }
    });
    
    // Calculate average grade
    const averageGrade = completedAssignments > 0 
        ? (totalGrade / completedAssignments).toFixed(1) 
        : 'N/A';
    
    // Calculate progress percentage
    const progressPercentage = assignments.length > 0 
        ? Math.round((submissionCount / assignments.length) * 100) 
        : 0;
    
    // Determine progress color
    const progressColor = 
        progressPercentage >= 75 ? '#6366f1' : 
        progressPercentage >= 50 ? '#0ea5e9' : 
        progressPercentage >= 25 ? '#f59e0b' : 
        '#ef4444';

                                    return (
                                        <tr key={student._id} className="align-middle">
                                            <td style={{ padding: '16px' }}>{index + 1}</td>
                                            <td style={{ padding: '16px' }}>
                                                <div 
                                                    className="d-flex justify-content-center align-items-center"
                                                    style={{
                                                        width: '45px',
                                                        height: '45px',
                                                        borderRadius: '50%',
                                                        backgroundColor: getAssignmentColor(student.name.charAt(0).toUpperCase()),
                                                        color: '#fff',
                                                        fontWeight: '600',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    {getInitials(student.name)}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div>
                                                    <h6 className="mb-0 fw-bold" style={{ color: '#111827' }}>
                                                        {student.name}
                                                    </h6>
                                                    <small className="text-muted d-block">
                                                        Joined {formatDate(student.createdAt || new Date())}
                                                    </small>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div className="d-flex align-items-center">
                                                    <i className="fas fa-envelope text-muted me-2"></i>
                                                    <span style={{ fontSize: '0.9rem' }}>{student.email}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <small>{submissionCount} / {assignments.length}</small>
                                                        <small className="fw-bold">{progressPercentage}%</small>
                                                    </div>
                                                    <div className="progress" style={{ height: '6px' }}>
                                                        <div 
                                                            className="progress-bar" 
                                                            style={{ 
                                                                width: `${progressPercentage}%`,
                                                                backgroundColor: progressColor 
                                                            }}
                                                            role="progressbar" 
                                                            aria-valuenow={progressPercentage}
                                                            aria-valuemin="0" 
                                                            aria-valuemax="100"
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {averageGrade !== 'N/A' ? (
                                                    <div className="d-flex align-items-center">
                                                        <div 
                                                            className="me-2 d-flex justify-content-center align-items-center" 
                                                            style={{
                                                                width: '38px',
                                                                height: '38px',
                                                                borderRadius: '50%',
                                                                backgroundColor: parseFloat(averageGrade) >= 70 ? '#d1fae5' : 
                                                                                parseFloat(averageGrade) >= 50 ? '#fef3c7' : 
                                                                                '#fee2e2',
                                                                color: parseFloat(averageGrade) >= 70 ? '#6366f1' : 
                                                                        parseFloat(averageGrade) >= 50 ? '#f59e0b' : 
                                                                        '#ef4444'
                                                            }}
                                                        >
                                                            <span className="fw-bold">{averageGrade}</span>
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                            {completedAssignments} graded<br />assignments
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">No grades yet</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div className="d-flex" style={{ gap: '8px' }}>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => {
                                                            // Filter assignments for this student
                                                            const studentSubmissions = assignments.map(assignment => {
                                                                const submission = assignment.submissions?.find(
                                                                    sub => sub.studentId === student._id
                                                                );
                                                                return {
                                                                    assignment,
                                                                    submission
                                                                };
                                                            });
                                                            
                                                            // Set state for showing student details/progress
                                                            // You'll need to add this functionality
                                                            alert(`Student progress view for ${student.name} coming soon!`);
                                                        }}
                                                        title="View student progress"
                                                    >
                                                        <i className="fas fa-chart-line"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleRemoveStudent(selectedClassroom._id, student._id)}
                                                        title="Remove student"
                                                    >
                                                        <i className="fas fa-user-minus"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-5">
                        <div style={{ color: '#9ca3af', marginBottom: '16px' }}>
                            <i className="fas fa-user-graduate fa-3x"></i>
                        </div>
                        <h5 style={{ color: '#4b5563', fontWeight: '500' }}>No students enrolled yet</h5>
                        <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 16px' }}>
                            Add students to your classroom by inviting them via email or sharing the class code.
                        </p>
                        <div className="d-flex justify-content-center">
                            <button 
                                className="btn btn-color me-2"
                                onClick={() => {
                                    setFormData({
                                        ...formData,
                                        studentEmails: ''
                                    });
                                    setShowEditModal(true);
                                }}
                            >
                                <i className="fas fa-user-plus me-2"></i> Add Students
                            </button>
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    // Copy class code to clipboard
                                    navigator.clipboard.writeText(selectedClassroom.roomCode);
                                    setSuccess('Class code copied to clipboard!');
                                }}
                            >
                                <i className="fas fa-copy me-2"></i> Copy Class Code
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <CreateClassroomModal
                            onClose={() => setShowCreateModal(false)}
                            onSubmit={handleCreateClassroom}
                        />
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <CreateClassroomModal
                            isEdit={true}
                            initialData={formData}
                            onClose={() => {
                                setShowEditModal(false);
                                setFormData({ name: '', subject: '', description: '', studentEmails: [] });
                            }}
                            onSubmit={handleUpdateClassroom}
                        />
                    </div>
                </div>
            )}

            {showAssignmentModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <AssignmentModal
                            onClose={() => setShowAssignmentModal(false)}
                            onSubmit={handleCreateAssignment}
                            classroomId={selectedClassroom?._id}
                        />
                    </div>
                </div>
            )}

            {showGradeModal && selectedAssignment && selectedSubmission && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <GradeSubmissionModal
                            assignment={selectedAssignment}
                            submission={{
                                ...selectedSubmission,
                                grade: gradeModalData?.grade || selectedSubmission.grade,
                                feedback: gradeModalData?.feedback || selectedSubmission.feedback
                            }}
                            onClose={() => {
                                setShowGradeModal(false);
                                setSelectedSubmission(null);
                                setGradeModalData(null);  // Reset modal data
                            }}
                            onSubmit={handleGradeSubmission}
                        />
                    </div>
                </div>
            )}

            {showEditAssignmentModal && editingAssignment && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <AssignmentModal
                            isEdit={true}
                            initialData={editingAssignment}
                            onClose={() => {
                                setShowEditAssignmentModal(false);
                                setEditingAssignment(null);
                            }}
                            onSubmit={handleEditAssignment}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default FacultyDashboard;