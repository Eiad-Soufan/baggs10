import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import { IOrder } from '../models/Order';
import mongoose from 'mongoose';

interface AuthenticatedSocket extends Socket {
  user?: Partial<IUser>;
}

interface OrderStatusUpdate {
  orderId: string;
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

    // Join order room
    socket.on('joinOrderRoom', (orderId: string) => {
      socket.join(`order-${orderId}`);
    });

    // Leave order room
    socket.on('leaveOrderRoom', (orderId: string) => {
      socket.leave(`order-${orderId}`);
    });

    // Handle order status updates
    socket.on('updateOrderStatus', async (data: OrderStatusUpdate) => {
      try {
        const { orderId, status } = data;
        
        // Update order in database
        const order = await mongoose.model<IOrder>('Order').findByIdAndUpdate(
          new mongoose.Types.ObjectId(orderId),
          { status },
          { new: true }
        );

        if (order) {
          // Broadcast update to all clients in the order room
          io.to(`order-${orderId}`).emit('orderStatusUpdated', order);
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        socket.emit('error', 'Failed to update order status');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}; 