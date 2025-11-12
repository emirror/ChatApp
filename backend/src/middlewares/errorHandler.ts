import {  Response, } from 'express';
import { AppError } from '../utils/errors.js';

export const errorHandler = (
  err: Error | AppError,
  res: Response,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Handle duplicate key errors
  if ((err as any).code === 11000) {
    res.status(400).json({
      status: 'error',
      message: 'Duplicate field value entered',
    });
    return;
  }

  // Default error
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};






