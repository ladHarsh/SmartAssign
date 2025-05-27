import React, { useState, useEffect } from 'react';
import './CreateClassroomModal.css';

const CreateClassroomModal = ({ onClose, onSubmit, isEdit, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        description: '',
        studentEmails: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                subject: initialData.subject || '',
                description: initialData.description || '',
                studentEmails: Array.isArray(initialData.studentEmails) 
                    ? initialData.studentEmails.join(', ')
                    : ''
            });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Process student emails before submitting
        const processedData = {
            ...formData,
            studentEmails: formData.studentEmails
                ? formData.studentEmails.split(',').map(email => email.trim()).filter(email => email)
                : []
        };
        
        onSubmit(processedData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-wrapper">
                <div className="modal-header">
                    <h1 className="modal-title" style={{color: '#6366f1'}}>
                        <i className="fas fa-chalkboard-teacher"></i>
                        {isEdit ? 'Edit Classroom' : 'Create New Classroom'}
                    </h1>
                    <button className="close-button" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-graduation-cap"></i>
                            Classroom Name
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Enter classroom name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-book"></i>
                            Subject
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            placeholder="Enter subject name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-info-circle"></i>
                            Description
                        </label>
                        <textarea
                            className="form-textarea"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Enter classroom description"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <i className="fas fa-users"></i>
                            Student Emails
                        </label>
                        <textarea
                            className="form-textarea"
                            value={formData.studentEmails}
                            onChange={(e) => setFormData({...formData, studentEmails: e.target.value})}
                            placeholder="student1@example.com, student2@example.com"
                        />
                        <p className="help-text">
                            Optional: Enter comma-separated email addresses to invite students
                        </p>
                    </div>

                    <div className="button-container">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            <i className="fas fa-times"></i>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit">
                            <i className="fas fa-save"></i>
                            {isEdit ? 'Update Classroom' : 'Create Classroom'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClassroomModal;