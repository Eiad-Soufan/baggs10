"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ResponseSchema = new mongoose_1.default.Schema({
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Response cannot be more than 1000 characters']
    },
    responderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    responderRole: {
        type: String,
        required: true,
        enum: ['customer', 'admin']
    },
    attachments: [{
            type: String,
            trim: true
        }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
const ComplaintSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['service', 'worker', 'payment', 'technical', 'other']
    },
    priority: {
        type: String,
        required: [true, 'Priority is required'],
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'rejected', 'closed'],
        default: 'pending'
    },
    orderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: [true, 'Order ID is required'],
        ref: 'Order'
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User'
    },
    assignedToId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User'
    },
    relatedWorkerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Worker'
    },
    closedByAdminId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User'
    },
    attachments: [{
            type: String,
            trim: true
        }],
    resolution: {
        type: String,
        trim: true,
        maxlength: [1000, 'Resolution cannot be more than 1000 characters']
    },
    responses: [ResponseSchema],
    closedAt: {
        type: Date
    }
}, {
    timestamps: true
});
// Add indexes for better query performance
ComplaintSchema.index({ userId: 1, status: 1 });
ComplaintSchema.index({ orderId: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ priority: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ createdAt: -1 });
ComplaintSchema.index({ assignedToId: 1 });
const Complaint = mongoose_1.default.model('Complaint', ComplaintSchema);
exports.default = Complaint;
//# sourceMappingURL=Complaint.js.map