import express from 'express';
import { Request, Response, NextFunction } from 'express-serve-static-core';
import { body } from 'express-validator';
import { register, login, getMe, logout, refreshToken } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply rate limiter to all auth routes
//router.use(authLimiter);

router.options('*', cors()); // أضف هذا السطر

// تطبيق rate limiter على جميع الطلبات ما عدا OPTIONS
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    next();
  } else {
    authLimiter(req, res, next);
  }
});


// Define request body types
interface RegisterRequestBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  identityNumber?: string;
  preferredLang?: string;
  region?: string;
  timeFormat?: string;
  informationPreference: ['email', 'sms', 'call'];
}

interface LoginRequestBody {
  email: string;
  password: string;
}

interface RefreshTokenRequestBody {
  refresh_token: string;
}

// // Extend Express Request type to include files
// declare module 'express-serve-static-core' {
//   interface Request {
//     files?: Express.Multer.File[];
//   }
// }

/**
 * @swagger
 * components:
 *   schemas:
 *     TokenResponse:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *           description: JWT access token
 *         refresh_token:
 *           type: string
 *           description: JWT refresh token
 *         expires_in:
 *           type: number
 *           description: Access token expiration timestamp
 *         refresh_expires_in:
 *           type: number
 *           description: Refresh token expiration timestamp
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
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
 *                 format: password
 *               identityNumber:
 *                 type: string
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
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Bad request
 */
router.post(
  '/register',
  [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('phone').not().isEmpty().withMessage('Phone number is required'),
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
  (req: Request, res: Response, next: NextFunction) => {
    register(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  (req: Request<{}, {}, LoginRequestBody>, res: Response, next: NextFunction) => {
    login(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
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
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                     informationPreference:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [email, sms, call]
 *                       description: User's preferred information channels
 *       401:
 *         description: Not authorized
 */
router.get('/me', protect, (req: Request, res: Response, next: NextFunction) => {
  getMe(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/logout', protect, (req: Request, res: Response, next: NextFunction) => {
  logout(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: New tokens generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Invalid refresh token
 *       400:
 *         description: Refresh token is required
 */
router.post(
  '/refresh',
  [
    body('refresh_token').not().isEmpty().withMessage('Refresh token is required')
  ],
  (req: Request<{}, {}, RefreshTokenRequestBody>, res: Response, next: NextFunction) => {
    refreshToken(req, res, next);
  }
);

export default router; 
