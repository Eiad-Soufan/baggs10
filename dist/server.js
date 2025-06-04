"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Load env vars
dotenv_1.default.config();
// Connect to database
const db_1 = require("./config/db");
(0, db_1.connectDB)();
// Route files
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const workerRoutes_1 = __importDefault(require("./routes/workerRoutes"));
const complaintRoutes_1 = __importDefault(require("./routes/complaintRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
// Swagger documentation
const swagger_1 = __importDefault(require("./config/swagger"));
// Error handler middleware
const error_1 = __importDefault(require("./middleware/error"));
// Initialize app
const app = (0, express_1.default)();
// Body parser
app.use(express_1.default.json());
// Enable CORS
app.use((0, cors_1.default)());
// Set security headers with Swagger UI compatibility
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Mount routers
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/users', userRoutes_1.default);
app.use('/api/v1/workers', workerRoutes_1.default);
app.use('/api/v1/complaints', complaintRoutes_1.default);
app.use('/api/v1/notifications', notificationRoutes_1.default);
// Set up Swagger docs
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the User Management API',
        docs: '/api-docs'
    });
});
// Error handler middleware (should be last)
app.use(error_1.default);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
//# sourceMappingURL=server.js.map