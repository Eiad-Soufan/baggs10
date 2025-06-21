import mongoose, { Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
	_id: mongoose.Types.ObjectId;
	name: string;
	email: string;
	phone: string;
	password: string;
	identityNumber?: string;
	isAvailable: boolean;
	role: "admin" | "customer" | "worker";
	preferredLang?: string;
	region?: string;
	timeFormat: "12" | "24";
	image?: string;
	// Worker specific fields
	specialization?: string;
	rating?: number;
	totalTransfers?: number;
	transferAveragePerMonth?: number; 
	// Customer specific fields
	address?: string;
	informationPreference: ("email" | "sms" | "call")[];
	createdAt: Date;
	updatedAt: Date;
	pushNotification?: boolean;
	emailAllowance?: boolean;
	automaticLanguageDetection?: boolean;
}

export interface IUserMethods {
	comparePassword(enteredPassword: string): Promise<boolean>;
}

export interface UserModel extends Model<IUser, {}, IUserMethods> {}

const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			trim: true,
			lowercase: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Please provide a valid email",
			],
		},
		phone: {
			type: String,
			required: [true, "Phone number is required"],
			trim: true,
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters"],
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
			enum: ["admin", "customer", "worker"],
			default: "customer",
		},
		preferredLang: {
			type: String,
			default: "en",
			trim: true,
		},
		region: {
			type: String,
			trim: true,
		},
		timeFormat: {
			type: String,
			enum: ["12", "24"],
			default: "24",
		},
		image: {
			type: String,
			trim: true,
			default: "",
		},
		// Worker specific fields
		specialization: {
			type: String,
			trim: true,
		},
		rating: {
			type: Number,
			min: 0,
			max: 5,
			default: 0,
		},
		totalTransfers: {
			type: Number,
			default: 0,
		},
		// Customer specific fields
		address: {
			type: String,
			trim: true,
		},
		informationPreference: {
			type: [String],
			enum: ["email", "sms", "call"],
			default: ["email"],
			required: true,
		},
		automaticLanguageDetection: {
			type: Boolean,
			default: false,
		},
		emailAllowance: {
			type: Boolean,
			default: true,
		},
		pushNotification: {
			type: Boolean,
			default: true,
		},
		transferAveragePerMonth: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
	enteredPassword: string
): Promise<boolean> {
	return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser, UserModel>("User", UserSchema);
export default User;
