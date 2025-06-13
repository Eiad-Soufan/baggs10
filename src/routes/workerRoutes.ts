import express, { Router } from 'express';
import { body } from 'express-validator';
import {
  getWorkers,
  getWorker,
  createWorker,
  updateWorker,
  deleteWorker
} from '../controllers/workerController';

import { protect, authorize } from '../middleware/auth';

const router: Router = express.Router();

// Apply protection to all routes
router.use(protect);
// Remove global admin authorization for all routes
// router.use(authorize('admin'));

/**
 * @swagger
 * /api/v1/workers:
 *   get:
 *     summary: Get all workers
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all workers
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.get('/',authorize('admin'), getWorkers);

/**
 * @swagger
 * /api/v1/workers/{id}:
 *   get:
 *     summary: Get single worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Worker id
 *     responses:
 *       200:
 *         description: Worker data
 *       404:
 *         description: Worker not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.get('/:id', getWorker);

/**
 * @swagger
 * /api/v1/workers:
 *   post:
 *     summary: Create a new worker
 *     tags: [Workers]
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
 *               - experience
 *               - timeFormat
 *               - role
 *               - identityNumber
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               identityNumber:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               experience:
 *                 type: number
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
 *               role:
 *                 type: string
 *                 enum: [worker, manager, supervisor]
 *                 default: worker
 *     responses:
 *       201:
 *         description: Worker created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Worker'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('identityNumber').not().isEmpty().withMessage('Identity Number is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('phone').not().isEmpty().withMessage('Phone number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('experience')
      .isNumeric()
      .withMessage('Experience must be a number'),
    body('preferredLang')
      .optional()
      .isString()
      .withMessage('Preferred language must be a string'),
    body('region')
      .optional()
      .isString()
      .withMessage('Region must be a string'),
    body('timeFormat')
      .isIn(['12', '24'])
      .withMessage('Time format must be either 12 or 24'),
    body('image')
      .optional()
      .isString()
      .withMessage('Image must be a string'),
    body('role')
      .isIn(['worker', 'manager' , 'supervisor'])
      .withMessage('Role must be either worker, manager or supervisor'),
    
  ],
  createWorker
);

/**
 * @swagger
 * /api/v1/workers/{id}:
 *   put:
 *     summary: Update a worker
 *     tags: [Workers]
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               experience:
 *                 type: number
 *               preferredLang:
 *                 type: string
 *               region:
 *                 type: string
 *               timeFormat:
 *                 type: string
 *                 enum: [12, 24]
 *               image:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [worker,manager,supervisor]
 *     responses:
 *       200:
 *         description: Worker updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden. Only admin or the worker themselves can update.
 *       404:
 *         description: Worker not found
 */
router.put(
  '/:id',
  [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please include a valid email'),
    body('phone')
      .optional()
      .not()
      .isEmpty()
      .withMessage('Phone number is required'),
    body('name')
      .optional()
      .not()
      .isEmpty()
      .withMessage('Name is required'),
    body('experience')
      .optional()
      .isNumeric()
      .withMessage('Experience must be a number'),
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
      .withMessage('Image must be a string'),
    body('role')
      .optional()
      .isIn(['worker', 'manager' , 'supervisor'])
      .withMessage('Role must be either worker, manager or supervisor')
  ],
  updateWorker
);

/**
 * @swagger
 * /api/v1/workers/{id}:
 *   delete:
 *     summary: Delete worker
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Worker id
 *     responses:
 *       200:
 *         description: Worker deleted successfully
 *       404:
 *         description: Worker not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden. Only admin or the worker themselves can delete.
 */
router.delete('/:id', deleteWorker);

export default router; 