import express, { Router } from 'express';
import { body } from 'express-validator';
import {
  getComplaints,
  getComplaint,
  getMyComplaints,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  addResponse,
  addSampleComplaints,
  getComplaintsStats
} from '../controllers/complaintController';

import { protect, authorize } from '../middleware/auth';

const router: Router = express.Router();

// Apply protect middleware to all routes
//router.use(protect);
router.options('*', cors()); // أضف هذا السطر

router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     Complaint:
 *       type: object
 *       required:
 *         - transferId
 *         - reason
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated complaint ID
 *         transferId:
 *           type: string
 *           description: ID of the transfer related to complaint
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
router.get('/', authorize('admin'), getComplaints);

/**
 * @swagger
 * /api/v1/complaints/stats:
 *   get:
 *     summary: Get complaints stats (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complaints stats
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
 *                     totalComplaints:
 *                       type: integer
 *                     openComplaints:
 *                       type: integer
 *                     solvedComplaints:
 *                       type: integer
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/stats', authorize('admin'), getComplaintsStats);

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
router.get('/my-complaints', getMyComplaints);

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
 *                     transferId:
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
router.get('/:id', getComplaint);

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
 *               - transferId
 *               - reason
 *             properties:
 *               transferId:
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
router.post(
  '/',
  [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot be more than 200 characters'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 2000 })
      .withMessage('Description cannot be more than 2000 characters'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['service', 'worker', 'payment', 'technical', 'other'])
      .withMessage('Invalid category'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('transferId')
      .notEmpty()
      .withMessage('Transfer ID is required')
      .isMongoId()
      .withMessage('Invalid transfer ID'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array of strings'),
    body('attachments.*')
      .optional()
      .isString()
      .withMessage('Each attachment must be a string')
      .trim()
      .notEmpty()
      .withMessage('Attachment URL cannot be empty')
  ],
  createComplaint
);

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
router.post(
  '/:id/responses',
  [
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 1000 })
      .withMessage('Message cannot be more than 1000 characters'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array of strings'),
    body('attachments.*')
      .optional()
      .isString()
      .withMessage('Each attachment must be a string')
      .trim()
      .notEmpty()
      .withMessage('Attachment URL cannot be empty')
  ],
  addResponse
);

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
router.put(
  '/:id',
  authorize('admin'),
  [
    body('title')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Title cannot be more than 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Description cannot be more than 2000 characters'),
    body('category')
      .optional()
      .isIn(['service', 'worker', 'payment', 'technical', 'other'])
      .withMessage('Invalid category'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('status')
      .optional()
      .isIn(['pending', 'in_progress', 'resolved', 'rejected', 'closed'])
      .withMessage('Invalid status'),
    body('assignedToId')
      .optional()
      .isMongoId()
      .withMessage('Invalid assigned to ID'),
    body('relatedWorkerId')
      .optional()
      .isMongoId()
      .withMessage('Invalid related worker ID'),
    body('resolution')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Resolution cannot be more than 1000 characters'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array of strings'),
    body('attachments.*')
      .optional()
      .isString()
      .withMessage('Each attachment must be a string')
      .trim()
      .notEmpty()
      .withMessage('Attachment URL cannot be empty')
  ],
  updateComplaint
);

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
router.delete('/:id', authorize('admin'), deleteComplaint);

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
router.post('/add-samples', authorize('admin'), addSampleComplaints);

export default router; 
