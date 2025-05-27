// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import axios from 'axios';
// import { useAuth } from '../../context/AuthContext';

// const FacultyAssignmentList = () => {
//     const { id } = useParams(); // classroom id
//     const { userRole, userName } = useAuth();
//     const [assignments, setAssignments] = useState([]);
//     const [newAssignment, setNewAssignment] = useState({
//         title: '',
//         description: '',
//         dueDate: '',
//         maxScore: ''
//     });
//     const [file, setFile] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');

//     useEffect(() => {
//         fetchAssignments();
//     }, [id]);

//     const fetchAssignments = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await axios.get(
//                 `http://localhost:9000/api/assignments/classroom/${id}`,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`
//                     }
//                 }
//             );
//             setAssignments(response.data.assignments);
//             setLoading(false);
//         } catch (error) {
//             console.error('Error fetching assignments:', error);
//             setError('Failed to fetch assignments');
//             setLoading(false);
//         }
//     };

//     const handleCreateAssignment = async (e) => {
//         e.preventDefault();
//         try {
//             const formData = new FormData();
//             formData.append('title', newAssignment.title);
//             formData.append('description', newAssignment.description);
//             formData.append('dueDate', newAssignment.dueDate);
//             formData.append('maxScore', newAssignment.maxScore);
//             formData.append('classroomId', id);
//             if (file) {
//                 formData.append('document', file);
//             }

//             const token = localStorage.getItem('token');
//             const response = await axios.post(
//                 'http://localhost:9000/api/assignments/create',
//                 formData,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                         'Content-Type': 'multipart/form-data'
//                     }
//                 }
//             );

//             if (response.data.success) {
//                 setSuccessMessage('Assignment created successfully!');
//                 setNewAssignment({ title: '', description: '', dueDate: '', maxScore: '' });
//                 setFile(null);
//                 fetchAssignments();

//                 // Clear success message after 3 seconds
//                 setTimeout(() => setSuccessMessage(''), 3000);
//             }
//         } catch (error) {
//             console.error('Error creating assignment:', error);
//             setError('Failed to create assignment');
//         }
//     };

//     if (loading) return <div className="text-center p-4">Loading...</div>;

//     return (
//         <div className="min-h-screen bg-gray-100 p-8">
//             <div className="max-w-7xl mx-auto">
//                 {/* Create Assignment Form */}
//                 <div className="bg-white rounded-lg shadow-md p-6 mb-8">
//                     <h2 className="text-2xl font-bold mb-4">Create New Assignment</h2>
//                     {successMessage && (
//                         <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
//                             {successMessage}
//                         </div>
//                     )}
//                     {error && (
//                         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//                             {error}
//                         </div>
//                     )}
//                     <form onSubmit={handleCreateAssignment} className="space-y-4">
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
//                             <input
//                                 type="text"
//                                 value={newAssignment.title}
//                                 onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
//                                 className="w-full p-2 border rounded"
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//                             <textarea
//                                 value={newAssignment.description}
//                                 onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
//                                 className="w-full p-2 border rounded"
//                                 rows="3"
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
//                             <input
//                                 type="datetime-local"
//                                 value={newAssignment.dueDate}
//                                 onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
//                                 className="w-full p-2 border rounded"
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Score</label>
//                             <input
//                                 type="number"
//                                 value={newAssignment.maxScore}
//                                 onChange={(e) => setNewAssignment({...newAssignment, maxScore: e.target.value})}
//                                 className="w-full p-2 border rounded"
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                                 Assignment File (PDF)
//                             </label>
//                             <input
//                                 type="file"
//                                 accept=".pdf"
//                                 onChange={(e) => setFile(e.target.files[0])}
//                                 className="w-full p-2 border rounded"
//                             />
//                         </div>
//                         <button
//                             type="submit"
//                             className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//                         >
//                             Create Assignment
//                         </button>
//                     </form>
//                 </div>

//                 {/* Display Assignments */}
//                 <div className="bg-white rounded-lg shadow-md p-6">
//                     <h2 className="text-2xl font-bold mb-6">Assignments</h2>
//                     <div className="space-y-6">
//                         {assignments.length === 0 ? (
//                             <p className="text-center text-gray-500">No assignments yet</p>
//                         ) : (
//                             assignments.map((assignment) => (
//                                 <div key={assignment._id} className="border rounded-lg p-4">
//                                     <h3 className="text-xl font-semibold mb-2">{assignment.title}</h3>
//                                     <p className="text-gray-600 mb-4">{assignment.description}</p>
//                                     <div className="flex justify-between text-sm text-gray-500 mb-4">
//                                         <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
//                                         <span>Max Score: {assignment.maxScore}</span>
//                                     </div>
                                    
//                                     {/* Submission Statistics */}
//                                     <div className="bg-gray-50 p-4 rounded-lg mb-4">
//                                         <h4 className="font-semibold mb-2">Submission Status:</h4>
//                                         <div className="grid grid-cols-2 gap-4">
//                                             <div>
//                                                 <p>Total Submissions: {assignment.submissions.length}</p>
//                                                 <p>Submitted: {assignment.submissions.filter(s => s.status === 'submitted').length}</p>
//                                                 <p>Late: {assignment.submissions.filter(s => s.status === 'late').length}</p>
//                                             </div>
//                                             <div>
//                                                 <p>Pending: {assignment.submissions.filter(s => s.status === 'pending').length}</p>
//                                                 <p>Graded: {assignment.submissions.filter(s => s.status === 'graded').length}</p>
//                                             </div>
//                                         </div>
                                        
//                                         {/* Add submission details */}
//                                         {assignment.submissions.length > 0 && (
//                                             <div className="mt-4">
//                                                 <h4 className="font-semibold mb-2">Student Submissions:</h4>
//                                                 <div className="space-y-2">
//                                                     {assignment.submissions.map(submission => (
//                                                         <div key={submission._id} className="flex justify-between items-center">
//                                                             <span>{submission.student.name}</span>
//                                                             <span className={`px-2 py-1 rounded-full text-sm ${
//                                                                 submission.status === 'submitted' ? 'bg-green-100 text-green-800' :
//                                                                 submission.status === 'late' ? 'bg-red-100 text-red-800' :
//                                                                 'bg-yellow-100 text-yellow-800'
//                                                             }`}>
//                                                                 {submission.status}
//                                                             </span>
//                                                             {submission.submissionUrl && (
//                                                                 <a
//                                                                     href={`http://localhost:9000/${submission.submissionUrl}`}
//                                                                     target="_blank"
//                                                                     rel="noopener noreferrer"
//                                                                     className="text-blue-500 hover:underline"
//                                                                 >
//                                                                     View Submission
//                                                                 </a>
//                                                             )}
//                                                         </div>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>

//                                     {assignment.documentUrl && (
//                                         <a
//                                             href={`http://localhost:9000/${assignment.documentUrl}`}
//                                             target="_blank"
//                                             rel="noopener noreferrer"
//                                             className="text-blue-500 hover:underline block"
//                                         >
//                                             View Assignment Document
//                                         </a>
//                                     )}
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default FacultyAssignmentList;