// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import axios from 'axios';
// import { useAuth } from '../../context/AuthContext';

// const StudentAssignmentList = () => {
//     const { userRole, userName } = useAuth();
//     const { id } = useParams();
//     const [assignments, setAssignments] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [submissionFile, setSubmissionFile] = useState(null);
//     const [submissionStatus, setSubmissionStatus] = useState({});
//     const [successMessage, setSuccessMessage] = useState('');

//     useEffect(() => {
//         fetchAssignments();
//     }, [id]);

//     const fetchAssignments = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await axios.get(`http://localhost:9000/api/assignments/classroom/${id}`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });
//             setAssignments(response.data.assignments);
//             setLoading(false);
//         } catch (error) {
//             console.error('Fetch assignments error:', error);
//             setError(error.response?.data?.message || 'Failed to fetch assignments');
//             setLoading(false);
//         }
//     };

//     const handleSubmitAssignment = async (assignmentId) => {
//         try {
//             const token = localStorage.getItem('token');
//             const formData = new FormData();
//             formData.append('submission', submissionFile);

//             const response = await axios.post(`http://localhost:9000/api/assignments/${assignmentId}/submit`, formData, {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     'Content-Type': 'multipart/form-data'
//                 }
//             });

//             if (response.data.success) {
//                 setSuccessMessage('Assignment submitted successfully!');
//                 setSubmissionStatus((prevStatus) => ({
//                     ...prevStatus,
//                     [assignmentId]: 'submitted'
//                 }));
//                 setTimeout(() => setSuccessMessage(''), 3000);
//             }
//         } catch (error) {
//             console.error('Submit assignment error:', error);
//             setError('Failed to submit assignment');
//         }
//     };

//     if (loading) return <div className="text-center p-4">Loading...</div>;
//     if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

//     return (
//         <div className="min-h-screen bg-gray-100 p-8">
//             <div className="max-w-7xl mx-auto">
//                 {successMessage && (
//                     <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
//                         {successMessage}
//                     </div>
//                 )}
                
//                 <div className="bg-white rounded-lg shadow-md p-6">
//                     <h2 className="text-2xl font-bold mb-6">My Assignments</h2>
//                     <div className="space-y-6">
//                         {assignments.length === 0 ? (
//                             <p className="text-center text-gray-500">No assignments available</p>
//                         ) : (
//                             assignments.map((assignment) => {
//                                 const mySubmission = assignment.submissions.find(
//                                     s => s.student?.name === userName
//                                 );
//                                 const isSubmitted = mySubmission?.status === 'submitted' || mySubmission?.status === 'graded';
//                                 const isLate = new Date() > new Date(assignment.dueDate);

//                                 return (
//                                     <div key={assignment._id} className="border rounded-lg p-4">
//                                         <h3 className="text-xl font-semibold mb-2">{assignment.title}</h3>
//                                         <p className="text-gray-600 mb-4">{assignment.description}</p>
                                        
//                                         <div className="flex justify-between text-sm text-gray-500 mb-4">
//                                             <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
//                                             <span>Max Score: {assignment.maxScore}</span>
//                                         </div>

//                                         {/* Assignment Status */}
//                                         <div className="mb-4">
//                                             <span className={`px-3 py-1 rounded-full text-sm ${
//                                                 isSubmitted 
//                                                     ? 'bg-green-100 text-green-800'
//                                                     : isLate
//                                                         ? 'bg-red-100 text-red-800'
//                                                         : 'bg-yellow-100 text-yellow-800'
//                                             }`}>
//                                                 {isSubmitted 
//                                                     ? 'Submitted'
//                                                     : isLate
//                                                         ? 'Late'
//                                                         : 'Pending'}
//                                             </span>
//                                         </div>

//                                         {/* View Assignment Document */}
//                                         {assignment.documentUrl && (
//                                             <a
//                                                 href={`http://localhost:9000/${assignment.documentUrl}`}
//                                                 target="_blank"
//                                                 rel="noopener noreferrer"
//                                                 className="text-blue-500 hover:underline block mb-4"
//                                             >
//                                                 View Assignment Document
//                                             </a>
//                                         )}

//                                         {/* Show submission form if not submitted */}
//                                         {!isSubmitted && (
//                                             <div className="mt-4 p-4 bg-gray-50 rounded-lg">
//                                                 <h4 className="font-semibold mb-2">Submit Your Work</h4>
//                                                 <div className="space-y-4">
//                                                     <input
//                                                         type="file"
//                                                         accept=".pdf"
//                                                         onChange={(e) => setSubmissionFile(e.target.files[0])}
//                                                         className="w-full p-2 border rounded"
//                                                     />
//                                                     <button
//                                                         onClick={() => handleSubmitAssignment(assignment._id)}
//                                                         disabled={!submissionFile}
//                                                         className={`w-full px-4 py-2 rounded text-white ${
//                                                             submissionFile
//                                                                 ? 'bg-blue-500 hover:bg-blue-600'
//                                                                 : 'bg-gray-400 cursor-not-allowed'
//                                                         }`}
//                                                     >
//                                                         {isLate ? 'Submit Late' : 'Submit Assignment'}
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {/* Show submitted work if available */}
//                                         {mySubmission && (
//                                             <div className="mt-4 p-4 bg-gray-50 rounded-lg">
//                                                 <h4 className="font-semibold mb-2">Your Submission</h4>
//                                                 <p>Submitted on: {new Date(mySubmission.submissionDate).toLocaleString()}</p>
//                                                 {mySubmission.score !== null && (
//                                                     <p className="mt-2">Score: {mySubmission.score}/{assignment.maxScore}</p>
//                                                 )}
//                                                 {mySubmission.submissionUrl && (
//                                                     <a
//                                                         href={`http://localhost:9000/${mySubmission.submissionUrl}`}
//                                                         target="_blank"
//                                                         rel="noopener noreferrer"
//                                                         className="text-blue-500 hover:underline block mt-2"
//                                                     >
//                                                         View Your Submission
//                                                     </a>
//                                                 )}
//                                             </div>
//                                         )}
//                                     </div>
//                                 );
//                             })
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default StudentAssignmentList;