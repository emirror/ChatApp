import { Router } from 'express';
import MessageController from '../controllers/messageController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);
router.get('/', MessageController.list.bind(MessageController));
router.get('/users', MessageController.getUsers.bind(MessageController));

export default router;






