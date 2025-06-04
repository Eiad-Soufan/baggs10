"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// Protect routes
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        // Get token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }
    // Make sure token exists
    if (!token) {
        return next(new errorResponse_1.default('Not authorized to access this route', 401));
    }
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '');
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            return next(new errorResponse_1.default('User not found', 404));
        }
        req.user = user;
        next();
    }
    catch (err) {
        return next(new errorResponse_1.default('Not authorized to access this route', 401));
    }
};
exports.protect = protect;
// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        var _a;
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new errorResponse_1.default(`User role ${((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || 'UNKNOWN'} is not authorized to access this route`, 403));
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map