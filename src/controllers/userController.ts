import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Document, ObjectId } from 'mongoose';
import User, { IUser as UserModelInterface } from '../models/User';
import ErrorResponse from '../utils/errorResponse';

interface IUser extends Omit<UserModelInterface, '_id'> {}

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface UserDocument extends Document<ObjectId, {}, IUser>, IUser, IUserMethods {}

interface UserResponse extends IUser {
  _id: ObjectId;
}



/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only admin can access this route
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access this route', 403));
    }
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id)) {
      return next(new ErrorResponse('Not authorized to update this worker', 403));
    }
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create user
 * @route   POST /api/v1/users
 * @access  Private/Admin
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    const user = await User.create(req.body);
    
    // Remove sensitive data from response
    const userObj = user.toObject();
    const { password, ...responseData } = userObj;
    
    res.status(201).json({
      success: true,
      data: responseData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/v1/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only admin or the user themselves can update
    if (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id)) {
      return next(new ErrorResponse('Not authorized to update this user', 403));
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    let user = await User.findById(req.params.id);
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }
    const { password, ...updateData } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');
    if (!updatedUser) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only admin or the user themselves can delete
    if (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id)) {
      return next(new ErrorResponse('Not authorized to update this worker', 403));
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }
    await user.deleteOne();
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 


/**
 * @desc    Delete user according to the name, email, and password
 * @route   DELETE /api/v1/users/delete
 * @access  Public
 */
export const deleteUserByNameEmailAndPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new ErrorResponse('Name, email, and password are required', 400));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const user = await User.findOne({ name, email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid password', 401));
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
