import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new BadRequestError('Username and password are required');
      }

      if (password.length < 6) {
        throw new BadRequestError('Password must be at least 6 characters long');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new BadRequestError('Username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = new User({
        username,
        password: hashedPassword,
      });

      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        status: 'success',
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new BadRequestError('Username and password are required');
      }

      // Find user with password field
      const user = await User.findOne({ username }).select('+password').exec();
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        status: 'success',
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.log(error)
      next(error);
    }
  }

  async getAccessToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }

      const { verifyToken } = await import('../utils/token.js');
      const payload = verifyToken(refreshToken);

      const user = await User.findById(payload.id);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const accessToken = generateAccessToken(user);

      res.json({
        status: 'success',
        data: {
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      res.json({
        status: 'success',
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

