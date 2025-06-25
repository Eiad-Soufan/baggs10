import mongoose, { Types } from "mongoose";

interface IReadBy {
	user: Types.ObjectId;
	readAt: Date;
}

export interface INotification {
	title: string;
	message: string;
	type: "info" | "warning" | "success" | "error";
	targetUsers: Types.ObjectId[];
	isGlobal: boolean;
	createdBy: Types.ObjectId;
	readBy: IReadBy[];
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
	sendNotificationOnDate?: Date;
	sendNow?: boolean;
	redirectTo?: string;
}

const NotificationSchema = new mongoose.Schema<INotification>(
	{
		title: {
			type: String,
			required: [true, "Title is required"],
			trim: true,
			maxlength: [100, "Title cannot be more than 100 characters"],
		},
		message: {
			type: String,
			required: [true, "Message is required"],
			trim: true,
			maxlength: [1000, "Message cannot be more than 1000 characters"],
		},
		type: {
			type: String,
			enum: ["info", "warning", "success", "error"],
			default: "info",
		},
		targetUsers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		isGlobal: {
			type: Boolean,
			default: false,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		readBy: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				readAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		expiresAt: {
			type: Date,
			default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		},
		sendNotificationOnDate: {
			type: Date,
		},
		sendNow: {
			type: Boolean,
			default: true,
		},
		redirectTo: {
			type: String,
			trim: true,
			maxlength: [500, "Redirect URL cannot be more than 500 characters"],},
	},
	{
		timestamps: true,
	}
);

// Add indexes for better query performance
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ targetUsers: 1 });
NotificationSchema.index({ isGlobal: 1 });
NotificationSchema.index({ expiresAt: 1 });

const Notification = mongoose.model<INotification>(
	"Notification",
	NotificationSchema
);
export default Notification;
