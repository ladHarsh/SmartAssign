import React from 'react';
import { getBaseUrl } from '../../config/api.config';

const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const StudentAssignmentView = ({ assignments, onSubmit }) => {
    return (
        <div className="space-y-4">
            {assignments.map(assignment => (
                <div key={assignment._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold">{assignment.title}</h3>
                            <p className="text-gray-600">{assignment.description}</p>
                            {assignment.assignmentFile && (
                                <div className="mt-2">
                                    <a 
                                        href={getBaseUrl(`${assignment.assignmentFile}`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-700 text-sm"
                                    >
                                        View Assignment PDF
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">
                                Due: {formatDate(assignment.dueDate)}
                            </p>
                            <p className="text-sm text-gray-500">
                                Max Marks: {assignment.maxMarks}
                            </p>
                        </div>
                    </div>

                    {assignment.submission ? (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold mb-2">Your Submission</h4>
                            <p className="text-sm text-gray-600">
                                Submitted on: {formatDate(assignment.submission.submittedAt)}
                            </p>
                            {assignment.submission.submissionUrl && (
                                <a 
                                    href={getBaseUrl(`${assignment.submission.submissionUrl}`)}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 text-sm"
                                >
                                    View Your Submission
                                </a>
                            )}
                            {assignment.submission.grade !== null && (
                                <div className="mt-2">
                                    <p className="font-medium">
                                        Grade: {assignment.submission.grade}/{assignment.maxMarks}
                                    </p>
                                    {assignment.submission.feedback && (
                                        <p className="text-gray-700 mt-1">
                                            Feedback: {assignment.submission.feedback}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-4">
                            <button
                                onClick={() => onSubmit(assignment)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                disabled={new Date(assignment.dueDate) < new Date()}
                            >
                                Submit Assignment
                            </button>
                            {new Date(assignment.dueDate) < new Date() && (
                                <p className="text-red-500 text-sm mt-2">
                                    Submission deadline has passed
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default StudentAssignmentView; 