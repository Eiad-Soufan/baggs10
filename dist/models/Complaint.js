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
        maxlength: [500, 'Response cannot be more than 500 characters']
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const ComplaintSchema = new mongoose_1.default.Schema({
    orderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: [true, 'Order ID is required'],
        ref: 'Order'
    },
    status: {
        type: String,
        enum: ['pending', 'open', 'closed'],
        default: 'open'
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: [true, 'User ID is required'],
        ref: 'User'
    },
    closedByAdminId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        trim: true,
        maxlength: [1000, 'Reason cannot be more than 1000 characters']
    },
    responses: [ResponseSchema],
    closedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});
// Add index for better query performance
ComplaintSchema.index({ userId: 1, status: 1 });
ComplaintSchema.index({ orderId: 1 });
ComplaintSchema.index({ createdAt: -1 });
const Complaint = mongoose_1.default.model('Complaint', ComplaintSchema);
exports.default = Complaint;
//# sourceMappingURL=Complaint.js.map