import app from './server';
import { connectDB } from './config/db';
import cors from 'cors';
app.use(cors());
// Connect to database before handling any requests
connectDB().catch(console.error);

export default app; 
