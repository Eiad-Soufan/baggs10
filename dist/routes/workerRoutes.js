"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const workerController_1 = require("../controllers/workerController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply protection to all routes
router.use(auth_1.protect);
// Apply admin authorization to all routes
router.use((0, auth_1.authorize)('admin'));
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
router.get('/', workerController_1.getWorkers);
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
router.get('/:id', workerController_1.getWorker);
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
router.post('/', [
    (0, express_validator_1.body)('name').not().isEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Please include a valid email'),
    (0, express_validator_1.body)('phone').not().isEmpty().withMessage('Phone number is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
], workerController_1.createWorker);
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
router.put('/:id', [
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Please include a valid email'),
    (0, express_validator_1.body)('phone').optional(),
    (0, express_validator_1.body)('name').optional()
], workerController_1.updateWorker);
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
router.delete('/:id', workerController_1.deleteWorker);
exports.default = router;
//# sourceMappingURL=workerRoutes.js.map