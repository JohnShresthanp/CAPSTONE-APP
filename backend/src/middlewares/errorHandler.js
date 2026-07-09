import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    if (err.code === 'P2002') {
        statusCode = 409;
        message = `Duplicate value for ${err.meta?.target?.join(', ') || 'unique field'}`;
    }

    if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Record not found';
    }

    if (err.name === 'PrismaClientValidationError') {
        statusCode = 400;
        message = 'Invalid request data';
    }

    if (statusCode === 500) {
        logger.error(err);
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};
