import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Complaint, { IComplaint } from '../models/Complaint';
import Order from '../models/Order';
import { successResponse, errorResponse, STATUS_CODES } from '../utils/responseHandler';
import { Types } from 'mongoose';
import { IUser } from '../models/User';
import ErrorResponse from '../utils/errorResponse';

// Define complaint status enum
const ComplaintStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  CLOSED: 'closed',
} as const;

type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

// Extend Express Request type to include user
declare module 'express' {
  interface Request {
    user?: IUser;
  }
}

interface ComplaintFilters {
  status?: ComplaintStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'service' | 'worker' | 'payment' | 'technical' | 'other';
  assignedToId?: string;
  relatedWorkerId?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
  search?: string;
  createdAt?: {
    from: string;
    to: string;
  };
}

interface ComplaintResponse {
  message: string;
  responderId: Types.ObjectId;
}

interface IResponse {
  message: string;
  responderId: Types.ObjectId;
  responderRole: string;
  createdAt: Date;
}

interface MessageSender {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
}

interface ChatMessage {
  type: 'complaint' | 'response';
  message: string;
  sender: MessageSender;
  createdAt: Date;
  status?: string;
}

interface ChatResponse {
  complaintId: Types.ObjectId;
  orderId: Types.ObjectId;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  closedBy?: MessageSender;
  messages: ChatMessage[];
}

interface PopulatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
}

interface PopulatedResponse {
  message: string;
  responderId: PopulatedUser;
  responderRole: string;
  createdAt: Date;
}

interface PopulatedComplaint extends Omit<IComplaint, 'userId' | 'responses'> {
  userId: PopulatedUser;
  responses: PopulatedResponse[];
}

/**
 * @desc    Get all complaints with advanced filtering (Admin only)
 * @route   GET /api/v1/complaints
 * @access  Private/Admin
 */
export const getComplaints = async (
  req: Request<{}, {}, {}, ComplaintFilters>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    const { 
      status,
      priority,
      category,
      assignedToId,
      relatedWorkerId,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1', 
      limit = '10',
      search,
      createdAt
    } = req.query;

    // Build query
    const query: Record<string, any> = {};
    
    // Status filter
    if (status) {
      query.status = status;
    }

    // Priority filter
    if (priority) {
      query.priority = priority;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Assigned to filter
    if (assignedToId) {
      query.assignedToId = assignedToId;
    }

    // Related worker filter
    if (relatedWorkerId) {
      query.relatedWorkerId = relatedWorkerId;
    }

    // Date range filter
    if (createdAt?.from && createdAt?.to) {
      query.createdAt = {
        $gte: new Date(createdAt.from),
        $lte: new Date(createdAt.to)
      };
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const total = await Complaint.countDocuments(query);

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email')
      .populate('assignedToId', 'name email')
      .populate('relatedWorkerId', 'name email')
      .populate('orderId')
      .populate('closedByAdminId', 'name email')
      .populate('responses.responderId', 'name email')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(startIndex)
      .limit(limitNum);

    successResponse(res, STATUS_CODES.OK, 'Complaints retrieved successfully', complaints, {
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
 * @desc    Get user's complaints (Customer)
 * @route   GET /api/v1/complaints/my-complaints
 * @access  Private
 */
export const getMyComplaints = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const complaints = await Complaint.find({ userId: req.user!._id })
      .populate('assignedToId', 'name email')
      .populate('relatedWorkerId', 'name email')
      .populate('orderId')
      .populate('closedByAdminId', 'name email')
      .populate('responses.responderId', 'name email')
      .sort('-createdAt');

    successResponse(res, STATUS_CODES.OK, 'Your complaints retrieved successfully', complaints);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single complaint
 * @route   GET /api/v1/complaints/:id
 * @access  Private
 */
export const getComplaint = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('assignedToId', 'name email role')
      .populate('relatedWorkerId', 'name email role')
      .populate('orderId')
      .populate('closedByAdminId', 'name email role')
      .populate('responses.responderId', 'name email role');

    if (!complaint) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
      return;
    }

    // Make sure user is complaint owner or admin
    if (complaint.userId.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      errorResponse(res, STATUS_CODES.FORBIDDEN, 'Not authorized to access this complaint');
      return;
    }

    successResponse(res, STATUS_CODES.OK, 'Complaint details retrieved successfully', complaint);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create complaint (Customer only)
 * @route   POST /api/v1/complaints
 * @access  Private
 */
export const createComplaint = async (
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

    // Only customers can create complaints
    if (req.user!.role !== 'customer') {
      errorResponse(res, STATUS_CODES.FORBIDDEN, 'Only customers can create complaints');
      return;
    }

    // Add user to req.body
    req.body.userId = req.user!._id;

    const complaint = await Complaint.create(req.body);
    successResponse(res, STATUS_CODES.CREATED, 'Complaint created successfully', complaint);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add response to complaint
 * @route   POST /api/v1/complaints/:id/responses
 * @access  Private
 */
export const addResponse = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, STATUS_CODES.VALIDATION_ERROR, 'Validation error', errors.array());
      return;
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
      return;
    }

    // Check if user is authorized (must be complaint owner or admin)
    if (complaint.userId.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      errorResponse(res, STATUS_CODES.FORBIDDEN, 'Not authorized to respond to this complaint');
      return;
    }

    // Check if complaint is closed
    if (complaint.status === ComplaintStatus.CLOSED) {
      errorResponse(res, STATUS_CODES.BAD_REQUEST, 'Cannot respond to a closed complaint');
      return;
    }

    const response = {
      message: req.body.message,
      responderId: req.user!._id,
      responderRole: req.user!.role as 'customer' | 'admin',
      attachments: req.body.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    complaint.responses.push(response);
    
    // If it's an admin response, update the status to 'in_progress'
    if (req.user!.role === 'admin' && complaint.status === ComplaintStatus.PENDING) {
      complaint.status = ComplaintStatus.IN_PROGRESS;
    }
    // If it's a customer response, update the status to 'pending'
    else if (req.user!.role === 'customer' && complaint.status === ComplaintStatus.IN_PROGRESS) {
      complaint.status = ComplaintStatus.PENDING;
    }

    await complaint.save();

    // Fetch the updated complaint with populated fields
    const updatedComplaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('assignedToId', 'name email role')
      .populate('relatedWorkerId', 'name email role')
      .populate('orderId')
      .populate('closedByAdminId', 'name email role')
      .populate('responses.responderId', 'name email role');

    successResponse(res, STATUS_CODES.OK, 'Response added successfully', updatedComplaint);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update complaint (Admin only)
 * @route   PUT /api/v1/complaints/:id
 * @access  Private/Admin
 */
export const updateComplaint = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
  try {
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
      return;
    }

    // If status is being changed to closed, add closedAt and closedByAdminId
    if (req.body.status === ComplaintStatus.CLOSED) {
      req.body.closedAt = new Date();
      req.body.closedByAdminId = req.user!._id;
    }

    complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('userId', 'name email role')
    .populate('assignedToId', 'name email role')
    .populate('relatedWorkerId', 'name email role')
    .populate('orderId')
    .populate('closedByAdminId', 'name email role')
    .populate('responses.responderId', 'name email role');

    successResponse(res, STATUS_CODES.OK, 'Complaint updated successfully', complaint);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete complaint (Admin only)
 * @route   DELETE /api/v1/complaints/:id
 * @access  Private/Admin
 */
export const deleteComplaint = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
      return;
    }

    await complaint.deleteOne();
    successResponse(res, STATUS_CODES.OK, 'Complaint deleted successfully', null);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add a specific complaint with ID 5
 * @route   POST /api/v1/complaints/add-five
 * @access  Private/Admin
 */
export const addComplaintFive = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Create a new complaint with specific ID
    const complaint = new Complaint({
      _id: new Types.ObjectId('000000000000000000000005'),
      title: 'Service Quality Issue',
      description: 'The service provided did not meet the expected quality standards. The worker arrived late and did not complete all the required tasks.',
      category: 'service',
      priority: 'high',
      status: 'pending',
      orderId: new Types.ObjectId(), // You'll need to provide a valid order ID
      userId: req.user!._id,
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await complaint.save();

    successResponse(res, STATUS_CODES.CREATED, 'Complaint #5 created successfully', complaint);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add 5 sample complaints
 * @route   POST /api/v1/complaints/add-samples
 * @access  Private/Admin
 */
export const addSampleComplaints = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First create sample orders
    const sampleOrders = [
      {
        userId: req.user!._id,
        serviceId: new Types.ObjectId(), // You'll need to provide a valid service ID
        totalAmount: 150.00,
        scheduledDate: new Date(),
        status: 'completed',
        paymentStatus: 'paid'
      },
      {
        userId: req.user!._id,
        serviceId: new Types.ObjectId(),
        totalAmount: 200.00,
        scheduledDate: new Date(),
        status: 'in_progress',
        paymentStatus: 'paid'
      },
      {
        userId: req.user!._id,
        serviceId: new Types.ObjectId(),
        totalAmount: 175.00,
        scheduledDate: new Date(),
        status: 'completed',
        paymentStatus: 'paid'
      },
      {
        userId: req.user!._id,
        serviceId: new Types.ObjectId(),
        totalAmount: 125.00,
        scheduledDate: new Date(),
        status: 'completed',
        paymentStatus: 'paid'
      },
      {
        userId: req.user!._id,
        serviceId: new Types.ObjectId(),
        totalAmount: 300.00,
        scheduledDate: new Date(),
        status: 'completed',
        paymentStatus: 'paid'
      }
    ];

    const createdOrders = await Order.insertMany(sampleOrders);

    // Now create complaints using the order IDs
    const sampleComplaints = [
      {
        title: 'Late Service Delivery',
        description: 'The service was delivered 2 hours later than the scheduled time, causing inconvenience.',
        category: 'service' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        orderId: createdOrders[0]._id,
        userId: req.user!._id
      },
      {
        title: 'Worker Behavior Issue',
        description: 'The assigned worker was unprofessional and did not follow proper safety protocols.',
        category: 'worker' as const,
        priority: 'urgent' as const,
        status: 'in_progress' as const,
        orderId: createdOrders[1]._id,
        userId: req.user!._id
      },
      {
        title: 'Payment Processing Error',
        description: 'Double charged for the service. Need immediate refund processing.',
        category: 'payment' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        orderId: createdOrders[2]._id,
        userId: req.user!._id
      },
      {
        title: 'App Technical Issue',
        description: 'Unable to track service status through the mobile app. App keeps crashing.',
        category: 'technical' as const,
        priority: 'medium' as const,
        status: 'pending' as const,
        orderId: createdOrders[3]._id,
        userId: req.user!._id
      },
      {
        title: 'General Feedback',
        description: 'Would like to provide feedback about the overall service experience.',
        category: 'other' as const,
        priority: 'low' as const,
        status: 'pending' as const,
        orderId: createdOrders[4]._id,
        userId: req.user!._id
      }
    ];

    const createdComplaints = await Complaint.insertMany(sampleComplaints);

    successResponse(
      res, 
      STATUS_CODES.CREATED, 
      '5 sample complaints created successfully', 
      {
        orders: createdOrders,
        complaints: createdComplaints
      }
    );
  } catch (err) {
    next(err);
  }
}; 