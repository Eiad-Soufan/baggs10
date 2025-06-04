import { Response } from 'express';

/**
 * Standard success response
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Success message
 * @param data - Response data
 * @param meta - Additional metadata (optional)
 */
export const successResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: unknown,
  meta: Record<string, unknown> = {}
): Response => {
  const response = {
    success: true,
    status: statusCode,
    message,
    data,
    ...meta
  };
  return res.status(statusCode).json(response);
};

/**
 * Standard error response
 * @param res - Express response object
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param errors - Detailed errors (optional)
 */
export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors: unknown = null
): Response => {
  const response: Record<string, unknown> = {
    success: false,
    status: statusCode,
    message
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * HTTP Status codes for different scenarios
 */
export const STATUS_CODES = {
  // Success responses
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client error responses
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,

  // Server error responses
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const; 