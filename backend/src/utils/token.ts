import jwt from 'jsonwebtoken';
import { IUser } from '../models/User.js';

export interface JWTPayload {
  id: string;
  username: string;
}

export function generateAccessToken(user: IUser): string {
  const payload: JWTPayload = {
    id: user._id.toString(),
    username: user.username,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '100000s',
  });
}

export function generateRefreshToken(user: IUser): string {
  const payload: JWTPayload = {
    id: user._id.toString(),
    username: user.username,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30000s',
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}




