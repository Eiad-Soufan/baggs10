import express, { Router } from "express";
import { body } from "express-validator";
import {
	getNotifications,
	getMyNotifications,
	getNotification,
	createNotification,
	updateNotification,
	deleteNotification,
	markAsRead,
  markAllAsRead,
} from "../controllers/notificationController";
import cors from 'cors';
import { protect, authorize } from "../middleware/auth";
import { mutuallyExclusiveSendOptions } from "../middleware/notification";

const router: Router = express.Router();
router.options('*', cors());
// Apply protect middleware to all routes
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated notification ID
 *         title:
 *           type: string
 *           description: Title of the notification
 *         message:
 *           type: string
 *           description: Content of the notification
 *         type:
 *           type: string
 *           enum: [info, warning, error, success]
 *           default: info
 *           description: Type of notification
 *         targetUsers:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who should receive this notification (empty for global)
 *         isGlobal:
 *           type: boolean
 *           default: false
 *           description: Whether this notification is for all users
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When this notification expires (default 30 days)
 *         readBy:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who have read this notification
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get all notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, warning, error, success]
 *       - in: query
 *         name: isGlobal
 *         schema:
 *           type: boolean
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
 *         description: List of all notifications
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
 *                     $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get("/", authorize("admin"), getNotifications);

/**
 * @swagger
 * /api/v1/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all unread notifications as read
 *     description: >
 *       Allows an authenticated user to mark all of their unread notifications as read.
 *       This includes notifications specifically targeted to them or global notifications.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/mark-all-read', markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/my-notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, warning, error, success]
 *         description: Filter notifications by type
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read/unread status
 *     responses:
 *       200:
 *         description: List of user's notifications (filtered by type, read status, and scheduled timing)
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
 *                     $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Not authorized
 */
router.get("/my-notifications", getMyNotifications);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Get single notification
 *     tags: [Notifications]
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
 *         description: Notification details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Notification not found
 */
router.get("/:id", getNotification);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create new notification (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [info, warning, error, success]
 *               targetUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *               isGlobal:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               sendNow:
 *                 type: boolean
 *                 description: Send the notification immediately
 *               sendNotificationOnDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time to send the notification in the future
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  "/",
  authorize("admin"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("message").notEmpty().withMessage("Message is required"),
    body("type")
      .optional()
      .isIn(["info", "warning", "error", "success"])
      .withMessage("Invalid notification type"),
    body("targetUsers").optional().isArray(),
    body("isGlobal").optional().isBoolean(),
    body("expiresAt").optional().isISO8601(),
    body("redirectTo").optional().isString(),
    body("sendNow").optional().isBoolean(),
    body("sendNotificationOnDate").optional().isISO8601(),
    body().custom(mutuallyExclusiveSendOptions),
  ],
  createNotification
);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Notification not found
 */
router.put("/:id/read", markAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   put:
 *     summary: Update notification (Admin only)
 *     tags: [Notifications]
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
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [info, warning, error, success]
 *               targetUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *               isGlobal:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Notification not found
 */
router.put(
	"/:id",
	authorize("admin"),
	[
		body("title").optional(),
		body("message").optional(),
		body("type")
			.optional()
			.isIn(["info", "warning", "error", "success"])
			.withMessage("Invalid notification type"),
		body("targetUsers").optional().isArray(),
		body("isGlobal").optional().isBoolean(),
		body("expiresAt").optional().isISO8601(),
	],
	updateNotification
);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete notification (Admin only)
 *     tags: [Notifications]
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
 *         description: Notification deleted successfully
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
 *         description: Notification not found
 */
router.delete("/:id", authorize("admin"), deleteNotification);

export default router;
