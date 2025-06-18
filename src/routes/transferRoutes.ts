import express from "express";
import { body } from "express-validator";
import {
	getTransfers,
	getTransfer,
	getMyTransfers,
	createTransfer,
	updateTransfer,
	deleteTransfer,
	addSampleTransfers,
	getTransfersStats,
} from "../controllers/transferController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     TransferRating:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating value between 1 and 5
 *         comment:
 *           type: string
 *           maxLength: 500
 *           description: Optional comment about the transfer
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the rating was created
 *     TransferItem:
 *       type: object
 *       required:
 *         - name
 *         - weight
 *         - images
 *         - isBreakable
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the item
 *         weight:
 *           type: number
 *           description: Weight of the item
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         isBreakable:
 *           type: boolean
 *           description: Whether the item is breakable
 *     Transfer:
 *       type: object
 *       required:
 *         - userId
 *         - items
 *         - totalAmount
 *         - deliveryDate
 *         - from
 *         - to
 *         - pickUpDate
 *         - pickUpTime
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated transfer ID
 *         userId:
 *           type: string
 *           description: ID of user who placed the transfer
 *         workerId:
 *           type: string
 *           description: ID of worker assigned to the transfer
 *         complaintId:
 *           type: string
 *           description: ID of associated complaint if any
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TransferItem'
 *           description: Array of items in the transfer
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *           default: pending
 *           description: Current status of the transfer
 *         totalAmount:
 *           type: number
 *           description: Total amount of the transfer
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           default: pending
 *           description: Payment status of the transfer
 *         deliveryDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled date for the transfer
 *         from:
 *           type: string
 *           description: Pickup location
 *         to:
 *           type: string
 *           description: Delivery location
 *         flightGate:
 *           type: string
 *           description: Flight gate number (optional)
 *         flightNumber:
 *           type: string
 *           description: Flight number (optional)
 *         pickUpDate:
 *           type: string
 *           format: date
 *           description: Date of pickup
 *         pickUpTime:
 *           type: string
 *           description: Time of pickup
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the transfer was completed
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           description: Date when the transfer was cancelled
 *         rating:
 *           $ref: '#/components/schemas/TransferRating'
 *           description: Rating and feedback for the transfer
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the transfer was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the transfer was last updated
 */

/**
 * @swagger
 * /api/v1/transfers:
 *   get:
 *     summary: Get all transfers (Admin only)
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: transfer
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all transfers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transfer'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get("/", authorize("admin"), getTransfers);

/**
 * @swagger
 * /api/v1/transfers/my-transfers:
 *   get:
 *     summary: Get user's transfers
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's transfers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transfer'
 *       401:
 *         description: Not authorized
 */
router.get("/my-transfers", getMyTransfers);

/**
 * @swagger
 * /api/v1/transfers/stats:
 *   get:
 *     summary: Get transfer statistics (today, current, cancelled, and percent change vs yesterday) admin only
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     description: Returns today's transfers, current transfers, cancelled transfers, and percent change vs yesterday. Admin only.
 *     responses:
 *       200:
 *         description: Transfer statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     todaysTransfers:
 *                       type: integer
 *                     todaysTransfersChange:
 *                       type: string
 *                     currentTransfers:
 *                       type: integer
 *                     currentTransfersChange:
 *                       type: string
 *                     cancelledTransfers:
 *                       type: integer
 *                     cancelledTransfersChange:
 *                       type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.get("/stats", authorize("admin"), getTransfersStats);

/**
 * @swagger
 * /api/v1/transfers/{id}:
 *   get:
 *     summary: Get single transfer
 *     tags: [Transfers]
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
 *         description: Transfer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transfer'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Transfer not found
 */
router.get("/:id", getTransfer);

/**
 * @swagger
 * /api/v1/transfers:
 *   post:
 *     summary: Create new transfer
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - totalAmount
 *               - deliveryDate
 *               - from
 *               - to
 *               - pickUpDate
 *               - pickUpTime
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - weight
 *                     - images
 *                     - isBreakable
 *                   properties:
 *                     name:
 *                       type: string
 *                     weight:
 *                       type: number
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of image URLs (required)
 *                     isBreakable:
 *                       type: boolean
 *               totalAmount:
 *                 type: number
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *               from:
 *                 type: string
 *                 description: Pickup location
 *               to:
 *                 type: string
 *                 description: Delivery location
 *               flightGate:
 *                 type: string
 *                 description: Flight gate number (optional)
 *               flightNumber:
 *                 type: string
 *                 description: Flight number (optional)
 *               pickUpDate:
 *                 type: string
 *                 format: date
 *                 description: Date of pickup
 *               pickUpTime:
 *                 type: string
 *                 description: Time of pickup
 *               workerId:
 *                 type: string
 *               complaintId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transfer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transfer'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 */
router.post(
	"/",
	[
		body("items")
			.isArray()
			.withMessage("Items must be an array")
			.notEmpty()
			.withMessage("At least one item is required"),
		body("items.*.name")
			.notEmpty()
			.withMessage("Item name is required")
			.isLength({ max: 100 })
			.withMessage("Item name cannot be more than 100 characters"),
		body("items.*.weight")
			.isNumeric()
			.withMessage("Item weight must be a number")
			.isFloat({ min: 0 })
			.withMessage("Item weight cannot be negative"),
		body("items.*.images")
			.isArray()
			.notEmpty()
			.withMessage("Images must be an array")
			.withMessage("3 image is required"),
		body("items.*.images.*")
			.isString()
			.withMessage("Image must be a string")
			.trim()
			.notEmpty()
			.withMessage("Image URL cannot be empty"),
		body("items.*.isBreakable").optional().isBoolean(),
		body("totalAmount")
			.isNumeric()
			.withMessage("Total amount must be a number")
			.isFloat({ min: 0 })
			.withMessage("Total amount cannot be negative"),
		body("deliveryDate")
			.isISO8601()
			.withMessage("Delivery date must be a valid date"),
		body("from")
			.notEmpty()
			.withMessage("From location is required")
			.isString()
			.withMessage("From location must be a string"),
		body("to")
			.notEmpty()
			.withMessage("To location is required")
			.isString()
			.withMessage("To location must be a string"),
		body("flightGate")
			.optional()
			.isString()
			.withMessage("Flight gate must be a string"),
		body("flightNumber")
			.optional()
			.isString()
			.withMessage("Flight number must be a string"),
		body("pickUpDate")
			.isISO8601()
			.withMessage("Pick up date must be a valid date"),
		body("pickUpTime")
			.notEmpty()
			.withMessage("Pick up time is required")
			.isString()
			.withMessage("Pick up time must be a string"),
		body("deliveryTime")
			.notEmpty()
			.withMessage("Delivery time is required")
			.isString()
			.withMessage("Delivery time must be a string"),
		body("workerId").optional().isMongoId().withMessage("Invalid worker ID"),
		body("complaintId")
			.optional()
			.isMongoId()
			.withMessage("Invalid complaint ID"),
	],
	createTransfer
);

/**
 * @swagger
 * /api/v1/transfers/{id}:
 *   put:
 *     summary: Update transfer (Admin only)
 *     tags: [Transfers]
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
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, refunded]
 *               workerId:
 *                 type: string
 *               complaintId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     weight:
 *                       type: number
 *                     images:
 *                       type: array
 *                     isBreakable:
 *                       type: boolean
 *               from:
 *                 type: string
 *                 description: Pickup location
 *               to:
 *                 type: string
 *                 description: Delivery location
 *               flightGate:
 *                 type: string
 *                 description: Flight gate number (optional)
 *               flightNumber:
 *                 type: string
 *                 description: Flight number (optional)
 *               pickUpDate:
 *                 type: string
 *                 format: date
 *                 description: Date of pickup
 *               pickUpTime:
 *                 type: string
 *                 description: Time of pickup
 *               rating:
 *                 type: object
 *                 properties:
 *                   rating:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *                   comment:
 *                     type: string
 *                     maxLength: 500
 *     responses:
 *       200:
 *         description: Transfer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transfer'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Transfer not found
 */
router.put(
	"/:id",
	[
		body("status")
			.optional()
			.isIn(["pending", "in_progress", "completed", "cancelled"])
			.withMessage("Invalid status"),
		body("paymentStatus")
			.optional()
			.isIn(["pending", "paid", "failed", "refunded"])
			.withMessage("Invalid payment status"),
		body("workerId").optional().isMongoId().withMessage("Invalid worker ID"),
		body("complaintId")
			.optional()
			.isMongoId()
			.withMessage("Invalid complaint ID"),
		body("items")
			.isArray()
			.withMessage("Items must be an array")
			.notEmpty()
			.withMessage("At least one item is required"),
		body("items.*.name")
			.notEmpty()
			.withMessage("Item name is required")
			.isLength({ max: 100 })
			.withMessage("Item name cannot be more than 100 characters"),
		body("items.*.weight")
			.isNumeric()
			.notEmpty()
			.withMessage("Item name is required, Item weight must be a number")
			.isFloat({ min: 0 })
			.withMessage("Item weight cannot be negative"),
		body("items.*.images")
			.isArray()
			.withMessage("Images must be an array")
			.notEmpty()
			.withMessage("3 image is required"),
		body("items.*.images.*")
			.isString()
			.withMessage("Image must be a string")
			.trim()
			.notEmpty()
			.withMessage("Image URL cannot be empty"),
		body("items.*.isBreakable")
			.optional()
			.isBoolean()
			.withMessage("isBreakable must be a boolean"),
		body("from")
			.optional()
			.isString()
			.withMessage("From location must be a string"),
		body("to")
			.optional()
			.isString()
			.withMessage("To location must be a string"),
		body("flightGate")
			.optional()
			.isString()
			.withMessage("Flight gate must be a string"),
		body("flightNumber")
			.optional()
			.isString()
			.withMessage("Flight number must be a string"),
		body("pickUpDate")
			.optional()
			.isISO8601()
			.withMessage("Pick up date must be a valid date"),
		body("pickUpTime")
			.optional()
			.isString()
			.withMessage("Pick up time must be a string"),
	],
	updateTransfer
);

/**
 * @swagger
 * /api/v1/transfers/{id}:
 *   delete:
 *     summary: Delete transfer (Admin only)
 *     tags: [Transfers]
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
 *         description: Transfer deleted successfully
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
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Transfer not found
 */
router.delete("/:id", authorize("admin"), deleteTransfer);

/**
 * @swagger
 * /api/v1/transfers/add-samples:
 *   post:
 *     summary: Add sample transfers (Admin only)
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Sample transfers created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transfer'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post("/add-samples", authorize("admin"), addSampleTransfers);

export default router;
