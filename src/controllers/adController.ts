import { Request, Response, NextFunction } from "express";
import Ad from "../models/Ad";
import ErrorResponse from "../utils/errorResponse";

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
	const ads = await Ad.find({ expireDate: { $gt: new Date() } }).populate({
		path: "createdByAdminId",
		select: "name email",
	});

	res.status(200).json({
		success: true,
		count: ads.length,
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
