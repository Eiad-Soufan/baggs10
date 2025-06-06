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
// Route files
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const workerRoutes_1 = __importDefault(require("./routes/workerRoutes"));
const complaintRoutes_1 = __importDefault(require("./routes/complaintRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const db_1 = require("./config/db");
// Import models
require("./models/Service");
// Swagger documentation
const swagger_1 = __importDefault(require("./config/swagger"));
// Error handler middleware
const error_1 = __importDefault(require("./middleware/error"));
// Load env vars
dotenv_1.default.config();
// Initialize app
const app = (0, express_1.default)();
// Body parser
app.use(express_1.default.json());
// Enable CORS
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : '*',
    credentials: true
}));
// Set security headers with Swagger UI compatibility
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Mount routers
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/users', userRoutes_1.default);
app.use('/api/v1/workers', workerRoutes_1.default);
app.use('/api/v1/complaints', complaintRoutes_1.default);
app.use('/api/v1/notifications', notificationRoutes_1.default);
app.use('/api/v1/orders', orderRoutes_1.default);
// Set up Swagger docs with custom options
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Baggs Competition API Documentation",
    customfavIcon: "/api-docs/favicon-32x32.png",
    swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showCommonExtensions: true,
        syntaxHighlight: {
            activated: true,
            theme: "monokai"
        }
    }
}));
// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Baggs Competition API',
        docs: '/api-docs',
        health: '/health'
    });
});
// Error handler middleware (should be last)
app.use(error_1.default);
// Connect to database and start server only if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    (0, db_1.connectDB)().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    }).catch((error) => {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map