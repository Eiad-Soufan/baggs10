"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.logout = exports.getMe = exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { name, email, phone, password, identityNumber } = req.body;
        // Check if user exists
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            next(new errorResponse_1.default('User already exists', 400));
            return;
        }
        // Create user
        const user = await User_1.default.create({
            name,
            email,
            phone,
            password,
            identityNumber
        });
        sendTokenResponse(user, 201, res);
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { email, password } = req.body;
        // Check for user
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            next(new errorResponse_1.default('Invalid credentials', 401));
            return;
        }
        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            next(new errorResponse_1.default('Invalid credentials', 401));
            return;
        }
        sendTokenResponse(user, 200, res);
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    var _a;
    try {
        const user = await User_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        res.status(200).json({
            success: true,
            data: user
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getMe = getMe;
/**
 * @desc    Log user out / clear cookie
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
const logout = (req, res, next) => {
    res.status(200).json({
        success: true,
        data: {}
    });
};
exports.logout = logout;
// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create tokens
    const accessToken = generateToken(user, 'access');
    const refreshToken = generateToken(user, 'refresh');
    const response = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: Date.now() + (process.env.JWT_EXPIRE ? parseInt(process.env.JWT_EXPIRE) * 1000 : 3600000), // 1 hour default
        refresh_expires_in: Date.now() + (process.env.JWT_REFRESH_EXPIRE ? parseInt(process.env.JWT_REFRESH_EXPIRE) * 1000 : 604800000) // 7 days default
    };
    res.status(statusCode).json({
        success: true,
        data: response
    });
};
const generateToken = (user, type) => {
    var _a;
    let expiresIn;
    if (type === 'access') {
        expiresIn = process.env.JWT_EXPIRE ? parseInt(process.env.JWT_EXPIRE) : 3600;
    }
    else {
        expiresIn = process.env.JWT_REFRESH_EXPIRE ? parseInt(process.env.JWT_REFRESH_EXPIRE) : 604800;
    }
    const options = {
        expiresIn
    };
    return jsonwebtoken_1.default.sign({ id: user._id }, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'your-secret-key', options);
};
/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
    var _a;
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            next(new errorResponse_1.default('Refresh token is required', 400));
            return;
        }
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refresh_token, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'your-secret-key');
        // Get user from token
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            next(new errorResponse_1.default('User not found', 404));
            return;
        }
        // Generate new tokens
        sendTokenResponse(user, 200, res);
    }
    catch (err) {
        next(new errorResponse_1.default('Invalid refresh token', 401));
    }
};
exports.refreshToken = refreshToken;
//# sourceMappingURL=authController.js.map