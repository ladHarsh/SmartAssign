import React from 'react';
import { format } from 'date-fns';

const AssignmentDetailView = ({ assignment, onClose, onEdit, onDelete }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-semibold">{assignment.title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-gray-700">Description</h3>
                        <p className="text-gray-600">{assignment.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold text-gray-700">Due Date</h3>
                            <p className="text-gray-600">
                                {format(new Date(assignment.dueDate), 'PPp')}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-700">Maximum Marks</h3>
                            <p className="text-gray-600">{assignment.maxMarks}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-700">Assignment File</h3>
                        <a 
                            href={assignment.assignmentFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                        >
                            View Assignment PDF
                        </a>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-700">Submissions</h3>
                        <p className="text-gray-600">
                            Total Submissions: {assignment.submissions.length}
                        </p>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={onEdit}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Edit Assignment
                        </button>
                        <button
                            onClick={onDelete}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            Delete Assignment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetailView; 