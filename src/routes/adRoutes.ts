import express, { Router } from "express";
import { body } from "express-validator";
import {
	createAd,
	getAds,
	getAd,
	updateAd,
	deleteAd,
	getAdsStats,
	getAllAds,
} from "../controllers/adController";
import { protect, authorize } from "../middleware/auth";
import cors from 'cors';

const router: Router = express.Router();
router.options('*', cors());
router.use(protect);
router.get('/getAllAds', getAllAds);

/**
 * @swagger
 * components:
 *   schemas:
 *     Ad:
 *       type: object
 *       required:
 *         - expireDate
 *         - createdByAdminId
 *       properties:
 *         url:
 *           type: string
 *           description: Optional URL for the ad
 *         image:
 *           type: string
 *           description: Optional image URL for the ad
 *         expireDate:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the ad
 *         createdByAdminId:
 *           type: string
 *           description: ID of the admin who created the ad
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/ads:
 *   post:
 *     summary: Create a new ad
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expireDate
 *             properties:
 *               url:
 *                 type: string
 *               image:
 *                 type: string
 *               expireDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Ad created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Ad'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */

router.post(
	"/",
	protect,
	authorize("admin"),
	[
    body("title").exists().isString().withMessage("Title must be a string").isLength({ min: 5 }).withMessage("Title cannot be empty"),
		body("url").optional().isURL().withMessage("Please provide a valid URL"),
		body("image").optional().isString().withMessage("Image must be a string"),
		body("expireDate")
			.isISO8601()
			.withMessage("Please provide a valid date in ISO format"),
	],
	createAd
);

/**
 * @swagger
 * /api/v1/ads:
 *   get:
 *     summary: Get all ads
 *     tags: [Ads]
 *     responses:
 *       200:
 *         description: List of ads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ad'
 */

router.get("/", getAds);

/**
 * @swagger
 * /api/v1/ads/getAllAds:
 *   get:
 *     summary: Get all ads (admin only)
 *     tags:
 *       - Ads
 *     description: Returns all ads, including those that are expired. Only accessible by admin users.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with all ads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ad'
 *       403:
 *         description: Forbidden - Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/getAllAds", authorize("admin"), getAllAds);

/**
 * @swagger
 * /api/v1/ads/stats:
 *   get:
 *     tags:
 *       - Ads
 *     summary: Get advertisement statistics (admin only)
 *     description: Returns the total number of ads, how many are active (not expired), and how many are deactive (expired). Only accessible by admin users.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with ad statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalAds:
 *                       type: integer
 *                       example: 120
 *                     activeAds:
 *                       type: integer
 *                       example: 95
 *                     deactiveAds:
 *                       type: integer
 *                       example: 25
 *       403:
 *         description: Forbidden - Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/stats", authorize("admin"), getAdsStats);

/**
 * @swagger
 * /api/v1/ads/{id}:
 *   get:
 *     summary: Get ad by ID
 *     tags: [Ads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ad details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Ad'
 *       404:
 *         description: Ad not found
 */

router.get("/:id", getAd);

/**
 * @swagger
 * /api/v1/ads/{id}:
 *   put:
 *     summary: Update an ad
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               image:
 *                 type: string
 *               expireDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Ad updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Ad'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ad not found
 */

router.put(
	"/:id",
	protect,
	authorize("admin"),
	[
		body("title")
			.exists()
			.isString()
			.withMessage("Title must be a string")
			.isLength({ min: 5 })
			.withMessage("Title cannot be empty"),
		body("url").optional().isURL().withMessage("Please provide a valid URL"),
		body("image").optional().isString().withMessage("Image must be a string"),
		body("expireDate")
			.optional()
			.isISO8601()
			.withMessage("Please provide a valid date in ISO format"),
	],
	updateAd
);

/**
 * @swagger
 * /api/v1/ads/{id}:
 *   delete:
 *     summary: Delete an ad
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ad deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ad not found
 */

router.delete("/:id", protect, authorize("admin"), deleteAd);

export default router;
