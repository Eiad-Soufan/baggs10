import { Request, Response, NextFunction } from "express";
import Ad from "../models/Ad";
import ErrorResponse from "../utils/errorResponse";

interface PaginationResult {
	next?: {
		page: number;
		limit: number;
	};
	prev?: {
		page: number;
		limit: number;
	};
	total: number;
	page: number;
	limit: number;
	pageCount: number;
}

// @desc    Create new ad
// @route   POST /api/v1/ads
// @access  Private/Admin
export const createAd = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (!req.user || req.user.role !== "admin") {
		return next(new ErrorResponse("Not authorized to access this route", 401));
	}

	const ad = await Ad.create({
		...req.body,
		createdByAdminId: req.user._id,
	});

	res.status(201).json({
		success: true,
		data: ad,
	});
};

// @desc    Get all ads
// @route   GET /api/v1/ads
// @access  Private
export const getAds = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const ads = await Ad.find({
		$and: [
			{
				$or: [
					{ startAt: { $exists: false } },
					{ startAt: { $lte: new Date() } },
				],
			},
			{ expireDate: { $gt: new Date() } },
		],
	}).populate({
		path: "createdByAdminId",
		select: "name email",
	});

	res.status(200).json({
		success: true,
		count: ads.length,
		data: ads,
	});
};

// @desc    Get all ads (Admin only)
// @route   GET /api/v1/getAllAds
// @access  Private/Admin
export const getAllAds = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const {
		page = "1",
		limit = "10",
		sortBy = "createdAt",
		order = "desc",
	} = req.query;
	if (!req.user || req.user.role !== "admin") {
		return next(new ErrorResponse("Not authorized to access this route", 401));
	}
	// Pagination
	const pageNum = parseInt(page as string, 10);
	const limitNum = parseInt(limit as string, 10);
	const startIndex = (pageNum - 1) * limitNum;
	const endIndex = pageNum * limitNum;
	const total = await Ad.countDocuments({});
	// Pagination result
	const pagination: PaginationResult = {
		total,
		page: pageNum,
		limit: limitNum,
		pageCount: Math.ceil(total / limitNum),
	};

	// Add next page if available
	if (endIndex < total) {
		pagination.next = {
			page: pageNum + 1,
			limit: limitNum,
		};
	}

	// Add previous page if available
	if (startIndex > 0) {
		pagination.prev = {
			page: pageNum - 1,
			limit: limitNum,
		};
	}

	// Execute query with pagination and sorting
	const ads = await Ad.find()
		.populate({
			path: "createdByAdminId",
			select: "name email",
		})
		.sort({ [sortBy as string]: order === "desc" ? -1 : 1 })
		.skip(startIndex)
		.limit(limitNum);

	res.status(200).json({
		success: true,
		count: ads.length,
		pagination,
		data: ads,
	});
};

// @desc    Get single ad
// @route   GET /api/v1/ads/:id
// @access  Public
export const getAd = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const ad = await Ad.findById(req.params.id).populate({
		path: "createdByAdminId",
		select: "name email",
	});

	if (!ad) {
		return next(
			new ErrorResponse(`Ad not found with id of ${req.params.id}`, 404)
		);
	}

	res.status(200).json({
		success: true,
		data: ad,
	});
};

// @desc    Update ad
// @route   PUT /api/v1/ads/:id
// @access  Private/Admin
export const updateAd = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (!req.user || req.user.role !== "admin") {
		return next(new ErrorResponse("Not authorized to access this route", 401));
	}

	let ad = await Ad.findById(req.params.id);

	if (!ad) {
		return next(
			new ErrorResponse(`Ad not found with id of ${req.params.id}`, 404)
		);
	}

	// Make sure user is ad owner
	if (ad.createdByAdminId.toString() !== req.user._id.toString()) {
		return next(
			new ErrorResponse(
				`User ${req.user._id} is not authorized to update this ad`,
				401
			)
		);
	}

	ad = await Ad.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		data: ad,
	});
};

// @desc    Delete ad
// @route   DELETE /api/v1/ads/:id
// @access  Private/Admin
export const deleteAd = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (!req.user || req.user.role !== "admin") {
		return next(new ErrorResponse("Not authorized to access this route", 401));
	}

	const ad = await Ad.findById(req.params.id);

	if (!ad) {
		return next(
			new ErrorResponse(`Ad not found with id of ${req.params.id}`, 404)
		);
	}

	// Make sure user is ad owner
	if (ad.createdByAdminId.toString() !== req.user._id.toString()) {
		return next(
			new ErrorResponse(
				`User ${req.user._id} is not authorized to delete this ad`,
				401
			)
		);
	}

	await ad.deleteOne();

	res.status(200).json({
		success: true,
		data: {},
	});
};

/**
 * @desc    Get ads stats (Admin only)
 * @route   GET /api/v1/ads/stats
 * @access  Private/Admin
 */
export const getAdsStats = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	// Only admin can access this route
	if (!req.user || req.user.role !== "admin") {
		return next(new ErrorResponse("Not authorized to access this route", 403));
	}
	try {
		const totalAds = await Ad.countDocuments({});
		const activeAds = await Ad.countDocuments({
			expireDate: { $gt: new Date() },
		});
		const deactiveAds = await Ad.countDocuments({
			expireDate: { $lte: new Date() },
		});
		res.status(200).json({
			success: true,
			data: {
				totalAds,
				activeAds,
				deactiveAds,
			},
		});
	} catch (err) {
		next(err);
	}
};
