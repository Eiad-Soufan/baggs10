"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.login = exports.register = void 0;
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
    // Create token
    const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || '', {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
    const options = {
        expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE || '30') * 24 * 60 * 60 * 1000)),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }
    res
        .status(statusCode)
        .json({
        success: true,
        token
    });
};
//# sourceMappingURL=authController.js.map