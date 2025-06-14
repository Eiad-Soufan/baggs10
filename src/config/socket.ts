import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import mongoose from 'mongoose';
import { ITransfer } from '../models/Transfer';

interface AuthenticatedSocket extends Socket {
  user?: Partial<IUser>;
}

interface TransferStatusUpdate {
  transferId: string;
  status: string;
}

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as IUser;
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('Client connected:', socket.id);

    // Join transfer room
    socket.on('joinTransferRoom', (transferId: string) => {
      socket.join(`transfer-${transferId}`);
    });

    // Leave transfer room
    socket.on('leaveTransferRoom', (transferId: string) => {
      socket.leave(`transfer-${transferId}`);
    });

    // Handle transfer status updates
    socket.on('updateTransferStatus', async (data: TransferStatusUpdate) => {
      try {
        const { transferId, status } = data;
        
        // Update transfer in database
        const transfer = await mongoose.model<ITransfer>('Transfer').findByIdAndUpdate(
          new mongoose.Types.ObjectId(transferId),
          { status },
          { new: true }
        );

        if (transfer) {
          // Broadcast update to all clients in the transfer room
          io.to(`transfer-${transferId}`).emit('transferStatusUpdated', transfer);
        }
      } catch (error) {
        console.error('Error updating transfer status:', error);
        socket.emit('error', 'Failed to update transfer status');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}; 