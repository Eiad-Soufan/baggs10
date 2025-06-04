import dotenv from 'dotenv';
import mongoose, { ConnectOptions } from 'mongoose';
import Worker from '../src/models/Worker';

dotenv.config();

interface AdminData {
  name: string;
  email: string;
  phone: string;
  password: string;
  identityNumber: string;
  role: 'admin';
  isAvailable: boolean;
}

const createAdmin = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connect to MongoDB with strict type checking
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    } as ConnectOptions);

    // Admin data - you should change these values when running the script
    const adminData: AdminData = {
      name: process.argv[2] || 'Raouf satto',
      email: process.argv[3] || 'admin@gmail.com',
      phone: process.argv[4] || '+1234567890',
      password: process.argv[5] || 'Admin',
      identityNumber: process.argv[6] || '1234567890',
      role: 'admin',
      isAvailable: true
    };

    // Check if admin already exists
    const existingAdmin = await Worker.findOne({ 
      $or: [
        { email: adminData.email },
        { identityNumber: adminData.identityNumber }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(1);
    }

    // Create admin user
    const admin = await Worker.create(adminData);
    
    console.log('Admin user created successfully:');
    console.log({
      name: admin.name,
      email: admin.email,
      identityNumber: admin.identityNumber,
      role: admin.role
    });

  } catch (error) {
    console.error('Error creating admin:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the function
createAdmin();

/*
Create an admin user in development (NOT recommended for production):
ts-node scripts/createAdmin.ts

Create an admin user in production (recommended):
ts-node scripts/createAdmin.ts "Real Admin Name" "real.admin@company.com" "+1234567890" "SecurePassword123!" "ADMIN123"
*/ 

// # Development (not recommended for production)
// ts-node scripts/createAdmin.ts
// ts-node scripts/createSystemAdmin.ts

// # Production (recommended)
// ts-node scripts/createAdmin.ts "Real Admin Name" "real.admin@company.com" "+1234567890" "SecurePassword123!" "ADMIN123"
// ts-node scripts/createSystemAdmin.ts "Real Admin Name" "real.admin@company.com" "+1234567890" "SecurePassword123!" "ADMIN123"