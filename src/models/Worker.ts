import mongoose, { Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IServiceRating {
  transferId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface IWorker {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  identityNumber?: string;
  isAvailable: boolean;
  role: 'worker' | 'manager' | 'supervisor';
  specialization: string;
  rating: number;
  completedJobs: number;
  skills: string[];
  certificates?: string[];
  experience: number;
  serviceRatings: IServiceRating[];
  preferredLang?: string;
  region?: string;
  timeFormat: '12' | '24';
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkerMethods {
  comparePassword(enteredPassword: string): Promise<boolean>;
  calculateAverageRating(): number;
}

export interface WorkerModel extends Model<IWorker, {}, IWorkerMethods> {}

const ServiceRatingSchema = new mongoose.Schema<IServiceRating>({
  transferId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transfer',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 0,
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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
      required: [true, 'Identity Number is required'],
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
    specialization: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    completedJobs: {
      type: Number,
      default: 0
    },
    skills: [{
      type: String,
      trim: true
    }],
    certificates: [{
      type: String,
      trim: true
    }],
    experience: {
      type: Number,
      default: 0,
      min: 0
    },
    serviceRatings: [ServiceRatingSchema],
    preferredLang: {
      type: String,
      default: 'en',
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    timeFormat: {
      type: String,
      enum: ['12', '24'],
      default: '24',
    },
    image: {
      type: String,
      trim: true,
      default: ""
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

// Method to calculate average rating
WorkerSchema.methods.calculateAverageRating = function(): number {
  if (this.serviceRatings.length === 0) return 0;
  const sum = this.serviceRatings.reduce((acc: number, curr: IServiceRating) => acc + curr.rating, 0);
  return sum / this.serviceRatings.length;
};

const Worker = mongoose.model<IWorker, WorkerModel>('Worker', WorkerSchema);
export default Worker; 