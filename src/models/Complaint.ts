import mongoose, { Types } from 'mongoose';

export interface IResponse {
  message: string;
  responderId: Types.ObjectId;
  responderRole: 'customer' | 'admin';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IComplaint {
  title: string;
  description: string;
  category: 'service' | 'worker' | 'payment' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'closed';
  transferId: Types.ObjectId;
  userId: Types.ObjectId;
  assignedToId?: Types.ObjectId;
  relatedWorkerId?: Types.ObjectId;
  closedByAdminId?: Types.ObjectId;
  attachments?: string[];
  resolution?: string;
  responses: IResponse[];
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResponseSchema = new mongoose.Schema<IResponse>({
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Response cannot be more than 1000 characters']
  },
  responderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  responderRole: {
    type: String,
    required: true,
    enum: ['customer', 'admin']
  },
  attachments: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const ComplaintSchema = new mongoose.Schema<IComplaint>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['service', 'worker', 'payment', 'technical', 'other']
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'rejected', 'closed'],
      default: 'pending'
    },
    transferId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Transfer ID is required'],
      ref: 'Transfer'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User'
    },
    assignedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relatedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker'
    },
    closedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    attachments: [{
      type: String,
      trim: true
    }],
    resolution: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution cannot be more than 1000 characters']
    },
    responses: [ResponseSchema],
    closedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
ComplaintSchema.index({ userId: 1, status: 1 });
ComplaintSchema.index({ transferId: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ priority: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ createdAt: -1 });
ComplaintSchema.index({ assignedToId: 1 });

const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
export default Complaint; 