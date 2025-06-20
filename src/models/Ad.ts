import mongoose, { Document, Schema } from 'mongoose';

export interface IAd extends Document {
  url?: string;
  image?: string;
  expireDate: Date;
  createdByAdminId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  startAt?: Date;
  title: string;
}

const AdSchema = new Schema<IAd>(
  {
    url: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    expireDate: {
      type: Date,
      required: [true, 'Expire date is required'],
    },
    createdByAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
    },
    startAt: {
      type: Date,
      default: Date.now,
    },
    title: {
      type: String,
      trim: true,
      required: [true, 'Title is required'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAd>('Ad', AdSchema); 