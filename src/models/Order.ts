import mongoose, { Types } from 'mongoose';

export interface IOrder {
  userId: Types.ObjectId;
  serviceId: Types.ObjectId;
  workerId?: Types.ObjectId;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  scheduledDate: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User'
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Service ID is required'],
      ref: 'Service'
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker'
    },
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
    completedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
OrderSchema.index({ userId: 1 });
OrderSchema.index({ workerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ scheduledDate: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order; 