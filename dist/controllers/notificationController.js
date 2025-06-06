"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.updateNotification = exports.markAsRead = exports.createNotification = exports.getNotification = exports.getMyNotifications = exports.getNotifications = void 0;
const express_validator_1 = require("express-validator");
const Notification_1 = __importDefault(require("../models/Notification"));
const responseHandler_1 = require("../utils/responseHandler");
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
/**
 * @desc    Get all notifications (Admin only)
 * @route   GET /api/v1/notifications
 * @access  Private/Admin
 */
const getNotifications = async (req, res, next) => {
    try {
        const { type, page = '1', limit = '10', search } = req.query;
        // Build query
        const query = {};
        if (type) {
            query.type = type;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }
        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;
        const total = await Notification_1.default.countDocuments(query);
        const notifications = await Notification_1.default.find(query)
            .populate('createdBy', 'name email')
            .populate('targetUsers', 'name email')
            .populate('readBy.user', 'name email')
            .sort('-createdAt')
            .skip(startIndex)
            .limit(limitNum);
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Notifications retrieved successfully', notifications, {
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getNotifications = getNotifications;
/**
 * @desc    Get user's notifications
 * @route   GET /api/v1/notifications/my-notifications
 * @access  Private
 */
const getMyNotifications = async (req, res, next) => {
    try {
        const { read, page = '1', limit = '10' } = req.query;
        // Build query for user-specific and global notifications
        const query = {
            $or: [
                { targetUsers: req.user._id },
                { isGlobal: true }
            ],
            expiresAt: { $gt: new Date() }
        };
        // Filter by read status if specified
        if (read === 'true') {
            query['readBy.user'] = req.user._id;
        }
        else if (read === 'false') {
            query['readBy.user'] = { $ne: req.user._id };
        }
        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;
        const total = await Notification_1.default.countDocuments(query);
        const notifications = await Notification_1.default.find(query)
            .populate('createdBy', 'name email')
            .sort('-createdAt')
            .skip(startIndex)
            .limit(limitNum);
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Notifications retrieved successfully', notifications, {
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getMyNotifications = getMyNotifications;
/**
 * @desc    Get single notification
 * @route   GET /api/v1/notifications/:id
 * @access  Private
 */
const getNotification = async (req, res, next) => {
    try {
        const notification = await Notification_1.default.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('targetUsers', 'name email')
            .populate('readBy.user', 'name email');
        if (!notification) {
            next(new errorResponse_1.default(`Notification not found with id of ${req.params.id}`, 404));
            return;
        }
        // Check if user is authorized to view this notification
        if (!notification.isGlobal && !notification.targetUsers.some(user => user._id.toString() === req.user._id.toString())) {
            next(new errorResponse_1.default('Not authorized to access this notification', 403));
            return;
        }
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Notification retrieved successfully', notification);
    }
    catch (err) {
        next(err);
    }
};
exports.getNotification = getNotification;
/**
 * @desc    Create notification (Admin only)
 * @route   POST /api/v1/notifications
 * @access  Private/Admin
 */
const createNotification = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.VALIDATION_ERROR, 'Validation error', errors.array());
            return;
        }
        // Add creator to notification
        req.body.createdBy = req.user._id;
        // Validate that either targetUsers is provided or isGlobal is true
        if (!req.body.isGlobal && (!req.body.targetUsers || req.body.targetUsers.length === 0)) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.BAD_REQUEST, 'Please provide target users or set as global notification');
            return;
        }
        const notification = await Notification_1.default.create(req.body);
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.CREATED, 'Notification created successfully', notification);
    }
    catch (err) {
        (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error creating notification', err);
    }
};
exports.createNotification = createNotification;
/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification_1.default.findById(req.params.id);
        if (!notification) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, `Notification not found with id of ${req.params.id}`);
            return;
        }
        // Check if user is authorized to read this notification
        if (!notification.isGlobal && !notification.targetUsers.includes(req.user._id)) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.FORBIDDEN, 'Not authorized to access this notification');
            return;
        }
        // Check if already read
        const alreadyRead = notification.readBy.some(read => read.user.toString() === req.user._id.toString());
        if (!alreadyRead) {
            notification.readBy.push({
                user: req.user._id,
                readAt: new Date()
            });
            await notification.save();
        }
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Notification marked as read successfully', notification);
    }
    catch (err) {
        (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error marking notification as read', err);
    }
};
exports.markAsRead = markAsRead;
/**
 * @desc    Update notification (Admin only)
 * @route   PUT /api/v1/notifications/:id
 * @access  Private/Admin
 */
const updateNotification = async (req, res, next) => {
    try {
        let notification = await Notification_1.default.findById(req.params.id);
        if (!notification) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, `Notification not found with id of ${req.params.id}`);
            return;
        }
        // Validate that either targetUsers is provided or isGlobal is true
        if (req.body.isGlobal === false && (!req.body.targetUsers || req.body.targetUsers.length === 0)) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.BAD_REQUEST, 'Please provide target users or set as global notification');
            return;
        }
        notification = await Notification_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('createdBy', 'name email')
            .populate('targetUsers', 'name email')
            .populate('readBy.user', 'name email');
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Notification updated successfully', notification);
    }
    catch (err) {
        (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error updating notification', err);
    }
};
exports.updateNotification = updateNotification;
/**
 * @desc    Delete notification (Admin only)
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private/Admin
 */
const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification_1.default.findById(req.params.id);
        if (!notification) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, `Notification not found with id of ${req.params.id}`);
            return;
        }
        await notification.deleteOne();
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Notification deleted successfully', null);
    }
    catch (err) {
        (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error deleting notification', err);
    }
};
exports.deleteNotification = deleteNotification;
//# sourceMappingURL=notificationController.js.map