import mongoose, { Types } from 'mongoose';

export interface IResponse {
  message: string;
  responderId: Types.ObjectId;
  responderRole: 'customer' | 'admin';
  createdAt: Date;
}

export interface IComplaint {
  orderId: Types.ObjectId;
  status: 'pending' | 'open' | 'closed';
  userId: Types.ObjectId;
  closedByAdminId?: Types.ObjectId | null;
  reason: string;
  responses: IResponse[];
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ResponseSchema = new mongoose.Schema<IResponse>({
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Response cannot be more than 500 characters']
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ComplaintSchema = new mongoose.Schema<IComplaint>(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Order ID is required'],
      ref: 'Order'
    },
    status: {
      type: String,
      enum: ['pending', 'open', 'closed'],
      default: 'open'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User'
    },
    closedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot be more than 1000 characters']
    },
    responses: [ResponseSchema],
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Add index for better query performance
ComplaintSchema.index({ userId: 1, status: 1 });
ComplaintSchema.index({ orderId: 1 });
ComplaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
export default Complaint; 