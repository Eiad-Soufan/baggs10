"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ServiceSchema = new mongoose_1.default.Schema({
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
}, {
    timestamps: true
});
// Add indexes for better query performance
ServiceSchema.index({ name: 1 });
exports.Service = mongoose_1.default.model('Service', ServiceSchema);
//# sourceMappingURL=Service.js.map