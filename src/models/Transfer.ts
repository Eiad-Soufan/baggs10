import mongoose, { Types } from 'mongoose';

export interface ITransferItem {
  name: string;
  weight: number;
  images: string[];
  isBreakable: boolean;
}

export interface ITransferRating {
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface ITransfer {
  userId: Types.ObjectId;
  workerId?: Types.ObjectId;
  complaintId?: Types.ObjectId;
  items: ITransferItem[];
  status: 'pending' | 'in_progress' | 'onTheWay' | 'completed' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryDate: Date;
  from: string;
  to: string;
  flightGate?: string;
  flightNumber?: string;
  pickUpDate: Date;
  pickUpTime: string;
  deliveryTime: string;
  completedAt?: Date;
  cancelledAt?: Date;
  rating?: ITransferRating;
  createdAt: Date;
  updatedAt: Date;
  assigneedAt?: Date;
  onTheWayAt?: Date;
  acceptedAt?: Date;
}

const TransferItemSchema = new mongoose.Schema<ITransferItem>({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot be more than 100 characters']
  },
  weight: {
    type: Number,
    required: [true, 'Item weight is required'],
    min: [0, 'Weight cannot be negative']
  },
  images: [{
    type: String,
    required: [true, '3 image is required'],
    min: [3, '3 images are required'],
    trim: true
  }],
  isBreakable: {
    type: Boolean,
    default: false
  }
});

const TransferRatingSchema = new mongoose.Schema<ITransferRating>({
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TransferSchema = new mongoose.Schema<ITransfer>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User'
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker'
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint'
    },
    items: [TransferItemSchema],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'onTheWay', 'completed', 'cancelled'],
      default: 'pending'
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    deliveryDate: {
      type: Date,
      required: [true, 'Scheduled date is required']
    },
    from: {
      type: String,
      required: [true, 'From location is required'],
      trim: true
    },
    to: {
      type: String,
      required: [true, 'To location is required'],
      trim: true
    },
    flightGate: {
      type: String,
      trim: true
    },
    flightNumber: {
      type: String,
      trim: true
    },
    pickUpDate: {
      type: Date,
      required: [true, 'Pick up date is required']
    },
    pickUpTime: {
      type: String,
      required: [true, 'Pick up time is required'],
      trim: true
    },
    deliveryTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
      trim: true
    },
    completedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    assigneedAt: {
      type: Date
    },
    onTheWayAt: {
      type: Date
    },
    acceptedAt: {
      type: Date
    },
    rating: TransferRatingSchema
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
TransferSchema.index({ userId: 1 });
TransferSchema.index({ workerId: 1 });
TransferSchema.index({ complaintId: 1 });
TransferSchema.index({ status: 1 });
TransferSchema.index({ paymentStatus: 1 });
TransferSchema.index({ deliveryDate: 1 });
TransferSchema.index({ createdAt: -1 });

const Transfer = mongoose.model<ITransfer>('Transfer', TransferSchema);
export default Transfer; 