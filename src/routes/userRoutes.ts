import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController';

import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Apply protection to all routes
//router.use(protect);
router.options('*', cors()); // أضف هذا السطر
router.use(protect);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated user ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phone:
 *           type: string
 *           description: User's phone number
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (min 6 characters)
 *         identityNumber:
 *           type: string
 *           description: User's identity number (optional)
 *         isAvailable:
 *           type: boolean
 *           default: true
 *           description: Whether the user is available
 *         role:
 *           type: string
 *           enum: [customer, admin]
 *           default: customer
 *           description: User's role
 *         preferredLang:
 *           type: string
 *           default: en
 *           description: User's preferred language
 *         region:
 *           type: string
 *           description: User's region (optional)
 *         timeFormat:
 *           type: string
 *           enum: [12, 24]
 *           default: 24
 *           description: User's preferred time format
 *         image:
 *           type: string
 *           description: URL of user's profile image (optional)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was last updated
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.get('/',authorize('admin'), getUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get single user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User id
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.get('/:id', getUser);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - informationPreference
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               identityNumber:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *               role:
 *                 type: string
 *                 enum: [customer, admin]
 *               preferredLang:
 *                 type: string
 *                 default: en
 *               region:
 *                 type: string
 *               timeFormat:
 *                 type: string
 *                 enum: [12, 24]
 *                 default: 24
 *               image:
 *                 type: string
 *               informationPreference:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, sms, call]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('phone').not().isEmpty().withMessage('Phone number is required'),
    body('informationPreference').not().isEmpty().isArray().withMessage('informationPreference is required, and must be an array of strings [email, sms, call]'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('preferredLang')
      .optional()
      .isString()
      .withMessage('Preferred language must be a string'),
    body('region')
      .optional()
      .isString()
      .withMessage('Region must be a string'),
    body('timeFormat')
      .optional()
      .isIn(['12', '24'])
      .withMessage('Time format must be either 12 or 24'),
    body('image')
      .optional()
      .isString()
      .withMessage('Image must be a string')
  ],
  createUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               identityNumber:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *               role:
 *                 type: string
 *                 enum: [customer, admin]
 *               preferredLang:
 *                 type: string
 *                 default: en
 *               region:
 *                 type: string
 *               timeFormat:
 *                 type: string
 *                 enum: [12, 24]
 *                 default: 24
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden. Only admin or the user themselves can update.
 */
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Please include a valid email'),
    body('phone').optional(),
    body('name').optional(),
    body('preferredLang')
      .optional()
      .isString()
      .withMessage('Preferred language must be a string'),
    body('region')
      .optional()
      .isString()
      .withMessage('Region must be a string'),
    body('timeFormat')
      .optional()
      .isIn(['12', '24'])
      .withMessage('Time format must be either 12 or 24'),
    body('image')
      .optional()
      .isString()
      .withMessage('Image must be a string')
  ],
  updateUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User id
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden. Only admin or the user themselves can delete.
 */
router.delete('/:id', deleteUser);

export default router; 
