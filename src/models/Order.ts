import mongoose, { Types } from 'mongoose';

export interface IOrderItem {
  name: string;
  weight: number;
  images: string[];
  isBreakable: boolean;
}

export interface IOrderRating {
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface IOrder {
  userId: Types.ObjectId;
  workerId?: Types.ObjectId;
  complaintId?: Types.ObjectId;
  items: IOrderItem[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  scheduledDate: Date;
  from: string;
  to: string;
  flightGate?: string;
  flightNumber?: string;
  pickUpDate: Date;
  pickUpTime: string;
  completedAt?: Date;
  cancelledAt?: Date;
  rating?: IOrderRating;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new mongoose.Schema<IOrderItem>({
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
    required: [true, 'At least one image is required'],
    trim: true
  }],
  isBreakable: {
    type: Boolean,
    default: false
  }
});

const OrderRatingSchema = new mongoose.Schema<IOrderRating>({
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

const OrderSchema = new mongoose.Schema<IOrder>(
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
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
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
    scheduledDate: {
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
    completedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    rating: OrderRatingSchema
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
OrderSchema.index({ userId: 1 });
OrderSchema.index({ workerId: 1 });
OrderSchema.index({ complaintId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ scheduledDate: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order; 