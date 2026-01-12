import logger from '../config/logger.js';

export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    const statusCode =
        res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    logger.error(err.message, {
        statusCode,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
    });

    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'Server Error',
            code: err.code || null,
        },
        ...(process.env.NODE_ENV === 'production'
            ? {}
            : { stack: err.stack }),
    });
};
