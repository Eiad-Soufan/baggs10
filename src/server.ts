import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
// Route files
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import workerRoutes from './routes/workerRoutes';
import complaintRoutes from './routes/complaintRoutes';
import notificationRoutes from './routes/notificationRoutes';
import orderRoutes from './routes/orderRoutes';
import { connectDB } from './config/db';

// Import models
import './models/Service';

// Swagger documentation
import swaggerSpec from './config/swagger';

// Error handler middleware
import errorHandler from './middleware/error';

// Load env vars
dotenv.config();

// Initialize app
const app: Express = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : '*',
  credentials: true
}));

// Set security headers with Swagger UI compatibility
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/orders', orderRoutes);

// Set up Swagger docs with custom options
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
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
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the Baggs Competition API',
    docs: '/api-docs',
    health: '/health'
  });
});

// Error handler middleware (should be last)
app.use(errorHandler);

// Connect to database and start server only if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  }).catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });
}

export default app; 