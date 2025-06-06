"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorker = exports.updateWorker = exports.createWorker = exports.getWorker = exports.getWorkers = void 0;
const express_validator_1 = require("express-validator");
const Worker_1 = __importDefault(require("../models/Worker"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
/**
 * @desc    Get all workers with filters, pagination and sorting
 * @route   GET /api/v1/workers
 * @access  Private/Admin
 */
const getWorkers = async (req, res, next) => {
    try {
        // Extract query parameters
        const { name, identityNumber, phone, isAvailable, role, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
        // Build query
        const query = {};
        // Add filters if they exist
        if (name) {
            query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
        }
        if (identityNumber) {
            query.identityNumber = identityNumber;
        }
        if (phone) {
            query.phone = { $regex: phone, $options: 'i' }; // Case-insensitive search
        }
        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }
        if (role) {
            query.role = role;
        }
        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = pageNum * limitNum;
        const total = await Worker_1.default.countDocuments(query);
        // Pagination result
        const pagination = {
            total,
            page: pageNum,
            limit: limitNum,
            pageCount: Math.ceil(total / limitNum)
        };
        // Add next page if available
        if (endIndex < total) {
            pagination.next = {
                page: pageNum + 1,
                limit: limitNum
            };
        }
        // Add previous page if available
        if (startIndex > 0) {
            pagination.prev = {
                page: pageNum - 1,
                limit: limitNum
            };
        }
        // Execute query with pagination and sorting
        const workers = await Worker_1.default.find(query)
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .skip(startIndex)
            .limit(limitNum)
            .select('-password');
        res.status(200).json({
            success: true,
            count: workers.length,
            pagination,
            data: workers
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getWorkers = getWorkers;
/**
 * @desc    Get single worker
 * @route   GET /api/v1/workers/:id
 * @access  Private/Admin
 */
const getWorker = async (req, res, next) => {
    try {
        const worker = await Worker_1.default.findById(req.params.id);
        if (!worker) {
            return next(new errorResponse_1.default(`Worker not found with id of ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: worker
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getWorker = getWorker;
/**
 * @desc    Create worker
 * @route   POST /api/v1/workers
 * @access  Private/Admin
 */
const createWorker = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const worker = await Worker_1.default.create(req.body);
        res.status(201).json({
            success: true,
            data: worker
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createWorker = createWorker;
/**
 * @desc    Update worker
 * @route   PUT /api/v1/workers/:id
 * @access  Private/Admin
 */
const updateWorker = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        let worker = await Worker_1.default.findById(req.params.id);
        if (!worker) {
            return next(new errorResponse_1.default(`Worker not found with id of ${req.params.id}`, 404));
        }
        // If password is in the body, remove it
        if (req.body.password) {
            delete req.body.password;
        }
        worker = await Worker_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            success: true,
            data: worker
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateWorker = updateWorker;
/**
 * @desc    Delete worker
 * @route   DELETE /api/v1/workers/:id
 * @access  Private/Admin
 */
const deleteWorker = async (req, res, next) => {
    try {
        const worker = await Worker_1.default.findById(req.params.id);
        if (!worker) {
            return next(new errorResponse_1.default(`Worker not found with id of ${req.params.id}`, 404));
        }
        await worker.deleteOne();
        res.status(200).json({
            success: true,
            data: {}
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteWorker = deleteWorker;
//# sourceMappingURL=workerController.js.map