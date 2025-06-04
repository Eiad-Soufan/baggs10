import { Request, Response, NextFunction } from 'express';
import { errorResponse, STATUS_CODES } from '../utils/responseHandler';

interface ExtendedError extends Error {
  code?: number;
  statusCode?: number;
  errors?: Record<string, { message: string }>;
  keyValue?: Record<string, unknown>;
}

const errorHandler = (
  err: ExtendedError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    errorResponse(res, STATUS_CODES.NOT_FOUND, 'Resource not found');
    return;
  }

  // Mongoose duplicate key
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    errorResponse(
      res, 
      STATUS_CODES.BAD_REQUEST, 
      `Duplicate field value entered for ${field}. Please use another value.`
    );
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors).map(val => val.message);
    errorResponse(res, STATUS_CODES.VALIDATION_ERROR, 'Validation Error', message);
    return;
  }

  // Default to 500 server error
  errorResponse(
    res, 
    error.statusCode ?? STATUS_CODES.INTERNAL_SERVER_ERROR,
    error.message || 'Server Error'
  );
};

export default errorHandler; 