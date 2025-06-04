import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Complaint, { IComplaint } from '../models/Complaint';
import { successResponse, errorResponse, STATUS_CODES } from '../utils/responseHandler';
import { Types } from 'mongoose';
import { IUser } from '../models/User';

// Extend Express Request type to include user
declare module 'express' {
  interface Request {
    user?: IUser;
  }
}

interface ComplaintFilters {
  status?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
  search?: string;
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
    const { 
      status, 
      sortBy = 'createdAt',
      order = 'desc',
      page = '1', 
      limit = '10',
      search
    } = req.query;

    // Build query
    const query: Record<string, any> = {};
    
    // Status filter
    if (status) {
      query.status = status;
    }

    // Search in reason field
    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const total = await Complaint.countDocuments(query);

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email')
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
      .populate('closedByAdminId', 'name email')
      .populate('responses.responderId', 'name email')
      .populate('orderId')
      .sort('-createdAt');

    successResponse(res, STATUS_CODES.OK, 'Your complaints retrieved successfully', complaints);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single complaint with chat-like interface
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
      .populate<{ userId: PopulatedUser }>('userId', 'name email role')
      .populate('orderId')
      .populate<{ closedByAdminId: PopulatedUser }>('closedByAdminId', 'name email role')
      .populate<{ responses: PopulatedResponse[] }>('responses.responderId', 'name email role')
      .lean();

    if (!complaint) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
      return;
    }

    // Make sure user is complaint owner or admin
    if (complaint.userId._id.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      errorResponse(res, STATUS_CODES.FORBIDDEN, 'Not authorized to access this complaint');
      return;
    }

    // Format the initial complaint as a message
    const messages: ChatMessage[] = [
      {
        type: 'complaint',
        message: complaint.reason,
        sender: {
          _id: complaint.userId._id,
          name: complaint.userId.name,
          email: complaint.userId.email,
          role: complaint.userId.role
        },
        createdAt: complaint.createdAt,
        status: complaint.status
      }
    ];

    // Add responses as messages
    if (complaint.responses && complaint.responses.length > 0) {
      const responseMessages = complaint.responses.map(response => ({
        type: 'response' as const,
        message: response.message,
        sender: {
          _id: response.responderId._id,
          name: response.responderId.name,
          email: response.responderId.email,
          role: response.responderId.role
        },
        createdAt: response.createdAt
      }));

      messages.push(...responseMessages);
    }

    // Sort messages by createdAt in ascending order (oldest to newest)
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Prepare the response
    const chatResponse: ChatResponse = {
      complaintId: complaint._id,
      orderId: complaint.orderId,
      status: complaint.status,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      closedAt: complaint.closedAt || undefined,
      closedBy: complaint.closedByAdminId ? {
        _id: complaint.closedByAdminId._id,
        name: complaint.closedByAdminId.name,
        email: complaint.closedByAdminId.email,
        role: complaint.closedByAdminId.role
      } : undefined,
      messages
    };

    successResponse(res, STATUS_CODES.OK, 'Complaint details retrieved successfully', chatResponse);
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
  req: Request<{ id: string }, {}, ComplaintResponse>,
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
    if (complaint.status === 'closed') {
      errorResponse(res, STATUS_CODES.BAD_REQUEST, 'Cannot respond to a closed complaint');
      return;
    }

    const response = {
      message: req.body.message,
      responderId: req.user!._id,
      responderRole: req.user!.role as 'customer' | 'admin',
      createdAt: new Date()
    } as const;

    complaint.responses.push(response);
    
    // If it's an admin response, update the status to 'pending'
    if (req.user!.role === 'admin' && complaint.status === 'open') {
      complaint.status = 'pending';
    }
    // If it's a customer response, update the status to 'open'
    else if (req.user!.role === 'customer' && complaint.status === 'pending') {
      complaint.status = 'open';
    }

    await complaint.save();

    // Fetch the updated complaint with populated fields
    const updatedComplaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('orderId')
      .populate('closedByAdminId', 'name email role')
      .populate('responses.responderId', 'name email role');

    successResponse(res, STATUS_CODES.OK, 'Response added successfully', updatedComplaint);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update complaint status (Admin only)
 * @route   PUT /api/v1/complaints/:id
 * @access  Private/Admin
 */
export const updateComplaint = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      errorResponse(res, STATUS_CODES.NOT_FOUND, `Complaint not found with id of ${req.params.id}`);
      return;
    }

    // Only allow status updates
    if (!req.body.status) {
      errorResponse(res, STATUS_CODES.BAD_REQUEST, 'Status is required');
      return;
    }

    // If status is being changed to closed, add closedAt and closedByAdminId
    if (req.body.status === 'closed') {
      req.body.closedAt = Date.now();
      req.body.closedByAdminId = req.user!._id;
    }

    complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('responses.responderId', 'name email');

    successResponse(res, STATUS_CODES.OK, 'Complaint status updated successfully', complaint);
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