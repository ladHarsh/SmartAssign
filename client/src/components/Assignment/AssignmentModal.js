import React, { useState } from 'react';
import axios from 'axios';
import './AssignmentModal.css';

const AssignmentModal = ({ isEdit, initialData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 16) : '',
        maxMarks: initialData?.maxMarks || ''
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            if (selectedFile.size <= 5 * 1024 * 1024) { // 5MB limit
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
        setError('');
        
        try {
            if (!formData.title || !formData.description || !formData.dueDate || !formData.maxMarks) {
                throw new Error('All fields are required');
            }

            const formDataObj = new FormData();
            formDataObj.append('title', formData.title);
            formDataObj.append('description', formData.description);
            formDataObj.append('dueDate', formData.dueDate);
            formDataObj.append('maxMarks', formData.maxMarks);
            
            if (file) {
                formDataObj.append('assignmentFile', file);
            }

            await onSubmit(formDataObj);
        } catch (error) {
            console.error('Error with assignment:', error);
            setError(error.message || 'Failed to process assignment');
        } finally {
            setUploading(false);
        }
    };

    // Add onChange handler for form inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="assignment-modal-overlay">
            <div className="assignment-modal-content">
                <div className="assignment-modal-header">
                    <h1 className="assignment-modal-title" style={{color: 'rgb(99, 102, 241)'}}>
                        <i className={`fas ${isEdit ? 'fa-edit' : 'fa-plus-circle'}`}></i>
                        {isEdit ? 'Edit Assignment' : 'Create Assignment'}
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
                            name="title"
                            className="form-input"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-align-left"></i>
                            Description
                        </label>
                        <textarea
                            name="description"
                            className="form-input"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">
                                <i className="fas fa-calendar"></i>
                                Due Date
                            </label>
                            <input
                                type="datetime-local"
                                name="dueDate"
                                className="form-input"
                                value={formData.dueDate}
                                onChange={handleChange}
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
                                name="maxMarks"
                                className="form-input"
                                value={formData.maxMarks}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-file-pdf"></i>
                            Assignment PDF
                        </label>
                        <div 
                            className="file-upload-area"
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <i className="fas fa-cloud-upload-alt file-upload-icon"></i>
                            <div>Click or drag to upload PDF</div>
                            <input
                                id="file-input"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            {file && <div className="file-name">{file.name}</div>}
                        </div>
                        {error && <div className="error-text">{error}</div>}
                    </div>

                    <div className="button-container">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            <i className="fas fa-times"></i>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={uploading}>
                            <i className="fas fa-save"></i>
                            {uploading ? (isEdit ? 'Updating...' : 'Creating...') : 
                                       (isEdit ? 'Update Assignment' : 'Create Assignment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignmentModal;