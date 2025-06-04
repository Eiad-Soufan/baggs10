"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const NotificationSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [1000, 'Message cannot be more than 1000 characters']
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error'],
        default: 'info'
    },
    targetUsers: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User'
        }],
    isGlobal: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    readBy: [{
            user: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'User'
            },
            readAt: {
                type: Date,
                default: Date.now
            }
        }],
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
}, {
    timestamps: true
});
// Add indexes for better query performance
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ 'targetUsers': 1 });
NotificationSchema.index({ isGlobal: 1 });
NotificationSchema.index({ expiresAt: 1 });
const Notification = mongoose_1.default.model('Notification', NotificationSchema);
exports.default = Notification;
//# sourceMappingURL=Notification.js.map