"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const complaintController_1 = require("../controllers/complaintController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply protect middleware to all routes
router.use(auth_1.protect);
/**
 * @swagger
 * components:
 *   schemas:
 *     Complaint:
 *       type: object
 *       required:
 *         - orderId
 *         - reason
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated complaint ID
 *         orderId:
 *           type: string
 *           description: ID of the order related to complaint
 *         userId:
 *           type: string
 *           description: ID of user who created the complaint
 *         reason:
 *           type: string
 *           description: Reason for the complaint
 *         status:
 *           type: string
 *           enum: [open, pending, closed]
 *           default: open
 *         responses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               responderId:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         closedAt:
 *           type: string
 *           format: date-time
 *         closedByAdminId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
/**
 * @swagger
 * /api/v1/complaints:
 *   get:
 *     summary: Get all complaints (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, pending, closed]
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
 *         description: List of all complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Complaint'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', (0, auth_1.authorize)('admin'), complaintController_1.getComplaints);
/**
 * @swagger
 * /api/v1/complaints/my-complaints:
 *   get:
 *     summary: Get user's complaints
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Complaint'
 *       401:
 *         description: Not authorized
 */
router.get('/my-complaints', complaintController_1.getMyComplaints);
/**
 * @swagger
 * /api/v1/complaints/{id}:
 *   get:
 *     summary: Get single complaint with chat-like interface
 *     tags: [Complaints]
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
 *         description: Complaint details with messages
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
 *                     complaintId:
 *                       type: string
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           message:
 *                             type: string
 *                           sender:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Complaint not found
 */
router.get('/:id', complaintController_1.getComplaint);
/**
 * @swagger
 * /api/v1/complaints:
 *   post:
 *     summary: Create new complaint (Customer only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - reason
 *             properties:
 *               orderId:
 *                 type: string
 *               reason:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Customer access only
 */
router.post('/', [
    (0, express_validator_1.body)('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 200 })
        .withMessage('Title cannot be more than 200 characters'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 2000 })
        .withMessage('Description cannot be more than 2000 characters'),
    (0, express_validator_1.body)('category')
        .notEmpty()
        .withMessage('Category is required')
        .isIn(['service', 'worker', 'payment', 'technical', 'other'])
        .withMessage('Invalid category'),
    (0, express_validator_1.body)('priority')
        .notEmpty()
        .withMessage('Priority is required')
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority'),
    (0, express_validator_1.body)('orderId')
        .notEmpty()
        .withMessage('Order ID is required')
        .isMongoId()
        .withMessage('Invalid order ID'),
    (0, express_validator_1.body)('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array of strings'),
    (0, express_validator_1.body)('attachments.*')
        .optional()
        .isString()
        .withMessage('Each attachment must be a string')
        .trim()
        .notEmpty()
        .withMessage('Attachment URL cannot be empty')
], complaintController_1.createComplaint);
/**
 * @swagger
 * /api/v1/complaints/{id}/responses:
 *   post:
 *     summary: Add response to complaint
 *     tags: [Complaints]
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
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Response added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         description: Bad request or complaint is closed
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Complaint not found
 */
router.post('/:id/responses', [
    (0, express_validator_1.body)('message')
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ max: 1000 })
        .withMessage('Message cannot be more than 1000 characters'),
    (0, express_validator_1.body)('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array of strings'),
    (0, express_validator_1.body)('attachments.*')
        .optional()
        .isString()
        .withMessage('Each attachment must be a string')
        .trim()
        .notEmpty()
        .withMessage('Attachment URL cannot be empty')
], complaintController_1.addResponse);
/**
 * @swagger
 * /api/v1/complaints/{id}:
 *   put:
 *     summary: Update complaint status (Admin only)
 *     tags: [Complaints]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, open, closed]
 *     responses:
 *       200:
 *         description: Complaint status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Complaint not found
 */
router.put('/:id', (0, auth_1.authorize)('admin'), [
    (0, express_validator_1.body)('title')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Title cannot be more than 200 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description cannot be more than 2000 characters'),
    (0, express_validator_1.body)('category')
        .optional()
        .isIn(['service', 'worker', 'payment', 'technical', 'other'])
        .withMessage('Invalid category'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['pending', 'in_progress', 'resolved', 'rejected', 'closed'])
        .withMessage('Invalid status'),
    (0, express_validator_1.body)('assignedToId')
        .optional()
        .isMongoId()
        .withMessage('Invalid assigned to ID'),
    (0, express_validator_1.body)('relatedWorkerId')
        .optional()
        .isMongoId()
        .withMessage('Invalid related worker ID'),
    (0, express_validator_1.body)('resolution')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Resolution cannot be more than 1000 characters'),
    (0, express_validator_1.body)('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array of strings'),
    (0, express_validator_1.body)('attachments.*')
        .optional()
        .isString()
        .withMessage('Each attachment must be a string')
        .trim()
        .notEmpty()
        .withMessage('Attachment URL cannot be empty')
], complaintController_1.updateComplaint);
/**
 * @swagger
 * /api/v1/complaints/{id}:
 *   delete:
 *     summary: Delete complaint (Admin only)
 *     tags: [Complaints]
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
 *         description: Complaint deleted successfully
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
 *         description: Complaint not found
 */
router.delete('/:id', (0, auth_1.authorize)('admin'), complaintController_1.deleteComplaint);
/**
 * @swagger
 * /api/v1/complaints/add-samples:
 *   post:
 *     summary: Add sample complaints (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sample complaints added successfully
 *       401:
 *         description: Not authorized
 */
router.post('/add-samples', (0, auth_1.authorize)('admin'), complaintController_1.addSampleComplaints);
exports.default = router;
//# sourceMappingURL=complaintRoutes.js.map