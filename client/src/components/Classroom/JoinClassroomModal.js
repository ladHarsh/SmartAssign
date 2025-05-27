import React, { useState } from 'react';
import './JoinClassroomModal.css';

const JoinClassroomModal = ({ onClose, onSubmit }) => {
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!roomCode.trim()) {
            setError('Please enter a room code');
            return;
        }
        onSubmit(roomCode.trim().toUpperCase());
    };

    return (
        <div className="modal-overlay">
            <div className="join-modal">
                <div className="modal-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <i className="fas fa-door-open"></i>
                        </div>
                        <h1 style={{color: 'rgb(99, 102, 241)'}}>Join Classroom</h1>
                    </div>
                </div>

                <div className="modal-content">
                    <div className="welcome-text">
                        <i className="fas fa-graduation-cap text-primary"></i>
                        <p>Enter the classroom code provided by your teacher to join the class.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>
                                <i className="fas fa-key"></i>
                                Room Code
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => {
                                        setRoomCode(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Enter room code"
                                    className={error ? 'error' : ''}
                                    required
                                />
                                <i className="fas fa-hashtag input-icon"></i>
                            </div>
                            {error && (
                                <div className="error-message">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="button-group">
                            <button type="button" className="btn-cancel" onClick={onClose}>
                                <i className="fas fa-times"></i>
                                Cancel
                            </button>
                            <button type="submit" className="btn-join">
                                <i className="fas fa-sign-in-alt"></i>
                                Join Classroom
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JoinClassroomModal;