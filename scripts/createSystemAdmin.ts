import dotenv from 'dotenv';
import mongoose, { ConnectOptions } from 'mongoose';
import User from '../src/models/User';

dotenv.config();

interface SystemAdminData {
  name: string;
  email: string;
  phone: string;
  password: string;
  identityNumber: string;
  role: 'admin';
  isAvailable: boolean;
}

const createSystemAdmin = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connect to MongoDB with strict type checking
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    } as ConnectOptions);

    // System Admin data
    const adminData: SystemAdminData = {
      name: process.argv[2] || 'Raouf satto',
      email: process.argv[3] || 'admin@example.com',
      phone: process.argv[4] || '+1234567890',
      password: process.argv[5] || 'admin@123',
      identityNumber: process.argv[6] || '1234567890',
      role: 'admin',
      isAvailable: true
    };

    // Check if system admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminData.email },
        { identityNumber: adminData.identityNumber }
      ]
    });

    if (existingAdmin) {
      console.log('System Admin user already exists');
      process.exit(1);
    }

    // Create system admin user
    const admin = await User.create(adminData);
    
    console.log('System Admin created successfully:');
    console.log({
      name: admin.name,
      email: admin.email,
      identityNumber: admin.identityNumber,
      role: admin.role
    });

  } catch (error) {
    console.error('Error creating system admin:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the function
createSystemAdmin();

/*
Create an admin user in development (NOT recommended for production):
ts-node scripts/createSystemAdmin.ts

Create an admin user in production (recommended):
ts-node scripts/createSystemAdmin.ts "Real Admin Name" "real.admin@company.com" "+1234567890" "SecurePassword123!" "ADMIN123"
*/ 