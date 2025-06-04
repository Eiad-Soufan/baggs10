import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Document } from 'mongoose';
import Workers from '../models/Worker';
import ErrorResponse from '../utils/errorResponse';

interface WorkerFilters {
  name?: { $regex: string; $options: string };
  identityNumber?: string;
  phone?: { $regex: string; $options: string };
  isAvailable?: boolean;
  role?: string;
}

interface IWorker {
  name: string;
  email: string;
  phone: string;
  password: string;
  identityNumber?: string;
  isAvailable: boolean;
  role: 'worker' | 'admin';
}

interface WorkerDocument extends Document, IWorker {}

interface PaginationResult {
  next?: {
    page: number;
    limit: number;
  };
  prev?: {
    page: number;
    limit: number;
  };
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

/**
 * @desc    Get all workers with filters, pagination and sorting
 * @route   GET /api/v1/workers
 * @access  Private/Admin
 */
export const getWorkers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract query parameters
    const { 
      name, 
      identityNumber, 
      phone,
      isAvailable,
      role,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query: WorkerFilters = {};

    // Add filters if they exist
    if (name) {
      query.name = { $regex: name as string, $options: 'i' }; // Case-insensitive search
    }
    if (identityNumber) {
      query.identityNumber = identityNumber as string;
    }
    if (phone) {
      query.phone = { $regex: phone as string, $options: 'i' }; // Case-insensitive search
    }
    if (isAvailable !== undefined) {
      query.isAvailable = (isAvailable as string) === 'true';
    }
    if (role) {
      query.role = role as string;
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const total = await Workers.countDocuments(query);

    // Pagination result
    const pagination: PaginationResult = {
      total,
      page: pageNum,
      limit: limitNum,
      pageCount: Math.ceil(total / limitNum)
    };

    // Add next page if available
    if (endIndex < total) {
      pagination.next = {
        page: pageNum + 1,
        limit: limitNum
      };
    }

    // Add previous page if available
    if (startIndex > 0) {
      pagination.prev = {
        page: pageNum - 1,
        limit: limitNum
      };
    }

    // Execute query with pagination and sorting
    const workers = await Workers.find(query)
      .sort({ [sortBy as string]: order === 'desc' ? -1 : 1 })
      .skip(startIndex)
      .limit(limitNum)
      .select('-password');
    
    res.status(200).json({
      success: true,
      count: workers.length,
      pagination,
      data: workers
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single worker
 * @route   GET /api/v1/workers/:id
 * @access  Private/Admin
 */
export const getWorker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const worker = await Workers.findById(req.params.id);
    
    if (!worker) {
      return next(
        new ErrorResponse(`Worker not found with id of ${req.params.id}`, 404)
      );
    }
    
    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create worker
 * @route   POST /api/v1/workers
 * @access  Private/Admin
 */
export const createWorker = async (
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
    
    const worker = await Workers.create(req.body);
    
    res.status(201).json({
      success: true,
      data: worker
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update worker
 * @route   PUT /api/v1/workers/:id
 * @access  Private/Admin
 */
export const updateWorker = async (
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
    
    let worker = await Workers.findById(req.params.id);
    
    if (!worker) {
      return next(
        new ErrorResponse(`Worker not found with id of ${req.params.id}`, 404)
      );
    }
    
    // If password is in the body, remove it
    if (req.body.password) {
      delete req.body.password;
    }
    
    worker = await Workers.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete worker
 * @route   DELETE /api/v1/workers/:id
 * @access  Private/Admin
 */
export const deleteWorker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const worker = await Workers.findById(req.params.id) as WorkerDocument;
    
    if (!worker) {
      return next(
        new ErrorResponse(`Worker not found with id of ${req.params.id}`, 404)
      );
    }
    
    await worker.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 