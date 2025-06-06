"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUser = exports.getUsers = void 0;
const express_validator_1 = require("express-validator");
const User_1 = __importDefault(require("../models/User"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
    try {
        const users = await User_1.default.find().select('-password');
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getUsers = getUsers;
/**
 * @desc    Get single user
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
const getUser = async (req, res, next) => {
    try {
        const user = await User_1.default.findById(req.params.id).select('-password');
        if (!user) {
            return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: user
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getUser = getUser;
/**
 * @desc    Create user
 * @route   POST /api/v1/users
 * @access  Private/Admin
 */
const createUser = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = await User_1.default.create(req.body);
        // Remove sensitive data from response
        const userObj = user.toObject();
        const { password, ...responseData } = userObj;
        res.status(201).json({
            success: true,
            data: responseData
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createUser = createUser;
/**
 * @desc    Update user
 * @route   PUT /api/v1/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let user = await User_1.default.findById(req.params.id);
        if (!user) {
            return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
        }
        // Create a new object without the password field
        const { password, ...updateData } = req.body;
        const updatedUser = await User_1.default.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        }).select('-password');
        if (!updatedUser) {
            return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: updatedUser
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateUser = updateUser;
/**
 * @desc    Delete user
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return next(new errorResponse_1.default(`User not found with id of ${req.params.id}`, 404));
        }
        await user.deleteOne();
        res.status(200).json({
            success: true,
            data: {}
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=userController.js.map