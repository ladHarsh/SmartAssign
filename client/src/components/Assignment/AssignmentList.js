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

const AssignmentList = ({ assignments, onGrade }) => {
    return (
        <div className="space-y-4">
            {assignments.map(assignment => (
                <div key={assignment._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-semibold">{assignment.title}</h3>
                            <p className="text-gray-600">{assignment.description}</p>
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

                    <div className="mt-4">
                        <h4 className="font-semibold mb-2">
                            Submissions ({assignment.submissions.length})
                        </h4>
                        <div className="space-y-2">
                            {assignment.submissions.map(submission => (
                                <div 
                                    key={submission._id}
                                    className="flex justify-between items-center border-b pb-2"
                                >
                                    <div>
                                        <p className="font-medium">{submission.student.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Submitted: {formatDate(submission.submittedAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm">
                                            {submission.grade ? `Grade: ${submission.grade}/${assignment.maxMarks}` : 'Not graded'}
                                        </span>
                                        <button
                                            onClick={() => onGrade(assignment._id, submission)}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            {submission.grade ? 'Update Grade' : 'Grade'}
                                        </button>
                                    </div>
                                    {submission.submissionUrl && (
                                        <a 
                                            href={`${getBaseUrl(submission.submissionUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-700 text-sm"
                                        >
                                            View Submission PDF
                                        </a>
                                    )}
                                </div>
                            ))}
                            {assignment.submissions.length === 0 && (
                                <p className="text-gray-500">No submissions yet</p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {assignments.length === 0 && (
                <p className="text-center text-gray-500">No assignments created yet</p>
            )}
        </div>
    );
};

export default AssignmentList; 