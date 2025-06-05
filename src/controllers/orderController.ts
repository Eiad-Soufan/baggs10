import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Order from '../models/Order';
import { successResponse, errorResponse, STATUS_CODES } from '../utils/responseHandler';
import { Types } from 'mongoose';
import { IUser } from '../models/User';

// Extend Express Request type to include user
declare module 'express' {
  interface Request {
    user?: IUser;
  }
}

interface OrderFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
  search?: string;
  scheduledDate?: {
    from: string;
    to: string;
  };
}

/**
 * @desc    Get all orders with advanced filtering (Admin only)
 * @route   GET /api/v1/orders
 * @access  Private/Admin
 */
export const getOrders = async (
  req: Request<{}, {}, {}, OrderFilters>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      status,
      paymentStatus,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10',
      search,
      scheduledDate
    } = req.query;

    // Build query
    const query: Record<string, any> = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Date range filter
    if (scheduledDate?.from && scheduledDate?.to) {
      query.scheduledDate = {
        $gte: new Date(scheduledDate.from),
        $lte: new Date(scheduledDate.to)
      };
    }

    // Search in items name or totalAmount
    if (search) {
      query.$or = [
        { 'items.name': { $regex: search, $options: 'i' } },
        { totalAmount: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('workerId', 'name email')
      .populate('complaintId')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(startIndex)
      .limit(limitNum);

    successResponse(res, STATUS_CODES.OK, 'Orders retrieved successfully', orders, {
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
 * @desc    Get user's orders
 * @route   GET /api/v1/orders/my-orders
 * @access  Private
 */
export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find({ userId: req.user!._id })
      .populate('workerId', 'name email')
      .populate('serviceId', 'name price')
      .sort('-createdAt');

    successResponse(res, STATUS_CODES.OK, 'Your orders retrieved successfully', orders);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single order
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('workerId', 'name email')
      .populate('complaintId');

    if (!order) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, 'Order not found');
      return;
    }

    // Check if user is admin or the order belongs to the user
    if (req.user?.role !== 'admin' && order.userId.toString() !== req.user?._id.toString()) {
      errorResponse(res, STATUS_CODES.FORBIDDEN, 'Not authorized to access this order');
      return;
    }

    successResponse(res, STATUS_CODES.OK, 'Order retrieved successfully', order);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create order
 * @route   POST /api/v1/orders
 * @access  Private
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, STATUS_CODES.VALIDATION_ERROR, 'Validation error', errors.array());
      return;
    }

    // Add user to req.body
    req.body.userId = req.user!._id;

    const order = await Order.create(req.body);
    successResponse(res, STATUS_CODES.CREATED, 'Order created successfully', order);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update order (Admin only)
 * @route   PUT /api/v1/orders/:id
 * @access  Private/Admin
 */
export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
  // If status is being changed to completed, add completedAt
    if (req.body.status === 'completed') {
      req.body.completedAt = new Date();
    }

    // If status is being changed to cancelled, add cancelledAt
    if (req.body.status === 'cancelled') {
      req.body.cancelledAt = new Date();
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, STATUS_CODES.VALIDATION_ERROR, 'Validation error', errors.array());
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('userId', 'name email')
      .populate('workerId', 'name email')
      .populate('complaintId');

    if (!order) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, 'Order not found');
      return;
    }

    successResponse(res, STATUS_CODES.OK, 'Order updated successfully', order);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete order (Admin only)
 * @route   DELETE /api/v1/orders/:id
 * @access  Private/Admin
 */
export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, 'Order not found');
      return;
    }
    await order.deleteOne();
    successResponse(res, STATUS_CODES.OK, 'Order deleted successfully', null);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add 5 sample orders
 * @route   POST /api/v1/orders/add-samples
 * @access  Private/Admin
 */
export const addSampleOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sampleOrders = [
      {
        userId: req.user!._id,
        items: [
          {
            name: 'Fragile Glass Vase',
            weight: 2.5,
            images: ['https://example.com/vase1.jpg', 'https://example.com/vase2.jpg', 'https://example.com/vase3.jpg'],
            isBreakable: true
          },
          {
            name: 'Wooden Box',
            weight: 5.0,
            images: ['https://example.com/box1.jpg', 'https://example.com/box2.jpg', 'https://example.com/box3.jpg'],
            isBreakable: false
          }
        ],
        workerId: new Types.ObjectId(),
        totalAmount: 150.00,
        scheduledDate: new Date(),
        status: 'completed',
        paymentStatus: 'paid',
        completedAt: new Date()
      },
      {
        userId: req.user!._id,
        items: [
          {
            name: 'Electronics Package',
            weight: 3.0,
            images: ['https://example.com/electronics1.jpg', 'https://example.com/electronics2.jpg', 'https://example.com/electronics3.jpg'],
            isBreakable: true
          }
        ],
        workerId: new Types.ObjectId(),
        totalAmount: 200.00,
        scheduledDate: new Date(),
        status: 'in_progress',
        paymentStatus: 'paid'
      },
      {
        userId: req.user!._id,
        items: [
          {
            name: 'Furniture Set',
            weight: 25.0,
            images: ['https://example.com/furniture1.jpg', 'https://example.com/furniture2.jpg', 'https://example.com/furniture3.jpg'],
            isBreakable: false
          }
        ],
        workerId: new Types.ObjectId(),
        totalAmount: 175.00,
        scheduledDate: new Date(),
        status: 'completed',
        paymentStatus: 'paid',
        completedAt: new Date()
      },
      {
        userId: req.user!._id,
        items: [
          {
            name: 'Clothing Package',
            weight: 1.5,
            images: ['https://example.com/clothing1.jpg', 'https://example.com/clothing2.jpg', 'https://example.com/clothing3.jpg'],
            isBreakable: false
          },
          {
            name: 'Shoes Box',
            weight: 2.0,
            images: ['https://example.com/shoes1.jpg', 'https://example.com/shoes2.jpg', 'https://example.com/shoes3.jpg'],
            isBreakable: false
          }
        ],
        totalAmount: 125.00,
        scheduledDate: new Date(),
        status: 'pending',
        paymentStatus: 'pending'
      },
      {
        userId: req.user!._id,
        items: [
          {
            name: 'Art Collection',
            weight: 8.0,
            images: ['https://example.com/art1.jpg', 'https://example.com/art2.jpg', 'https://example.com/art3.jpg'],
            isBreakable: true
          }
        ],
        workerId: new Types.ObjectId(),
        complaintId: new Types.ObjectId(),
        totalAmount: 300.00,
        scheduledDate: new Date(),
        status: 'cancelled',
        paymentStatus: 'refunded',
        cancelledAt: new Date()
      }
    ];

    const createdOrders = await Order.insertMany(sampleOrders);

    successResponse(
      res,
      STATUS_CODES.CREATED,
      '5 sample orders created successfully',
      createdOrders
    );
  } catch (err) {
    next(err);
  }
}; 