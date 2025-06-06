"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server"));
const db_1 = require("./config/db");
// Connect to database before handling any requests
(0, db_1.connectDB)().catch(console.error);
exports.default = server_1.default;
//# sourceMappingURL=index.js.map