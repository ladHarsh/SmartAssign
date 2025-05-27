const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error: ' + err.message
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Authentication error: ' + err.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
};

module.exports = errorHandler; 