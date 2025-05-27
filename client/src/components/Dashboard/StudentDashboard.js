// Updated StudentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import Notification from '../Notification';
import StudentAssignmentView from '../Assignment/StudentAssignmentView';
import AssignmentSubmissionModal from '../Assignment/AssignmentSubmissionModal';
import JoinClassroomModal from '../Classroom/JoinClassroomModal';
import Header from '../header/Header';
import { useUpdate } from '../../context/UpdateContext';
import { getApiUrl, getBaseUrl } from '../../config/api.config';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const [enrolledClassrooms, setEnrolledClassrooms] = useState([]);
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmissionView, setShowSubmissionView] = useState(false);
    const { userName, logout, userRole } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateTrigger, triggerUpdate } = useUpdate();

    // Add state for assignment counts
    const [assignmentCounts, setAssignmentCounts] = useState({});

    // Add these state variables at the top with other states
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    const [isWebsiteLoading, setIsWebsiteLoading] = useState(true);

    // Fetch assignment counts for each classroom
    const fetchAssignmentCount = async (classroomId) => {
        try {
            const response = await axios.get(`/api/classrooms/${classroomId}/assignments/count`);
            setAssignmentCounts(prev => ({
                ...prev,
                [classroomId]: response.data.count
            }));
        } catch (error) {
            console.error('Error fetching assignment count:', error);
        }
    };

    // Handle classroom exit
    const handleExitClassroom = async (classroomId, e) => {
        e.stopPropagation(); // Prevent card click event
        
        if (window.confirm('Are you sure you want to exit this classroom?')) {
            try {
                const sessionId = sessionStorage.getItem('sessionId');
                const token = sessionStorage.getItem(`token_${sessionId}`);

                const response = await axios.post(
                    getApiUrl(`/student/classrooms/${classroomId}/exit`),
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'X-Session-ID': sessionId
                        }
                    }
                );

                if (response.data.success) {
                    setEnrolledClassrooms(prev => 
                        prev.filter(classroom => classroom._id !== classroomId)
                    );
                    setSuccess('Successfully exited the classroom');
                    setSelectedClassroom(null);
                    triggerUpdate();
                }
            } catch (error) {
                setError(error.response?.data?.message || 'Failed to exit classroom');
            }
        }
    };

    // Wrap fetchEnrolledClassrooms in useCallback
    const fetchEnrolledClassrooms = useCallback(async () => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            const response = await axios.get(getApiUrl('/student/classrooms/enrolled'), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Session-ID': sessionId
                }
            });

            if (response.data.success) {
                setEnrolledClassrooms(response.data.classrooms);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch classrooms');
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (userRole !== 'Student') {
                    navigate('/login');
                    return;
                }
                await fetchEnrolledClassrooms();
            } catch (error) {
                console.error('Auth check failed:', error);
                navigate('/login');
            }
        };
        
        checkAuth();
    }, [userRole, navigate, fetchEnrolledClassrooms]);

    useEffect(() => {
        if (updateTrigger > 0) {
            const timer = setTimeout(async () => {
                await fetchEnrolledClassrooms();
                if (selectedClassroom) {
                    await fetchAssignments(selectedClassroom._id);
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [updateTrigger, selectedClassroom, fetchEnrolledClassrooms]);

    const fetchAssignments = async (classroomId) => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            const response = await axios.get(
                getApiUrl(`/student/classrooms/${classroomId}/assignments`),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                setAssignments(response.data.assignments.map(assignment => ({
                    ...assignment,
                    maxMarks: assignment.maxMarks || 0,
                    submission: assignment.submission || null
                })));
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch assignments');
        }
    };

    const handleSubmitAssignment = (assignment) => {
        setSelectedAssignment(assignment);
        setShowSubmissionModal(true);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            setError('Logout failed');
        }
    };

    const handleJoinClassroom = async (roomCode) => {
        try {
            const sessionId = sessionStorage.getItem('sessionId');
            const token = sessionStorage.getItem(`token_${sessionId}`);

            const response = await axios.post(
                getApiUrl('/student/classrooms/join'),
                { roomCode },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    }
                }
            );

            if (response.data.success) {
                setSuccess('Successfully joined classroom');
                await fetchEnrolledClassrooms();
                setShowJoinModal(false);
                triggerUpdate();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to join classroom');
        }
    };

    // Add this function with your other handlers
    const handleViewSubmission = (assignment) => {
        try {
            // First check if submission exists and has a URL
            if (assignment.submission?.submissionUrl) {
                const submissionUrl = getBaseUrl(assignment.submission.submissionUrl);
                window.open(submissionUrl, '_blank');
            } else {
                setError('No submission file available');
            }
        } catch (error) {
            console.error('Error viewing submission:', error);
            setError('Failed to open submission file');
        }
    };

    // Add this handler function
    const handleShowFeedback = (assignment) => {
        setSelectedFeedback({
            title: assignment.title,
            feedback: assignment.submission.feedback,
            grade: assignment.submission.grade,
            maxMarks: assignment.maxMarks
        });
        setShowFeedbackModal(true);
    };

    // Add this useEffect to handle URL parameters
    useEffect(() => {
        const modal = searchParams.get('modal');
        const assignmentId = searchParams.get('assignmentId');

        if (modal === 'submit' && assignmentId) {
            // Find the assignment from your assignments array
            const assignment = assignments.find(a => a._id === assignmentId);
            if (assignment) {
                setSelectedAssignment(assignment);
                setShowSubmissionView(true);
            }
        }
    }, [searchParams, assignments]);

    // Add this effect to fetch assignment counts when classrooms load
    useEffect(() => {
        const fetchAllAssignmentCounts = async () => {
            try {
                const sessionId = sessionStorage.getItem('sessionId');
                const token = sessionStorage.getItem(`token_${sessionId}`);

                // Fetch counts for all enrolled classrooms
                const countPromises = enrolledClassrooms.map(classroom => 
                    axios.get(
                        getApiUrl(`/student/classrooms/${classroom._id}/assignments`), // Updated endpoint
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'X-Session-ID': sessionId
                            }
                        }
                    )
                );

                const responses = await Promise.all(countPromises);
                const newCounts = {};
                
                enrolledClassrooms.forEach((classroom, index) => {
                    // Get the length of assignments array from response
                    newCounts[classroom._id] = responses[index].data.assignments?.length || 0;
                });

                setAssignmentCounts(newCounts);
            } catch (error) {
                console.error('Error fetching assignment counts:', error);
            }
        };

        if (enrolledClassrooms.length > 0) {
            fetchAllAssignmentCounts();
        }
    }, [enrolledClassrooms]);

    // Modify your modal close handler
    const handleCloseModal = () => {
        setShowSubmissionModal(false);
        setSelectedAssignment(null);
        setSearchParams({});
    };

    // Replace the problematic useEffect
    useEffect(() => {
        const fetchAssignmentData = async () => {
            try {
                const sessionId = sessionStorage.getItem('sessionId');
                const token = sessionStorage.getItem(`token_${sessionId}`);

                if (selectedClassroom) {
                    const response = await axios.get(
                        getApiUrl(`/student/classrooms/${selectedClassroom._id}/assignments`),
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'X-Session-ID': sessionId
                            }
                        }
                    );

                    console.log("Assignments data:", response.data);
                    if (response.data.assignments) {
                        response.data.assignments.forEach(assignment => {
                            console.log("Assignment file:", assignment.assignmentFile);
                        });
                        setAssignments(response.data.assignments);
                    }
                }
            } catch (error) {
                console.error("Error fetching assignments:", error);
                setError('Failed to fetch assignments');
            }
        };

        fetchAssignmentData();
    }, [selectedClassroom]);

    // Add this effect to validate assignment files
    useEffect(() => {
        const validateFiles = async () => {
            const validatedAssignments = await Promise.all(
                assignments.map(async (assignment) => {
                    if (assignment.assignmentFile) {
                        const exists = await checkFileExists(assignment.assignmentFile);
                        console.log(`File ${assignment.assignmentFile} exists:`, exists);
                    }
                    return assignment;
                })
            );
            console.log("Validated assignments:", validatedAssignments);
        };

        if (assignments.length > 0) {
            validateFiles();
        }
    }, [assignments]);

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
                        <h2 className="loading-text" style={{color: 'rgb(99, 102, 241)'}}>Loading Your Dashboard</h2>
                        <p className="loading-subtext">Please wait while we set things up...</p>
                    </div>
                </div>
            )}
            
            <div className="min-vh-100 bg-indigo">
                <Header />
                
                <div className="container-fluid pt-4" style={{ 
    marginTop: '70px', 
    paddingLeft: '5px',    // Reduced from 10px
    paddingRight: '5px',   // Reduced from 10px
    maxWidth: '98%',       // This will create some margin on both sides
    margin: '70px auto 0'  // Centers the container and maintains top margin
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
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
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
        {/* Background Pattern */}
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
        
        {/* Welcome Text */}
        <div style={{ position: 'relative', zIndex: 5 }}>
            <h2 className="mb-1" style={{ color: 'white', fontWeight: '600' }}>
                Welcome back, {userName}
            </h2>
            <p className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {enrolledClassrooms.length} Active {enrolledClassrooms.length === 1 ? 'Classroom' : 'Classrooms'}
            </p>
        </div>
        
        {/* Join Button */}
        <button
            onClick={() => setShowJoinModal(true)}
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
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            }}
        >
            <i className="fas fa-plus me-2"></i> Join Classroom
        </button>
    </div>
</div>

                    {!selectedClassroom ? (
                        <div className="classrooms-grid">
                            {enrolledClassrooms.map((classroom, index) => (
                                <div 
                                    key={classroom._id} 
                                    className="card classroom-card shadow-sm"
                                    onClick={() => {
                                        setSelectedClassroom(classroom);
                                        fetchAssignments(classroom._id);
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        border: 'none',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div 
                                        className="card-header py-3 border-0 d-flex justify-content-between align-items-center"
                                        style={{
                                            backgroundColor: getBackgroundColor(index),
                                            color: 'white',
                                            borderRadius: '12px 12px 0 0',
                                            position: 'relative'
                                        }}
                                    >
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
                                            onClick={(e) => handleExitClassroom(classroom._id, e)}
                                            title="Exit classroom"
                                        >
                                            <i className="fas fa-sign-out-alt"></i>
                                        </button>
                                    </div>

                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
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

                                        {/* Updated metrics section */}
                                        <div className="mt-auto">
                                            <div className="row g-2 row-cols-2">
                                                {/* Students Count */}
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

                                                {/* Assignments Count */}
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
                                                                    {assignmentCounts[classroom._id] || 0}
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Assignments</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-footer bg-white p-3 border-0" style={{ 
                                        borderRadius: '0 0 12px 12px',
                                        borderTop: '1px solid #f3f4f6'
                                    }}>
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-calendar-alt me-2" style={{ color: '#9ca3af', fontSize: '0.875rem' }}></i>
                                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                Joined on {new Date(classroom.createdAt).toLocaleDateString('en-US', { 
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
                        // Modern Assignments View with Cards
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
        className="btn btn-color"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        <i className="fas fa-tasks me-2"></i>
        Assignments
      </button>
    </div>
  </div>
</div>

                                {/* Assignments Section */}
<div className="assignments-section mt-4">
    <div className="card border-0 shadow-sm">
        <div className="card-header section-header">
            <div className="section-title">
                <i className="fas fa-clipboard-list"></i>
                <h5 className="mb-0">Assignments</h5>
            </div>
        </div>
        
        <div className="card-body p-0">
            {assignments.length > 0 ? (
                <div className="table-responsive">
    <table className="table table-hover assignment-table mb-0">
        <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
                <th style={{ width: '25%' }}>Assignment</th>
                <th style={{ width: '15%' }} className="d-none d-md-table-cell">Due Date</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '10%' }} className="d-none d-md-table-cell">Grade</th>
                <th style={{ width: '13%' }} className="d-none d-md-table-cell">Reference</th>
                <th style={{ width: '13%' }} className="d-none d-md-table-cell">Feedback</th>
                <th style={{ width: '12%' }}>Actions</th>
            </tr>
        </thead>
        <tbody>
            {assignments.map(assignment => (
                <tr key={assignment._id}>
                    <td data-label="Assignment">
                        <div className="d-flex align-items-center gap-2">
                            <div className="assignment-icon" 
                                style={{ backgroundColor: getAssignmentColor(assignment.title[0]) }}>
                                <i className="fas fa-file-alt"></i>
                            </div>
                            <div className="assignment-info">
                                <div className="fw-semibold">{assignment.title}</div>
                                <small className="text-muted d-md-none">
                                    Due: {formatDate(assignment.dueDate)}
                                </small>
                            </div>
                        </div>
                    </td>

                    <td data-label="Due Date" className="d-none d-md-table-cell">
                        {formatDate(assignment.dueDate)}
                        <div className="small text-muted">
                            {getFormattedTimeRemaining(assignment.dueDate)}
                        </div>
                    </td>

                    <td data-label="Status">
                        <span className={`status-badge ${getStatusClass(assignment)}`}>
                            {getStatusText(assignment)}
                        </span>
                    </td>

                    <td data-label="Grade" className="d-none d-md-table-cell">
                        {assignment.submission?.grade !== undefined ? (
                            <span className="text-success fw-semibold">
                                {assignment.submission.grade}/{assignment.maxMarks}
                            </span>
                        ) : (
                            <span className="text-muted">--/{assignment.maxMarks}</span>
                        )}
                    </td>

                    {/* Reference Column */}
<td data-label="Reference" className="d-none d-md-table-cell text-center">
    {assignment.assignmentFile ? (
        <button 
            className="btn btn-sm btn-outline-secondary icon-button"
            onClick={() => window.open(getBaseUrl(assignment.assignmentFile), '_blank')}
            title="View Reference Document"
        >
            <i className="fas fa-file-pdf me-2"></i>
            Ref. Doc.
        </button>
    ) : (
        <button 
            className="btn btn-sm btn-outline-secondary icon-button"
            disabled
        >
            <i className="fas fa-file-pdf me-2"></i>
            No Doc
        </button>
    )}
</td>

{/* Feedback Column */}
<td data-label="Feedback" className="d-none d-md-table-cell text-center">
    {assignment.submission?.feedback ? (
        <button 
            className="btn btn-sm btn-outline-info icon-button"
            onClick={() => handleShowFeedback(assignment)}
            title="View Feedback"
        >
            <i className="fas fa-comment-alt me-2"></i>
            Feedback
        </button>
    ) : (
        <button 
            className="btn btn-sm btn-outline-secondary icon-button"
            disabled
        >
            <i className="fas fa-comment-alt me-2"></i>
            Feedback
        </button>
    )}
</td>

{/* Add view submission button */}
<td data-label="Actions" className="text-center">
    <div className="action-buttons">
        {assignment.submission ? (
            <button 
                className="btn btn-sm btn-outline-primary w-100"
                onClick={() => handleViewSubmission(assignment)}
                title="View Submitted Document"
            >
                <i className="fas fa-eye"></i>
                <span className="d-none d-md-inline ms-1">
                    View Submission
                </span>
            </button>
        ) : (
            <button
                className="btn btn-sm btn-color w-100"
                onClick={() => handleSubmitAssignment(assignment)}
                disabled={isAssignmentOverdue(assignment.dueDate)}
            >
                <i className="fas fa-upload"></i>
                <span className="d-none d-md-inline ms-1">Submit</span>
            </button>
        )}
    </div>
</td>

                </tr>
            ))}
        </tbody>
    </table>
</div>
            ) : (
                <div className="text-center py-5">
                    <div style={{ color: '#9ca3af', marginBottom: '16px' }}>
                        <i className="fas fa-clipboard fa-3x"></i>
                    </div>
                    <h5 style={{ color: '#4b5563', fontWeight: '500' }}>No assignments yet</h5>
                    <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>
                        There are no assignments posted in this classroom yet.
                    </p>
                </div>
            )}
        </div>
    </div>
</div>

                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Move modals here and update styling */}
            {showJoinModal && (
                <div className="modal-overlay">
                   
                        <JoinClassroomModal
                            onClose={() => setShowJoinModal(false)}
                            onSubmit={handleJoinClassroom}
                        />
                  
                </div>
            )}

            {showSubmissionModal && selectedAssignment && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <AssignmentSubmissionModal
                            assignment={selectedAssignment}
                            onClose={() => {
                                setShowSubmissionModal(false);
                                setSelectedAssignment(null);
                            }}
                            onSubmit={handleSubmitAssignment}
                        />
                    </div>
                </div>
            )}

            {/* Add this modal component before the closing div of your return statement */}
            {showFeedbackModal && selectedFeedback && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="card border-0 shadow-none">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <i className="fas fa-comment-alt me-2 text-info"></i>
                                    Assignment Feedback
                                </h5>
                                <button 
                                    className="btn btn-icon btn-sm btn-light"
                                    onClick={() => {
                                        setShowFeedbackModal(false);
                                        setSelectedFeedback(null);
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="card-body">
                                <h6 className="mb-3">{selectedFeedback.title}</h6>
                                <div className="mb-3">
                                    <span className="badge bg-success">
                                        Grade: {selectedFeedback.grade}/{selectedFeedback.maxMarks}
                                    </span>
                                </div>
                                <div className="feedback-content p-3 bg-light rounded">
                                    {selectedFeedback.feedback}
                                </div>
                            </div>
                            <div className="card-footer bg-white border-0">
                                <button 
                                    className="btn btn-secondary w-100"
                                    onClick={() => {
                                        setShowFeedbackModal(false);
                                        setSelectedFeedback(null);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function for background colors
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

// Add this helper function at the top of your file or with other helper functions
const isAssignmentOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
};

// Helper functions
const getAssignmentColor = (letter) => {
    const colors = {
        'A': '#FF6B6B', 'B': '#4ECDC4', 'C': '#45B7D1',
        'D': '#96CEB4', 'E': '#4A90E2', 'F': '#9B59B6',
        'G': '#3498DB', 'H': '#1ABC9C', 'I': '#F1C40F',
        'J': '#E74C3C', 'K': '#2ECC71', 'L': '#34495E',
        'M': '#16A085', 'N': '#27AE60', 'O': '#2980B9',
        'P': '#8E44AD', 'Q': '#2C3E50', 'R': '#F39C12',
        'S': '#D35400', 'T': '#C0392B', 'U': '#7F8C8D',
        'V': '#BDC3C7', 'W': '#95A5A6', 'X': '#6C7A89',
        'Y': '#D24D57', 'Z': '#674172'
    };
    return colors[letter.toUpperCase()] || '#4361ee';
};

const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        pdf: 'file-pdf',
        doc: 'file-word',
        docx: 'file-word',
        xls: 'file-excel',
        xlsx: 'file-excel',
        ppt: 'file-ppt',
        pptx: 'file-ppt',
        jpg: 'file-image',
        jpeg: 'file-image',
        png: 'file-image',
        txt: 'file-text',
        zip: 'file-zip'
    };
    return icons[ext] || 'file-earmark';
};

const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) return 'Past due';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    return 'Due soon';
};

// Add these helper functions
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
    
    if (now > due) return 'Past due';
    
    const diffTime = Math.abs(due - now);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    }
    if (diffHours > 0) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    }
    return 'Due soon';
};

const getStatusClass = (assignment) => {
    if (assignment.submission) return 'status-submitted';
    if (isAssignmentOverdue(assignment.dueDate)) return 'status-overdue';
    return 'status-pending';
};

const getStatusText = (assignment) => {
    if (assignment.submission) return 'Submitted';
    if (isAssignmentOverdue(assignment.dueDate)) return 'Overdue';
    return 'Pending';
};

const checkFileExists = async (url) => {
    try {
        const response = await fetch(getBaseUrl(url), { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error("Error checking file:", error);
        return false;
    }
};

export default StudentDashboard;
