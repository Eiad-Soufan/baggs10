import mongoose, { Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IWorker {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  identityNumber?: string;
  isAvailable: boolean;
  role: 'worker' | 'manager' | 'supervisor';
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkerMethods {
  comparePassword(enteredPassword: string): Promise<boolean>;
}

export interface WorkerModel extends Model<IWorker, {}, IWorkerMethods> {}

const WorkerSchema = new mongoose.Schema<IWorker, WorkerModel, IWorkerMethods>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    identityNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['worker', 'manager', 'supervisor'],
      default: 'worker',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
WorkerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
WorkerSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Worker = mongoose.model<IWorker, WorkerModel>('Worker', WorkerSchema);
export default Worker; 