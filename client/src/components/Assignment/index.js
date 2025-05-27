// import React from 'react';
// import { useAuth } from '../../context/AuthContext';
// import FacultyAssignmentList from './FacultyAssignmentList';
// import StudentAssignmentList from './StudentAssignmentList';
// import { Navigate } from 'react-router-dom';

// const AssignmentPage = () => {
//     const { isAuthenticated, userRole } = useAuth();

//     if (!isAuthenticated) {
//         return <Navigate to="/login" />;
//     }

//     if (userRole === 'Faculty') {
//         return <FacultyAssignmentList />;
//     } else if (userRole === 'Student') {
//         return <StudentAssignmentList />;
//     }

//     return <div>Unauthorized Access</div>;
// };

// export default AssignmentPage; 