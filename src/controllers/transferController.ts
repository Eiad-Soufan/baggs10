import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import Transfer from "../models/Transfer";
import {
	successResponse,
	errorResponse,
	STATUS_CODES,
} from "../utils/responseHandler";
import { Types } from "mongoose";
import { IUser } from "../models/User";
import Notification from "../models/Notification";
import Worker from "../models/Worker";

// Extend Express Request type to include user
declare module "express" {
	interface Request {
		user?: IUser;
	}
}

interface TransferFilters {
	status?: "pending" | "in_progress" | "onTheWay" | "completed" | "cancelled";
	paymentStatus?: "pending" | "paid" | "failed" | "refunded";
	sortBy?: string;
	order?: "asc" | "desc";
	page?: string;
	limit?: string;
	search?: string;
	scheduledDate?: {
		from: string;
		to: string;
	};
}

/**
 * @desc    Get all transfers with advanced filtering (Admin only)
 * @route   GET /api/v1/transfers
 * @access  Private/Admin
 */
export const getTransfers = async (
	req: Request<{}, {}, {}, TransferFilters>,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const {
			status,
			paymentStatus,
			sortBy = "createdAt",
			order = "desc",
			page = "1",
			limit = "10",
			search,
			scheduledDate,
		} = req.query;

		// Build query
		const query: Record<string, any> = {};

		// Status filter
		if (status) {
			query.status = status;
		}

		// Payment status filter
		if (paymentStatus) {
			query.paymentStatus = paymentStatus;
		}

		// Date range filter
		if (scheduledDate?.from && scheduledDate?.to) {
			query.scheduledDate = {
				$gte: new Date(scheduledDate.from),
				$lte: new Date(scheduledDate.to),
			};
		}

		// Search in items name or totalAmount
		if (search) {
			query.$or = [
				{ "items.name": { $regex: search, $options: "i" } },
				{ totalAmount: { $regex: search, $options: "i" } },
			];
		}

		// Pagination
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		const startIndex = (pageNum - 1) * limitNum;
		const total = await Transfer.countDocuments(query);

		const transfers = await Transfer.find(query)
			.populate("userId", "name email")
			.populate("workerId", "name email isAvailable status phoneNumber")
			.populate("complaintId")
			.sort({ [sortBy]: order === "desc" ? -1 : 1 })
			.skip(startIndex)
			.limit(limitNum);

		successResponse(
			res,
			STATUS_CODES.OK,
			"Transfers retrieved successfully",
			transfers,
			{
				pagination: {
					total,
					page: pageNum,
					pages: Math.ceil(total / limitNum),
				},
			}
		);
	} catch (err) {
		next(err);
	}
};

/**
 * @desc    Get user's transfers
 * @route   GET /api/v1/transfers/my-transfers
 * @access  Private
 */
export const getMyTransfers = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const transfers = await Transfer.find({ userId: req.user!._id })
			.populate("workerId", "name email")
			//INFO check letter for serviceId population
			.populate("complaintId", "_id title status")
			.sort("-createdAt");

		successResponse(
			res,
			STATUS_CODES.OK,
			"Your transfers retrieved successfully",
			transfers
		);
	} catch (err) {
		next(err);
	}
};

/**
 * @desc    Get single transfer
 * @route   GET /api/v1/transfers/:id
 * @access  Private
 */
export const getTransfer = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const transfer = await Transfer.findById(req.params.id)
			.populate("userId", "name email")
			.populate("workerId", "name email")
			.populate("complaintId");

		if (!transfer) {
			errorResponse(res, STATUS_CODES.NOT_FOUND, "Transfer not found");
			return;
		}

		// Check if user is admin or the transfer belongs to the user
		if (
			!req.user ||
			(req.user?.role !== "admin" &&
				transfer.userId._id.toString() !== req.user?._id.toString())
		) {
			errorResponse(
				res,
				STATUS_CODES.FORBIDDEN,
				"Not authorized to access this transfer"
			);
			return;
		}

		successResponse(
			res,
			STATUS_CODES.OK,
			"Transfer retrieved successfully",
			transfer
		);
	} catch (err) {
		next(err);
	}
};

/**
 * @desc    Create transfer
 * @route   POST /api/v1/transfers
 * @access  Private
 */
export const createTransfer = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<any> => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			errorResponse(
				res,
				STATUS_CODES.VALIDATION_ERROR,
				"Validation error",
				errors.array()
			);
			return;
		}

		const { items } = req.body;

		// ✅ Validate items existence
		if (!Array.isArray(items) || items.length === 0) {
			return errorResponse(
				res,
				STATUS_CODES.BAD_REQUEST,
				"Transfer must include at least one item"
			);
		}

		// ✅ Validate each item has at least 3 images
		const invalidItem = items.find(
			(item: any) => !Array.isArray(item.images) || item.images.length < 3
		);
		if (invalidItem) {
			return errorResponse(
				res,
				STATUS_CODES.BAD_REQUEST,
				"Each item must include at least 3 images"
			);
		}

		// Add userId to the payload
		req.body.userId = req.user!._id;
		req.body.status = "pending"; // Default status for new transfers
		const transfer = await Transfer.create(req.body);
		successResponse(
			res,
			STATUS_CODES.CREATED,
			"Transfer created successfully",
			transfer
		);
	} catch (err) {
		next(err);
	}
};

/**
 * @desc    Update transfer (Admin only)
 * @route   PUT /api/v1/transfers/:id
 * @access  Private/Admin
 */
export const updateTransfer = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// If status is being changed to completed, add completedAt
		if (req.body.status === "completed") {
			req.body.completedAt = new Date();
		}

		// If status is being changed to cancelled, add cancelledAt
		if (req.body.status === "cancelled") {
			req.body.cancelledAt = new Date();
		}

		if (req.body.workerId) {
			req.body.assigneedAt = new Date();
			req.body.status = "in_progress";
			req.body.acceptedAt = new Date();
		}

		if (req.body.status === "in_progress") {
			req.body.acceptedAt = new Date();
		}

		if (req.body.status === "onTheWay") {
			req.body.onTheWayAt = new Date();
		}

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			errorResponse(
				res,
				STATUS_CODES.VALIDATION_ERROR,
				"Validation error",
				errors.array()
			);
			return;
		}

		// find transfer by id
		let transfer = await Transfer.findById(req.params.id);
		if (!transfer) {
			errorResponse(res, STATUS_CODES.NOT_FOUND, "Transfer not found");
			return;
		}
		if (
			transfer.userId.toString() !== req.user!._id.toString() &&
			req.user!.role !== "admin"
		) {
			errorResponse(
				res,
				STATUS_CODES.FORBIDDEN,
				"You are not authorized to update this transfer"
			);
			return;
		}

		// Store the previous worker ID before updating
		const previousWorkerId = transfer.workerId;

		// if status is being changed create notification for the user
		if (req.body.status && req.body.status !== transfer.status) {
			const notification = new Notification({
				userId: transfer.userId._id,
				message: `Your transfer with ID #${transfer._id
					?.toString()
					.substring(0, 6)} has been updated to ${req.body.status}.`,
				createdBy: req.user!._id,
				title: `transfer Update: #${transfer._id?.toString().substring(0, 6)}`,
				type: "info",
				targetUsers: [transfer.userId._id],
				isGlobal: false,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
				updatedAt: new Date(),
				sendNow: true,
				redirectTo: `/my-transfers/${transfer._id}`,
			});
			await notification.save();
		}

		transfer = await Transfer.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		})
			.populate("userId", "name email")
			.populate("workerId", "name email")
			.populate("complaintId");
		
		// If there was a previous worker and it's different from the new worker, make the previous worker available
		if (previousWorkerId && req.body.workerId && previousWorkerId.toString() !== req.body.workerId.toString()) {
			console.log('Updating previous worker status:', {
				previousWorkerId: previousWorkerId.toString(),
				newWorkerId: req.body.workerId.toString()
			});
			await Worker.findByIdAndUpdate(
				previousWorkerId,
				{
					isAvailable: true,
					status: "Available",
				},
				{ new: true }
			);
			console.log('Previous worker status updated to Available');
		}
		
		if (transfer?.status === "completed" && transfer?.workerId) {
			await Worker.findByIdAndUpdate(
				transfer.workerId._id,
				{
					$inc: { completedJobs: 1 },
					isAvailable: true,
					status: "Available",
					// $push: { serviceRatings: { transferId: transfer._id, rating: 0, comment: '', createdAt: new Date() }}
				},
				{ new: true }
			);
		}
		if ((transfer?.workerId && transfer.status === "in_progress")) {
			await Worker.findByIdAndUpdate(
				transfer?.workerId._id,
				{
					isAvailable: false,
					status: "Assigned",
				},
				{ new: true }
			);
		}
		if (!transfer) {
			errorResponse(res, STATUS_CODES.NOT_FOUND, "Transfer not found");
			return;
		}
		if (req.body.status === "cancelled" && transfer?.workerId) {
			await Worker.findByIdAndUpdate(
				transfer.workerId._id,
				{
					isAvailable: true,
					status: "Available",
				},
				{ new: true }
			);
		}
		if (req.body.status === "onTheWay" && transfer?.workerId) {
			await Worker.findByIdAndUpdate(
				transfer.workerId._id,
				{
					isAvailable: false,
					status: "OnTheWay",
				},
				{ new: true }
			);
		}
		
		if (req.body.workerId) {
			console.log('Assigning new worker:', req.body.workerId.toString());
			await Worker.findByIdAndUpdate(
				req.body.workerId,
				{
					isAvailable: false,
					status: "Assigned",
				},
				{ new: true }
			);
			console.log('New worker status updated to Assigned');
		}

		successResponse(
			res,
			STATUS_CODES.OK,
			"Transfer updated successfully",
			transfer
		);
	} catch (err) {
		next(err);
	}
};

/**
 * @desc    Delete transfer (Admin only)
 * @route   DELETE /api/v1/transfers/:id
 * @access  Private/Admin
 */
export const deleteTransfer = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const transfer = await Transfer.findById(req.params.id);

		if (!transfer) {
			errorResponse(res, STATUS_CODES.NOT_FOUND, "Transfer not found");
			return;
		}
		await transfer.deleteOne();
		successResponse(
			res,
			STATUS_CODES.OK,
			"Transfer deleted successfully",
			null
		);
	} catch (err) {
		next(err);
	}
};

/**
 * @desc    Add 5 sample transfers
 * @route   POST /api/v1/transfers/add-samples
 * @access  Private/Admin
 */
export const addSampleTransfers = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const sampleTransfers = [
			{
				userId: req.user!._id,
				items: [
					{
						name: "Fragile Glass Vase",
						weight: 2.5,
						images: [
							"https://example.com/vase1.jpg",
							"https://example.com/vase2.jpg",
							"https://example.com/vase3.jpg",
						],
						isBreakable: true,
					},
					{
						name: "Wooden Box",
						weight: 5.0,
						images: [
							"https://example.com/box1.jpg",
							"https://example.com/box2.jpg",
							"https://example.com/box3.jpg",
						],
						isBreakable: false,
					},
				],
				workerId: new Types.ObjectId(),
				totalAmount: 150.0,
				deliveryDate: new Date(),
				status: "completed",
				paymentStatus: "paid",
				completedAt: new Date(),
				from: "123 Main St, City A",
				to: "456 Elm St, City B",
				deliveryTime: "2025-12-01T10:00:00Z",
				pickUpDate: new Date(),
				pickUpTime: "2025-12-01T12:00:00Z",
			},
			{
				userId: req.user!._id,
				items: [
					{
						name: "Electronics Package",
						weight: 3.0,
						images: [
							"https://example.com/electronics1.jpg",
							"https://example.com/electronics2.jpg",
							"https://example.com/electronics3.jpg",
						],
						isBreakable: true,
					},
				],
				workerId: new Types.ObjectId(),
				totalAmount: 200.0,
				deliveryDate: new Date(),
				status: "in_progress",
				paymentStatus: "paid",
				completedAt: new Date(),
				from: "New York",
				to: "Los Angeles",
				deliveryTime: "2025-12-01T10:00:00Z",
				pickUpDate: new Date(),
				pickUpTime: "2025-12-01T12:00:00Z",
			},
			{
				userId: req.user!._id,
				items: [
					{
						name: "Furniture Set",
						weight: 25.0,
						images: [
							"https://example.com/furniture1.jpg",
							"https://example.com/furniture2.jpg",
							"https://example.com/furniture3.jpg",
						],
						isBreakable: false,
					},
				],
				workerId: new Types.ObjectId(),
				totalAmount: 175.0,
				deliveryDate: new Date(),
				status: "completed",
				paymentStatus: "paid",
				completedAt: new Date(),
				from: "San Francisco",
				to: "Miami",
				deliveryTime: "2025-12-01T10:00:00Z",
				pickUpDate: new Date(),
				pickUpTime: "2025-12-01T12:00:00Z",
			},
			{
				userId: req.user!._id,
				items: [
					{
						name: "Clothing Package",
						weight: 1.5,
						images: [
							"https://example.com/clothing1.jpg",
							"https://example.com/clothing2.jpg",
							"https://example.com/clothing3.jpg",
						],
						isBreakable: false,
					},
					{
						name: "Shoes Box",
						weight: 2.0,
						images: [
							"https://example.com/shoes1.jpg",
							"https://example.com/shoes2.jpg",
							"https://example.com/shoes3.jpg",
						],
						isBreakable: false,
					},
				],
				totalAmount: 125.0,
				deliveryDate: new Date(),
				status: "pending",
				paymentStatus: "pending",
				completedAt: new Date(),
				from: "Chicago",
				to: "Houston",
				deliveryTime: "2025-12-01T10:00:00Z",
				pickUpDate: new Date(),
				pickUpTime: "2025-12-01T12:00:00Z",
			},
			{
				userId: req.user!._id,
				items: [
					{
						name: "Art Collection",
						weight: 8.0,
						images: [
							"https://example.com/art1.jpg",
							"https://example.com/art2.jpg",
							"https://example.com/art3.jpg",
						],
						isBreakable: true,
					},
				],
				workerId: new Types.ObjectId(),
				complaintId: new Types.ObjectId(),
				totalAmount: 300.0,
				deliveryDate: new Date(),
				status: "cancelled",
				paymentStatus: "refunded",
				cancelledAt: new Date(),
				from: "Chicago",
				to: "Houston",
				deliveryTime: "2025-12-01T10:00:00Z",
				pickUpDate: new Date(),
				pickUpTime: "2025-12-01T12:00:00Z",
			},
		];

		const createdTransfers = await Transfer.insertMany(sampleTransfers);

		successResponse(
			res,
			STATUS_CODES.CREATED,
			"5 sample transfers created successfully",
			createdTransfers
		);
	} catch (err) {
		next(err);
	}
};

/**
 * @desc    Get transfer statistics (today, current, cancelled, and percent change vs yesterday)
 * @route   GET /api/v1/transfers/stats
 * @access  Private/Admin
 */
export const getTransfersStats = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);

		// Today's transfers
		const todaysTransfers = await Transfer.countDocuments({
			createdAt: { $gte: today, $lt: tomorrow },
		});
		// Yesterday's transfers
		const yesterdaysTransfers = await Transfer.countDocuments({
			createdAt: { $gte: yesterday, $lt: today },
		});
		// Current transfers (not completed or cancelled)
		const currentTransfers = await Transfer.countDocuments({
			status: { $in: ["pending", "in_progress"] },
		});
		// Current transfers yesterday
		const currentTransfersYesterday = await Transfer.countDocuments({
			status: { $in: ["pending", "in_progress"] },
			createdAt: { $gte: yesterday, $lt: today },
		});
		// Cancelled transfers today
		const cancelledTransfers = await Transfer.countDocuments({
			status: "cancelled",
			createdAt: { $gte: today, $lt: tomorrow },
		});
		// Cancelled transfers yesterday
		const cancelledTransfersYesterday = await Transfer.countDocuments({
			status: "cancelled",
			createdAt: { $gte: yesterday, $lt: today },
		});

		// Percent change helpers
		function percentChange(todayVal: number, yesterdayVal: number): string {
			if (yesterdayVal === 0) return todayVal === 0 ? "0%" : "100%";
			return (
				(((todayVal - yesterdayVal) / yesterdayVal) * 100).toFixed(2) + "%"
			);
		}

		res.status(200).json({
			success: true,
			data: {
				todaysTransfers,
				todaysTransfersChange: percentChange(
					todaysTransfers,
					yesterdaysTransfers
				),
				currentTransfers,
				currentTransfersChange: percentChange(
					currentTransfers,
					currentTransfersYesterday
				),
				cancelledTransfers,
				cancelledTransfersChange: percentChange(
					cancelledTransfers,
					cancelledTransfersYesterday
				),
			},
		});
	} catch (err) {
		next(err);
	}
};
