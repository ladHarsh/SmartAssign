import React, { useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { getBaseUrl } from '../../config/api.config';
import './GradeSubmissionModal.css';

const GradeSubmissionModal = ({ assignment, submission, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        grade: submission?.grade || '',
        feedback: submission?.feedback || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (!formData.grade || formData.grade > assignment.maxMarks || formData.grade < 0) {
                throw new Error(`Grade must be between 0 and ${assignment.maxMarks}`);
            }

            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting grade:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grade-modal-overlay">
            <div className="grade-modal-content">
                {error && (
                    <div className="alert alert-danger mb-3">{error}</div>
                )}
                <div className="grade-header">
                    <h2 className="grade-title">
                        <i className="fas fa-check-circle"></i>
                        Grade Submission
                    </h2>
                    <button className="close-button" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="grade-details">
                    <div className="detail-group">
                        <label className="detail-label">
                            <i className="fas fa-clock me-2"></i>
                            Submitted On
                        </label>
                        <div className="detail-value">
                            {new Date(submission.submittedAt).toLocaleString()}
                        </div>
                    </div>
                    <div className="detail-group">
                        <label className="detail-label">
                            <i className="fas fa-star me-2"></i>
                            Maximum Marks
                        </label>
                        <div className="detail-value">{assignment.maxMarks}</div>
                    </div>
                </div>

                {loading ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '200px'
                    }}>
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit}>
                            <div className="grade-form-group">
                                <label className="grade-label">Grade</label>
                                <input
                                    type="number"
                                    className="grade-input"
                                    value={formData.grade}
                                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                                    min="0"
                                    max={assignment.maxMarks}
                                    required
                                />
                            </div>

                            <div className="grade-form-group">
                                <label className="grade-label">Feedback</label>
                                <textarea
                                    className="feedback-textarea"
                                    value={formData.feedback}
                                    onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                                    placeholder="Enter feedback for the student..."
                                />
                            </div>

                            <div className="button-container">
                                <button type="button" className="cancel-button" onClick={onClose}>
                                    <i className="fas fa-times"></i>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-button" disabled={loading}>
                                    <i className="fas fa-save"></i>
                                    {loading ? 'Saving...' : 'Submit Grade'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default GradeSubmissionModal;