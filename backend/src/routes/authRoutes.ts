import { Router } from 'express';
import AuthController from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/signup', AuthController.signup.bind(AuthController));
router.post('/login', AuthController.login.bind(AuthController));
router.post('/refresh-token', AuthController.getAccessToken.bind(AuthController));
router.get('/user', authMiddleware, AuthController.getUser.bind(AuthController));

export default router;






