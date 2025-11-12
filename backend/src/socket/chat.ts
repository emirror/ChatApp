import { Server as SocketServer, Socket } from 'socket.io';
import { Message } from '../models/Message.js';
import { verifyToken, JWTPayload } from '../utils/token.js';
import { Types } from 'mongoose';
import { log } from 'console';

const userSocketMap = new Map<string, string>();

export const setupSocket = (io: SocketServer): void => {
  // Authentication middleware for socket
  io.use((socket, next) => {
    console.log("socket.handshake", socket.handshake);
    
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const payload = verifyToken(token);
      (socket as any).user = payload;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JWTPayload;
    
    if (!user) {
      socket.disconnect();
      return;
    }

    // Store user socket mapping
    userSocketMap.set(user.id, socket.id);
    console.log(`User ${user.username} connected with socket ${socket.id}`);

    // Handle incoming messages
    socket.on('message', async (data: { message: string; to: string }) => {
      try {
        const { message, to } = data;

        if (!message || !to) {
          socket.emit('error', { message: 'Message and recipient are required' });
          return;
        }

        // Create and save message
        const newMessage = new Message({
          message,
          from: new Types.ObjectId(user.id),
          to: new Types.ObjectId(to),
        });

        await newMessage.save();

        // Populate user details
        await newMessage.populate('from', 'username');
        await newMessage.populate('to', 'username');

        const messageObj = newMessage.toObject() as any;
        
        // Normalize message data to match frontend expectations
        // Convert populated objects to strings for from/to fields
        const messageData = {
          _id: messageObj._id.toString(),
          message: messageObj.message,
          from: typeof messageObj.from === 'object' && messageObj.from?._id 
            ? messageObj.from._id.toString() 
            : messageObj.from.toString(),
          to: typeof messageObj.to === 'object' && messageObj.to?._id 
            ? messageObj.to._id.toString() 
            : messageObj.to.toString(),
          createdAt: messageObj.createdAt.toISOString(),
          updatedAt: messageObj.updatedAt.toISOString(),
        };

        console.log('Message saved and normalized:', messageData);

        // Emit to recipient if online
        const recipientSocketId = userSocketMap.get(to);
        if (recipientSocketId) {
          console.log(`Emitting message to recipient ${to} on socket ${recipientSocketId}`);
          io.to(recipientSocketId).emit('message', messageData);
        } else {
          console.log(`Recipient ${to} is not online`);
        }

        // Emit back to sender
        console.log(`Emitting message back to sender ${user.id} on socket ${socket.id}`);
        socket.emit('message', messageData);
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      userSocketMap.delete(user.id);
      console.log(`User ${user.username} disconnected`);
    });
  });
};

