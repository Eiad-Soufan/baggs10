"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const responseHandler_1 = require("../utils/responseHandler");
const errorHandler = (err, req, res, next) => {
    var _a;
    let error = { ...err };
    error.message = err.message;
    // Log to console for dev
    console.error(err);
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, 'Resource not found');
        return;
    }
    // Mongoose duplicate key
    if (err.code === 11000 && err.keyValue) {
        const field = Object.keys(err.keyValue)[0];
        (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.BAD_REQUEST, `Duplicate field value entered for ${field}. Please use another value.`);
        return;
    }
    // Mongoose validation error
    if (err.name === 'ValidationError' && err.errors) {
        const message = Object.values(err.errors).map(val => val.message);
        (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.VALIDATION_ERROR, 'Validation Error', message);
        return;
    }
    // Default to 500 server error
    (0, responseHandler_1.errorResponse)(res, (_a = error.statusCode) !== null && _a !== void 0 ? _a : responseHandler_1.STATUS_CODES.INTERNAL_SERVER_ERROR, error.message || 'Server Error');
};
exports.default = errorHandler;
//# sourceMappingURL=error.js.map