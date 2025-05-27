import React from 'react';

const UploadProgress = ({ progress }) => {
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
            />
            <p className="text-sm text-gray-600 mt-1">
                Uploading: {progress}%
            </p>
        </div>
    );
};

export default UploadProgress; 