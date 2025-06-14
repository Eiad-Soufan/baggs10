import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Notification from '../models/Notification';
import { successResponse, errorResponse, STATUS_CODES } from '../utils/responseHandler';
import ErrorResponse from '../utils/errorResponse';
import { Types } from 'mongoose';

interface NotificationFilters {
  type?: string;
  page?: string;
  limit?: string;
  search?: string;
}

interface NotificationRequestBody {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  targetUsers?: Types.ObjectId[];
  isGlobal?: boolean;
  createdBy?: Types.ObjectId;
}

/**
 * @desc    Get all notifications (Admin only)
 * @route   GET /api/v1/notifications
 * @access  Private/Admin
 */
export const getNotifications = async (
  req: Request<{}, {}, {}, NotificationFilters>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    const { type, page = '1', limit = '10', search } = req.query;

    // Build query
    const query: Record<string, any> = {};
    
    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .populate('createdBy', 'name email')
      .populate('targetUsers', 'name email')
      .populate('readBy.user', 'name email')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limitNum);

    successResponse(res, STATUS_CODES.OK, 'Notifications retrieved successfully', notifications, {
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user's notifications
 * @route   GET /api/v1/notifications/my-notifications
 * @access  Private
 */
// export const getMyNotifications = async (
//   req: Request<{}, {}, {}, { read?: string; page?: string; limit?: string }>,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { read, page = '1', limit = '10' } = req.query;

//     // Build query for user-specific and global notifications
//     const query: Record<string, any> = {
//       $or: [
//         { targetUsers: req.user!._id },
//         { isGlobal: true }
//       ],
//       expiresAt: { $gt: new Date() }
//     };

//     // Filter by read status if specified
//     if (read === 'true') {
//       query['readBy.user'] = req.user!._id;
//     } else if (read === 'false') {
//       query['readBy.user'] = { $ne: req.user!._id };
//     }

//     // Pagination
//     const pageNum = parseInt(page, 10);
//     const limitNum = parseInt(limit, 10);
//     const startIndex = (pageNum - 1) * limitNum;
//     const total = await Notification.countDocuments(query);

//     const notifications = await Notification.find(query)
//       .populate('createdBy', 'name email')
//       .sort('-createdAt')
//       .skip(startIndex)
//       .limit(limitNum);

//     successResponse(res, STATUS_CODES.OK, 'Notifications retrieved successfully', notifications, {
//       pagination: {
//         total,
//         page: pageNum,
//         pages: Math.ceil(total / limitNum)
//       }
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const getMyNotifications = async (
  req: Request<{}, {}, {}, { read?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { read } = req.query;

    // Build query for user-specific and global notifications
    const query: Record<string, any> = {
      $or: [
        { targetUsers: req.user!._id },
        { isGlobal: true }
      ],
      expiresAt: { $gt: new Date() }
    };

    // Filter by read status if specified
    if (read === 'true') {
      query['readBy.user'] = req.user!._id;
    } else if (read === 'false') {
      query['readBy.user'] = { $ne: req.user!._id };
    }

    const notifications = await Notification.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    successResponse(res, STATUS_CODES.OK, 'Notifications retrieved successfully', notifications);
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Get single notification
 * @route   GET /api/v1/notifications/:id
 * @access  Private
 */
export const getNotification = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('targetUsers', 'name email')
      .populate('readBy.user', 'name email');

    if (!notification) {
      next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
      return;
    }

    // Check if user is authorized to view this notification
    if (!notification.isGlobal && !notification.targetUsers.some(user => user._id.toString() === req.user!._id.toString())) {
      next(new ErrorResponse('Not authorized to access this notification', 403));
      return;
    }

    successResponse(res, STATUS_CODES.OK, 'Notification retrieved successfully', notification);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create notification (Admin only)
 * @route   POST /api/v1/notifications
 * @access  Private/Admin
 */
export const createNotification = async (
  req: Request<{}, {}, NotificationRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, STATUS_CODES.VALIDATION_ERROR, 'Validation error', errors.array());
      return;
    }

    // Add creator to notification
    req.body.createdBy = req.user!._id;

    // Validate that either targetUsers is provided or isGlobal is true
    if (!req.body.isGlobal && (!req.body.targetUsers || req.body.targetUsers.length === 0)) {
      errorResponse(res, STATUS_CODES.BAD_REQUEST, 'Please provide target users or set as global notification');
      return;
    }

    const notification = await Notification.create(req.body);
    successResponse(res, STATUS_CODES.CREATED, 'Notification created successfully', notification);
  } catch (err) {
    errorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error creating notification', err);
  }
};

/**
 * @desc    Create notification (Admin only)
 * @route   POST /api/v1/notifications/mark-all-as-read
 * @access  Private
 */
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Find notifications for this user (global or targeted)
    const notifications = await Notification.find({
      $or: [
        { isGlobal: true },
        { targetUsers: userId }
      ],
      expiresAt: { $gt: new Date() },
      'readBy.user': { $ne: userId } // not yet read
    });

    // Update only unread notifications
    const bulkOps = notifications.map(notification => ({
      updateOne: {
        filter: { _id: notification._id },
        update: {
          $push: {
            readBy: {
              user: userId,
              readAt: new Date()
            }
          }
        }
      }
    }));

    if (bulkOps.length > 0) {
      await Notification.bulkWrite(bulkOps);
    }

    successResponse(res, STATUS_CODES.OK, 'All notifications marked as read', null);
  } catch (err) {
    errorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error marking all notifications as read', err);
  }
};


/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, `Notification not found with id of ${req.params.id}`);
      return;
    }

    // Check if user is authorized to read this notification
    if (!notification.isGlobal && !notification.targetUsers.includes(req.user!._id)) {
      errorResponse(res, STATUS_CODES.FORBIDDEN, 'Not authorized to access this notification');
      return;
    }

    // Check if already read
    const alreadyRead = notification.readBy.some(read => read.user.toString() === req.user!._id.toString());
    
    if (!alreadyRead) {
      notification.readBy.push({
        user: req.user!._id,
        readAt: new Date()
      });
      await notification.save();
    }

    successResponse(res, STATUS_CODES.OK, 'Notification marked as read successfully', notification);
  } catch (err) {
    errorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error marking notification as read', err);
  }
};

/**
 * @desc    Update notification (Admin only)
 * @route   PUT /api/v1/notifications/:id
 * @access  Private/Admin
 */
export const updateNotification = async (
  req: Request<{ id: string }, {}, Partial<NotificationRequestBody>>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, `Notification not found with id of ${req.params.id}`);
      return;
    }

    // Validate that either targetUsers is provided or isGlobal is true
    if (req.body.isGlobal === false && (!req.body.targetUsers || req.body.targetUsers.length === 0)) {
      errorResponse(res, STATUS_CODES.BAD_REQUEST, 'Please provide target users or set as global notification');
      return;
    }

    notification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email')
     .populate('targetUsers', 'name email')
     .populate('readBy.user', 'name email');

    successResponse(res, STATUS_CODES.OK, 'Notification updated successfully', notification);
  } catch (err) {
    errorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error updating notification', err);
  }
};

/**
 * @desc    Delete notification (Admin only)
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private/Admin
 */
export const deleteNotification = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, `Notification not found with id of ${req.params.id}`);
      return;
    }

    await notification.deleteOne();
    successResponse(res, STATUS_CODES.OK, 'Notification deleted successfully', null);
  } catch (err) {
    errorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error deleting notification', err);
  }
}; 