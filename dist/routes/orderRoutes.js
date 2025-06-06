"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply protect middleware to all routes
router.use(auth_1.protect);
/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
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
 *     Order:
 *       type: object
 *       required:
 *         - userId
 *         - items
 *         - totalAmount
 *         - scheduledDate
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated order ID
 *         userId:
 *           type: string
 *           description: ID of user who placed the order
 *         workerId:
 *           type: string
 *           description: ID of worker assigned to the order
 *         complaintId:
 *           type: string
 *           description: ID of associated complaint if any
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *           description: Array of items in the order
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *           default: pending
 *           description: Current status of the order
 *         totalAmount:
 *           type: number
 *           description: Total amount of the order
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           default: pending
 *           description: Payment status of the order
 *         scheduledDate:
 *           type: string
 *           format: date-time
 *           description: Scheduled date for the order
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the order was completed
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           description: Date when the order was cancelled
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the order was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the order was last updated
 */
/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
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
 *         name: order
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
 *         description: List of all orders
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
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', (0, auth_1.authorize)('admin'), orderController_1.getOrders);
/**
 * @swagger
 * /api/v1/orders/my-orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
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
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authorized
 */
router.get('/my-orders', orderController_1.getMyOrders);
/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get single order
 *     tags: [Orders]
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
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Order not found
 */
router.get('/:id', orderController_1.getOrder);
/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
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
 *               - scheduledDate
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
 *                     isBreakable:
 *                       type: boolean
 *               totalAmount:
 *                 type: number
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               workerId:
 *                 type: string
 *               complaintId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 */
router.post('/', [
    (0, express_validator_1.body)('items')
        .isArray()
        .withMessage('Items must be an array')
        .notEmpty()
        .withMessage('At least one item is required'),
    (0, express_validator_1.body)('items.*.name')
        .notEmpty()
        .withMessage('Item name is required')
        .isLength({ max: 100 })
        .withMessage('Item name cannot be more than 100 characters'),
    (0, express_validator_1.body)('items.*.weight')
        .isNumeric()
        .withMessage('Item weight must be a number')
        .isFloat({ min: 0 })
        .withMessage('Item weight cannot be negative'),
    (0, express_validator_1.body)('items.*.images')
        .isArray()
        .withMessage('Images must be an array')
        .notEmpty()
        .withMessage('At least one image is required'),
    (0, express_validator_1.body)('items.*.images.*')
        .isString()
        .withMessage('Image must be a string')
        .trim()
        .notEmpty()
        .withMessage('Image URL cannot be empty'),
    (0, express_validator_1.body)('items.*.isBreakable')
        .isBoolean()
        .withMessage('isBreakable must be a boolean'),
    (0, express_validator_1.body)('totalAmount')
        .isNumeric()
        .withMessage('Total amount must be a number')
        .isFloat({ min: 0 })
        .withMessage('Total amount cannot be negative'),
    (0, express_validator_1.body)('scheduledDate')
        .isISO8601()
        .withMessage('Scheduled date must be a valid date'),
    (0, express_validator_1.body)('workerId')
        .optional()
        .isMongoId()
        .withMessage('Invalid worker ID'),
    (0, express_validator_1.body)('complaintId')
        .optional()
        .isMongoId()
        .withMessage('Invalid complaint ID')
], orderController_1.createOrder);
/**
 * @swagger
 * /api/v1/orders/{id}:
 *   put:
 *     summary: Update order (Admin only)
 *     tags: [Orders]
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
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Order not found
 */
router.put('/:id', (0, auth_1.authorize)('admin'), [
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Invalid status'),
    (0, express_validator_1.body)('paymentStatus')
        .optional()
        .isIn(['pending', 'paid', 'failed', 'refunded'])
        .withMessage('Invalid payment status'),
    (0, express_validator_1.body)('workerId')
        .optional()
        .isMongoId()
        .withMessage('Invalid worker ID'),
    (0, express_validator_1.body)('complaintId')
        .optional()
        .isMongoId()
        .withMessage('Invalid complaint ID'),
    (0, express_validator_1.body)('items')
        .optional()
        .isArray()
        .withMessage('Items must be an array')
        .notEmpty()
        .withMessage('At least one item is required'),
    (0, express_validator_1.body)('items.*.name')
        .optional()
        .notEmpty()
        .withMessage('Item name is required')
        .isLength({ max: 100 })
        .withMessage('Item name cannot be more than 100 characters'),
    (0, express_validator_1.body)('items.*.weight')
        .optional()
        .isNumeric()
        .withMessage('Item weight must be a number')
        .isFloat({ min: 0 })
        .withMessage('Item weight cannot be negative'),
    (0, express_validator_1.body)('items.*.images')
        .optional()
        .isArray()
        .withMessage('Images must be an array')
        .notEmpty()
        .withMessage('At least one image is required'),
    (0, express_validator_1.body)('items.*.images.*')
        .optional()
        .isString()
        .withMessage('Image must be a string')
        .trim()
        .notEmpty()
        .withMessage('Image URL cannot be empty'),
    (0, express_validator_1.body)('items.*.isBreakable')
        .optional()
        .isBoolean()
        .withMessage('isBreakable must be a boolean')
], orderController_1.updateOrder);
/**
 * @swagger
 * /api/v1/orders/{id}:
 *   delete:
 *     summary: Delete order (Admin only)
 *     tags: [Orders]
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
 *         description: Order deleted successfully
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
 *         description: Order not found
 */
router.delete('/:id', (0, auth_1.authorize)('admin'), orderController_1.deleteOrder);
/**
 * @swagger
 * /api/v1/orders/add-samples:
 *   post:
 *     summary: Add sample orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Sample orders created successfully
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
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/add-samples', (0, auth_1.authorize)('admin'), orderController_1.addSampleOrders);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map