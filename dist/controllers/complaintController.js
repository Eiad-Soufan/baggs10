"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSampleComplaints = exports.addComplaintFive = exports.deleteComplaint = exports.updateComplaint = exports.addResponse = exports.createComplaint = exports.getComplaint = exports.getMyComplaints = exports.getComplaints = void 0;
const express_validator_1 = require("express-validator");
const Complaint_1 = __importDefault(require("../models/Complaint"));
const Order_1 = __importDefault(require("../models/Order"));
const responseHandler_1 = require("../utils/responseHandler");
const mongoose_1 = require("mongoose");
// Define complaint status enum
const ComplaintStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    REJECTED: 'rejected',
    CLOSED: 'closed',
};
/**
 * @desc    Get all complaints with advanced filtering (Admin only)
 * @route   GET /api/v1/complaints
 * @access  Private/Admin
 */
const getComplaints = async (req, res, next) => {
    try {
        const { status, priority, category, assignedToId, relatedWorkerId, sortBy = 'createdAt', order = 'desc', page = '1', limit = '10', search, createdAt } = req.query;
        // Build query
        const query = {};
        // Status filter
        if (status) {
            query.status = status;
        }
        // Priority filter
        if (priority) {
            query.priority = priority;
        }
        // Category filter
        if (category) {
            query.category = category;
        }
        // Assigned to filter
        if (assignedToId) {
            query.assignedToId = assignedToId;
        }
        // Related worker filter
        if (relatedWorkerId) {
            query.relatedWorkerId = relatedWorkerId;
        }
        // Date range filter
        if ((createdAt === null || createdAt === void 0 ? void 0 : createdAt.from) && (createdAt === null || createdAt === void 0 ? void 0 : createdAt.to)) {
            query.createdAt = {
                $gte: new Date(createdAt.from),
                $lte: new Date(createdAt.to)
            };
        }
        // Search in title and description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;
        const total = await Complaint_1.default.countDocuments(query);
        const complaints = await Complaint_1.default.find(query)
            .populate('userId', 'name email')
            .populate('assignedToId', 'name email')
            .populate('relatedWorkerId', 'name email')
            .populate('orderId')
            .populate('closedByAdminId', 'name email')
            .populate('responses.responderId', 'name email')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .skip(startIndex)
            .limit(limitNum);
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Complaints retrieved successfully', complaints, {
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
exports.getComplaints = getComplaints;
/**
 * @desc    Get user's complaints (Customer)
 * @route   GET /api/v1/complaints/my-complaints
 * @access  Private
 */
const getMyComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint_1.default.find({ userId: req.user._id })
            .populate('assignedToId', 'name email')
            .populate('relatedWorkerId', 'name email')
            .populate('orderId')
            .populate('closedByAdminId', 'name email')
            .populate('responses.responderId', 'name email')
            .sort('-createdAt');
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Your complaints retrieved successfully', complaints);
    }
    catch (err) {
        next(err);
    }
};
exports.getMyComplaints = getMyComplaints;
/**
 * @desc    Get single complaint
 * @route   GET /api/v1/complaints/:id
 * @access  Private
 */
const getComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint_1.default.findById(req.params.id)
            .populate('userId', 'name email role')
            .populate('assignedToId', 'name email role')
            .populate('relatedWorkerId', 'name email role')
            .populate('orderId')
            .populate('closedByAdminId', 'name email role')
            .populate('responses.responderId', 'name email role');
        if (!complaint) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
            return;
        }
        // Make sure user is complaint owner or admin
        if (complaint.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.FORBIDDEN, 'Not authorized to access this complaint');
            return;
        }
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Complaint details retrieved successfully', complaint);
    }
    catch (err) {
        next(err);
    }
};
exports.getComplaint = getComplaint;
/**
 * @desc    Create complaint (Customer only)
 * @route   POST /api/v1/complaints
 * @access  Private
 */
const createComplaint = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.VALIDATION_ERROR, 'Validation error', errors.array());
            return;
        }
        // Only customers can create complaints
        if (req.user.role !== 'customer') {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.FORBIDDEN, 'Only customers can create complaints');
            return;
        }
        // Add user to req.body
        req.body.userId = req.user._id;
        const complaint = await Complaint_1.default.create(req.body);
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.CREATED, 'Complaint created successfully', complaint);
    }
    catch (err) {
        next(err);
    }
};
exports.createComplaint = createComplaint;
/**
 * @desc    Add response to complaint
 * @route   POST /api/v1/complaints/:id/responses
 * @access  Private
 */
const addResponse = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.VALIDATION_ERROR, 'Validation error', errors.array());
            return;
        }
        const complaint = await Complaint_1.default.findById(req.params.id);
        if (!complaint) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
            return;
        }
        // Check if user is authorized (must be complaint owner or admin)
        if (complaint.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.FORBIDDEN, 'Not authorized to respond to this complaint');
            return;
        }
        // Check if complaint is closed
        if (complaint.status === ComplaintStatus.CLOSED) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.BAD_REQUEST, 'Cannot respond to a closed complaint');
            return;
        }
        const response = {
            message: req.body.message,
            responderId: req.user._id,
            responderRole: req.user.role,
            attachments: req.body.attachments || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        complaint.responses.push(response);
        // If it's an admin response, update the status to 'in_progress'
        if (req.user.role === 'admin' && complaint.status === ComplaintStatus.PENDING) {
            complaint.status = ComplaintStatus.IN_PROGRESS;
        }
        // If it's a customer response, update the status to 'pending'
        else if (req.user.role === 'customer' && complaint.status === ComplaintStatus.IN_PROGRESS) {
            complaint.status = ComplaintStatus.PENDING;
        }
        await complaint.save();
        // Fetch the updated complaint with populated fields
        const updatedComplaint = await Complaint_1.default.findById(req.params.id)
            .populate('userId', 'name email role')
            .populate('assignedToId', 'name email role')
            .populate('relatedWorkerId', 'name email role')
            .populate('orderId')
            .populate('closedByAdminId', 'name email role')
            .populate('responses.responderId', 'name email role');
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Response added successfully', updatedComplaint);
    }
    catch (err) {
        next(err);
    }
};
exports.addResponse = addResponse;
/**
 * @desc    Update complaint (Admin only)
 * @route   PUT /api/v1/complaints/:id
 * @access  Private/Admin
 */
const updateComplaint = async (req, res, next) => {
    try {
        let complaint = await Complaint_1.default.findById(req.params.id);
        if (!complaint) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
            return;
        }
        // If status is being changed to closed, add closedAt and closedByAdminId
        if (req.body.status === ComplaintStatus.CLOSED) {
            req.body.closedAt = new Date();
            req.body.closedByAdminId = req.user._id;
        }
        complaint = await Complaint_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('userId', 'name email role')
            .populate('assignedToId', 'name email role')
            .populate('relatedWorkerId', 'name email role')
            .populate('orderId')
            .populate('closedByAdminId', 'name email role')
            .populate('responses.responderId', 'name email role');
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Complaint updated successfully', complaint);
    }
    catch (err) {
        next(err);
    }
};
exports.updateComplaint = updateComplaint;
/**
 * @desc    Delete complaint (Admin only)
 * @route   DELETE /api/v1/complaints/:id
 * @access  Private/Admin
 */
const deleteComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint_1.default.findById(req.params.id);
        if (!complaint) {
            (0, responseHandler_1.errorResponse)(res, responseHandler_1.STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
            return;
        }
        await complaint.deleteOne();
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.OK, 'Complaint deleted successfully', null);
    }
    catch (err) {
        next(err);
    }
};
exports.deleteComplaint = deleteComplaint;
/**
 * @desc    Add a specific complaint with ID 5
 * @route   POST /api/v1/complaints/add-five
 * @access  Private/Admin
 */
const addComplaintFive = async (req, res, next) => {
    try {
        // Create a new complaint with specific ID
        const complaint = new Complaint_1.default({
            _id: new mongoose_1.Types.ObjectId('000000000000000000000005'),
            title: 'Service Quality Issue',
            description: 'The service provided did not meet the expected quality standards. The worker arrived late and did not complete all the required tasks.',
            category: 'service',
            priority: 'high',
            status: 'pending',
            orderId: new mongoose_1.Types.ObjectId(), // You'll need to provide a valid order ID
            userId: req.user._id,
            responses: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await complaint.save();
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.CREATED, 'Complaint #5 created successfully', complaint);
    }
    catch (err) {
        next(err);
    }
};
exports.addComplaintFive = addComplaintFive;
/**
 * @desc    Add 5 sample complaints
 * @route   POST /api/v1/complaints/add-samples
 * @access  Private/Admin
 */
const addSampleComplaints = async (req, res, next) => {
    try {
        // First create sample orders
        const sampleOrders = [
            {
                userId: req.user._id,
                serviceId: new mongoose_1.Types.ObjectId(), // You'll need to provide a valid service ID
                totalAmount: 150.00,
                scheduledDate: new Date(),
                status: 'completed',
                paymentStatus: 'paid'
            },
            {
                userId: req.user._id,
                serviceId: new mongoose_1.Types.ObjectId(),
                totalAmount: 200.00,
                scheduledDate: new Date(),
                status: 'in_progress',
                paymentStatus: 'paid'
            },
            {
                userId: req.user._id,
                serviceId: new mongoose_1.Types.ObjectId(),
                totalAmount: 175.00,
                scheduledDate: new Date(),
                status: 'completed',
                paymentStatus: 'paid'
            },
            {
                userId: req.user._id,
                serviceId: new mongoose_1.Types.ObjectId(),
                totalAmount: 125.00,
                scheduledDate: new Date(),
                status: 'completed',
                paymentStatus: 'paid'
            },
            {
                userId: req.user._id,
                serviceId: new mongoose_1.Types.ObjectId(),
                totalAmount: 300.00,
                scheduledDate: new Date(),
                status: 'completed',
                paymentStatus: 'paid'
            }
        ];
        const createdOrders = await Order_1.default.insertMany(sampleOrders);
        // Now create complaints using the order IDs
        const sampleComplaints = [
            {
                title: 'Late Service Delivery',
                description: 'The service was delivered 2 hours later than the scheduled time, causing inconvenience.',
                category: 'service',
                priority: 'high',
                status: 'pending',
                orderId: createdOrders[0]._id,
                userId: req.user._id
            },
            {
                title: 'Worker Behavior Issue',
                description: 'The assigned worker was unprofessional and did not follow proper safety protocols.',
                category: 'worker',
                priority: 'urgent',
                status: 'in_progress',
                orderId: createdOrders[1]._id,
                userId: req.user._id
            },
            {
                title: 'Payment Processing Error',
                description: 'Double charged for the service. Need immediate refund processing.',
                category: 'payment',
                priority: 'high',
                status: 'pending',
                orderId: createdOrders[2]._id,
                userId: req.user._id
            },
            {
                title: 'App Technical Issue',
                description: 'Unable to track service status through the mobile app. App keeps crashing.',
                category: 'technical',
                priority: 'medium',
                status: 'pending',
                orderId: createdOrders[3]._id,
                userId: req.user._id
            },
            {
                title: 'General Feedback',
                description: 'Would like to provide feedback about the overall service experience.',
                category: 'other',
                priority: 'low',
                status: 'pending',
                orderId: createdOrders[4]._id,
                userId: req.user._id
            }
        ];
        const createdComplaints = await Complaint_1.default.insertMany(sampleComplaints);
        (0, responseHandler_1.successResponse)(res, responseHandler_1.STATUS_CODES.CREATED, '5 sample complaints created successfully', {
            orders: createdOrders,
            complaints: createdComplaints
        });
    }
    catch (err) {
        next(err);
    }
};
exports.addSampleComplaints = addSampleComplaints;
//# sourceMappingURL=complaintController.js.map