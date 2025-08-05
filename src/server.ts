import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
// Route files
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import workerRoutes from './routes/workerRoutes';
import complaintRoutes from './routes/complaintRoutes';
import notificationRoutes from './routes/notificationRoutes';
import transferRoutes from './routes/transferRoutes';
import adRoutes from './routes/adRoutes';
import { connectDB } from './config/db';
import { initializeSocket } from './config/socket';

import User from './models/User';

// Swagger documentation
import swaggerSpec from './config/swagger';

// Error handler middleware
import errorHandler from './middleware/error';
import { apiLimiter } from './middleware/rateLimiter';

// Load env vars
dotenv.config();

// Initialize app
const app: Express = express();
const httpServer = createServer(app);

// Initialize socket.io
const io = initializeSocket(httpServer);

// Body parser
app.use(express.json());

// Enable CORS
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
//     ? process.env.FRONTEND_URL 
//     : '*',
//   credentials: true
// }));


app.use(cors({
  origin: 'https://www.yallahbaggage.com/',
  credentials: true
}));


app.options('*', cors());

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


//INF Apply rate limiting to all routes
app.use(apiLimiter);
// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/ads', adRoutes); 

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

// Function to check and create admin user if none exists
//TODO add env
const checkAndCreateAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'admin user',
        email: 'admin@gmail.com',
        phone: '+5395272334',
        password: '123456',
        identityNumber: '1234567890',
        role: 'admin',
        isAvailable: true
      });
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Connect to database and start server only if not in serverless environment
//if (process.env.NODE_ENV !== 'production') {
  const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  
  connectDB().then(async () => {
    // Check and create admin user after database connection
    await checkAndCreateAdmin();
    
    httpServer.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  }).catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });
//}

export default app; 
