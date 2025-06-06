"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSampleOrders = exports.deleteOrder = exports.updateOrder = exports.createOrder = exports.getOrder = exports.getMyOrders = exports.getOrders = void 0;
const express_validator_1 = require("express-validator");
const Order_1 = __importDefault(require("../models/Order"));
const responseHandler_1 = require("../utils/responseHandler");
const mongoose_1 = require("mongoose");
/**
 * @desc    Get all orders with advanced filtering (Admin only)
 * @route   GET /api/v1/orders
 * @access  Private/Admin
 */
const getOrders = async (req, res, next) => {
    try {
        const { status, paymentStatus, sortBy = 'createdAt', order = 'desc', page = '1', limit = '10', search, scheduledDate } = req.query;
        // Build query
        const query = {};
        // Status filter
        if (status) {
            query.status = status;
        }
        // Payment status filter
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        // Date range filter
        if ((scheduledDate === null || scheduledDate === void 0 ? void 0 : scheduledDate.from) && (scheduledDate === null || scheduledDate === void 0 ? void 0 : scheduledDate.to)) {
            query.scheduledDate = {
                $gte: new Date(scheduledDate.from),
                $lte: new Date(scheduledDate.to)
            };
        }
        // Search in items name or totalAmount
        if (search) {
            query.$or = [
                { 'items.name': { $regex: search, $options: 'i' } },
                { totalAmount: { $regex: search, $options: 'i' } }
            ];
        }
        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;
        const total = await Order_1.default.countDocuments(query);
        const orders = await Order_1.default.find(query)
            .populate('userId', 'name email')
            .populate('workerId', 'name email')
            .populate('complaintId')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .skip(startIndex)
            .limit(limitNum);
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Orders retrieved successfully', orders, {
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
exports.getOrders = getOrders;
/**
 * @desc    Get user's orders
 * @route   GET /api/v1/orders/my-orders
 * @access  Private
 */
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order_1.default.find({ userId: req.user._id })
            .populate('workerId', 'name email')
            .populate('serviceId', 'name price')
            .sort('-createdAt');
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Your orders retrieved successfully', orders);
    }
    catch (err) {
        next(err);
    }
};
exports.getMyOrders = getMyOrders;
/**
 * @desc    Get single order
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
const getOrder = async (req, res, next) => {
    var _a, _b;
    try {
        const order = await Order_1.default.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('workerId', 'name email')
            .populate('complaintId');
        if (!order) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, 'Order not found');
            return;
        }
        // Check if user is admin or the order belongs to the user
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin' && order.userId.toString() !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id.toString())) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.FORBIDDEN, 'Not authorized to access this order');
            return;
        }
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Order retrieved successfully', order);
    }
    catch (err) {
        next(err);
    }
};
exports.getOrder = getOrder;
/**
 * @desc    Create order
 * @route   POST /api/v1/orders
 * @access  Private
 */
const createOrder = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.VALIDATION_ERROR, 'Validation error', errors.array());
            return;
        }
        // Add user to req.body
        req.body.userId = req.user._id;
        const order = await Order_1.default.create(req.body);
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.CREATED, 'Order created successfully', order);
    }
    catch (err) {
        next(err);
    }
};
exports.createOrder = createOrder;
/**
 * @desc    Update order (Admin only)
 * @route   PUT /api/v1/orders/:id
 * @access  Private/Admin
 */
const updateOrder = async (req, res, next) => {
    try {
        // If status is being changed to completed, add completedAt
        if (req.body.status === 'completed') {
            req.body.completedAt = new Date();
        }
        // If status is being changed to cancelled, add cancelledAt
        if (req.body.status === 'cancelled') {
            req.body.cancelledAt = new Date();
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.VALIDATION_ERROR, 'Validation error', errors.array());
            return;
        }
        const order = await Order_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('userId', 'name email')
            .populate('workerId', 'name email')
            .populate('complaintId');
        if (!order) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, 'Order not found');
            return;
        }
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Order updated successfully', order);
    }
    catch (err) {
        next(err);
    }
};
exports.updateOrder = updateOrder;
/**
 * @desc    Delete order (Admin only)
 * @route   DELETE /api/v1/orders/:id
 * @access  Private/Admin
 */
const deleteOrder = async (req, res, next) => {
    try {
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, 'Order not found');
            return;
        }
        await order.deleteOne();
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Order deleted successfully', null);
    }
    catch (err) {
        next(err);
    }
};
exports.deleteOrder = deleteOrder;
/**
 * @desc    Add 5 sample orders
 * @route   POST /api/v1/orders/add-samples
 * @access  Private/Admin
 */
const addSampleOrders = async (req, res, next) => {
    try {
        const sampleOrders = [
            {
                userId: req.user._id,
                items: [
                    {
                        name: 'Fragile Glass Vase',
                        weight: 2.5,
                        images: ['https://example.com/vase1.jpg', 'https://example.com/vase2.jpg', 'https://example.com/vase3.jpg'],
                        isBreakable: true
                    },
                    {
                        name: 'Wooden Box',
                        weight: 5.0,
                        images: ['https://example.com/box1.jpg', 'https://example.com/box2.jpg', 'https://example.com/box3.jpg'],
                        isBreakable: false
                    }
                ],
                workerId: new mongoose_1.Types.ObjectId(),
                totalAmount: 150.00,
                scheduledDate: new Date(),
                status: 'completed',
                paymentStatus: 'paid',
                completedAt: new Date()
            },
            {
                userId: req.user._id,
                items: [
                    {
                        name: 'Electronics Package',
                        weight: 3.0,
                        images: ['https://example.com/electronics1.jpg', 'https://example.com/electronics2.jpg', 'https://example.com/electronics3.jpg'],
                        isBreakable: true
                    }
                ],
                workerId: new mongoose_1.Types.ObjectId(),
                totalAmount: 200.00,
                scheduledDate: new Date(),
                status: 'in_progress',
                paymentStatus: 'paid'
            },
            {
                userId: req.user._id,
                items: [
                    {
                        name: 'Furniture Set',
                        weight: 25.0,
                        images: ['https://example.com/furniture1.jpg', 'https://example.com/furniture2.jpg', 'https://example.com/furniture3.jpg'],
                        isBreakable: false
                    }
                ],
                workerId: new mongoose_1.Types.ObjectId(),
                totalAmount: 175.00,
                scheduledDate: new Date(),
                status: 'completed',
                paymentStatus: 'paid',
                completedAt: new Date()
            },
            {
                userId: req.user._id,
                items: [
                    {
                        name: 'Clothing Package',
                        weight: 1.5,
                        images: ['https://example.com/clothing1.jpg', 'https://example.com/clothing2.jpg', 'https://example.com/clothing3.jpg'],
                        isBreakable: false
                    },
                    {
                        name: 'Shoes Box',
                        weight: 2.0,
                        images: ['https://example.com/shoes1.jpg', 'https://example.com/shoes2.jpg', 'https://example.com/shoes3.jpg'],
                        isBreakable: false
                    }
                ],
                totalAmount: 125.00,
                scheduledDate: new Date(),
                status: 'pending',
                paymentStatus: 'pending'
            },
            {
                userId: req.user._id,
                items: [
                    {
                        name: 'Art Collection',
                        weight: 8.0,
                        images: ['https://example.com/art1.jpg', 'https://example.com/art2.jpg', 'https://example.com/art3.jpg'],
                        isBreakable: true
                    }
                ],
                workerId: new mongoose_1.Types.ObjectId(),
                complaintId: new mongoose_1.Types.ObjectId(),
                totalAmount: 300.00,
                scheduledDate: new Date(),
                status: 'cancelled',
                paymentStatus: 'refunded',
                cancelledAt: new Date()
            }
        ];
        const createdOrders = await Order_1.default.insertMany(sampleOrders);
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.CREATED, '5 sample orders created successfully', createdOrders);
    }
    catch (err) {
        next(err);
    }
};
exports.addSampleOrders = addSampleOrders;
//# sourceMappingURL=orderController.js.map