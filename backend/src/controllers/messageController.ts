import { Request, Response, NextFunction } from 'express';
import { Message } from '../models/Message.js';
import { BadRequestError } from '../utils/errors.js';

export class MessageController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { channel, lastMessage } = req.query;
      const userId = req.user.id;

      if (!channel) {
        throw new BadRequestError('Channel (to user ID) is required');
      }

      const { Types } = await import('mongoose');
      const limit = 10;
      const query: any = {
        $or: [
          { from: new Types.ObjectId(userId), to: new Types.ObjectId(channel as string) },
          { from: new Types.ObjectId(channel as string), to: new Types.ObjectId(userId) },
        ],
      };

      if (lastMessage) {
        query._id = { $lt: new Types.ObjectId(lastMessage as string) };
      }

      const messages = await Message.find(query)
        .populate('from', 'username')
        .populate('to', 'username')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
        
      // Normalize message data to ensure from/to are strings
      const normalizedMessages = messages.map((msg: any) => ({
        _id: msg._id.toString(),
        message: msg.message,
        from: typeof msg.from === 'object' && msg.from?._id 
          ? msg.from._id.toString() 
          : msg.from.toString(),
        to: typeof msg.to === 'object' && msg.to?._id 
          ? msg.to._id.toString() 
          : msg.to.toString(),
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
      }));
      
      res.json({
        status: 'success',
        data: normalizedMessages.reverse(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { User } = await import('../models/User.js');
      const users = await User.find({ _id: { $ne: req.user.id } })
        .select('username')
        .lean();

      res.json({
        status: 'success',
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageController();

