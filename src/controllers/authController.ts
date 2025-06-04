import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import ErrorResponse from '../utils/errorResponse';

interface RegisterRequestBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  identityNumber?: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (
  req: Request<{}, {}, RegisterRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, phone, password, identityNumber } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      next(new ErrorResponse('User already exists', 400));
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      identityNumber
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (
  req: Request<{}, {}, LoginRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      next(new ErrorResponse('Invalid credentials', 401));
      return;
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      next(new ErrorResponse('Invalid credentials', 401));
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Log user out / clear cookie
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
export const logout = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user: IUser, statusCode: number, res: Response): void => {
  // Create tokens
  const accessToken = generateToken(user, 'access');
  const refreshToken = generateToken(user, 'refresh');

  const response: TokenResponse = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Date.now() + (process.env.JWT_EXPIRE ? parseInt(process.env.JWT_EXPIRE) * 1000 : 3600000), // 1 hour default
    refresh_expires_in: Date.now() + (process.env.JWT_REFRESH_EXPIRE ? parseInt(process.env.JWT_REFRESH_EXPIRE) * 1000 : 604800000) // 7 days default
  };

  res.status(statusCode).json({
    success: true,
    data: response
  });
};

const generateToken = (user: IUser, type: 'access' | 'refresh'): string => {
  const options: SignOptions = {
    expiresIn: type === 'access' 
      ? (process.env.JWT_EXPIRE ? parseInt(process.env.JWT_EXPIRE) : 3600) // 1 hour default in seconds
      : (process.env.JWT_REFRESH_EXPIRE ? parseInt(process.env.JWT_REFRESH_EXPIRE) : 604800) // 7 days default in seconds
  };

  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'your-secret-key',
    options
  );
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      next(new ErrorResponse('Refresh token is required', 400));
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refresh_token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string };

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }

    // Generate new tokens
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(new ErrorResponse('Invalid refresh token', 401));
  }
}; 