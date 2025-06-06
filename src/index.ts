import app from './server';
import { connectDB } from './config/db';

// Connect to database before handling any requests
connectDB().catch(console.error);

export default app; 