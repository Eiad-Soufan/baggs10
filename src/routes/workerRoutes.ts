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
// Apply admin authorization to all routes
router.use(authorize('admin'));

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
router.get('/', getWorkers);

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
 *     summary: Create new worker
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
 *                 enum: [worker, admin]
 *     responses:
 *       201:
 *         description: Worker created successfully
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
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  createWorker
);

/**
 * @swagger
 * /api/v1/workers/{id}:
 *   put:
 *     summary: Update worker
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
 *                 enum: [worker, admin]
 *     responses:
 *       200:
 *         description: Worker updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Worker not found
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Please include a valid email'),
    body('phone').optional(),
    body('name').optional()
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
 *         description: Forbidden
 */
router.delete('/:id', deleteWorker);

export default router; 