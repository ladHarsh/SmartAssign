import React, { useEffect } from 'react';

const Notification = ({ type, message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto dismiss after 3 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div 
            className={`notification ${type}`}
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                maxWidth: '300px',
                padding: '12px 20px',
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1050,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'slideIn 0.3s ease-out',
                border: `2px solid ${type === 'success' ? '#6366F1' : '#EF4444'}`
            }}
        >
            <i className={`bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} 
               style={{ color: type === 'success' ? '#6366F1' : '#EF4444' }}
            />
            <span style={{ fontSize: '0.875rem' }}>{message}</span>
        </div>
    );
};

export default Notification;