import React, { useState } from 'react';
import { getApiUrl } from '../../config/api.config';
import './AssignmentEditModal.css';

const AssignmentEditModal = ({ assignment, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: assignment.title,
        description: assignment.description,
        dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
        maxMarks: assignment.maxMarks
    });
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            if (selectedFile.size <= 5 * 1024 * 1024) {
                setFile(selectedFile);
                setError('');
            } else {
                setError('File size should be less than 5MB');
            }
        } else {
            setError('Please select a PDF file');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            let fileUrl = assignment.assignmentFile;

            if (file) {
                const formDataObj = new FormData();
                formDataObj.append('file', file);
                
                const sessionId = sessionStorage.getItem('sessionId');
                const token = sessionStorage.getItem(`token_${sessionId}`);
                
                const uploadResponse = await fetch(getApiUrl('/upload'), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Session-ID': sessionId
                    },
                    body: formDataObj
                });

                const uploadResult = await uploadResponse.json();
                
                if (uploadResult.success) {
                    fileUrl = uploadResult.fileUrl;
                } else {
                    throw new Error(uploadResult.message);
                }
            }

            await onSubmit({
                ...formData,
                assignmentFile: fileUrl
            });
        } catch (error) {
            setError(error.message || 'Failed to update assignment');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="assignment-modal-overlay">
            <div className="assignment-modal-content">
                <div className="assignment-modal-header">
                    <h1 className="assignment-modal-title" style={{color: 'rgb(99, 102, 241)'}}>
                        <i className="fas fa-edit"></i>
                        Edit Assignment
                    </h1>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-heading"></i>
                            Title
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-align-left"></i>
                            Description
                        </label>
                        <textarea
                            className="form-input"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows="4"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-calendar"></i>
                            Due Date
                        </label>
                        <input
                            type="datetime-local"
                            className="form-input"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-star"></i>
                            Maximum Marks
                        </label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.maxMarks}
                            onChange={(e) => setFormData({...formData, maxMarks: e.target.value})}
                            required
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-file-pdf"></i>
                            Update Assignment PDF
                        </label>
                        <div className="file-input-wrapper">
                            <label className="file-input-label">
                                <i className="fas fa-upload"></i>
                                <span>Choose file</span>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {file && <div className="file-info">{file.name}</div>}
                            {error && <div className="error-text">{error}</div>}
                        </div>
                        <div className="file-info">
                            Current file: <a href={assignment.assignmentFile} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">View</a>
                        </div>
                    </div>

                    <div className="button-container">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={uploading}
                        >
                            <i className="fas fa-times"></i>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={uploading}
                        >
                            <i className="fas fa-save"></i>
                            {uploading ? 'Updating...' : 'Update Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignmentEditModal;