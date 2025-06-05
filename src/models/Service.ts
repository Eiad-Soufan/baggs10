import mongoose from 'mongoose';

export interface IService {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new mongoose.Schema<IService>(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [100, 'Service name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
      maxlength: [1000, 'Service description cannot be more than 1000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [0, 'Price cannot be negative']
    },
    duration: {
      type: Number,
      required: [true, 'Service duration is required'],
      min: [1, 'Duration must be at least 1 minute']
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
ServiceSchema.index({ name: 1 });

export const Service = mongoose.model<IService>('Service', ServiceSchema); 