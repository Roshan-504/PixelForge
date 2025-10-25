import express from 'express';
import { getCurrentUser, login } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { updatePassword } from '../controllers/userController.js';

const router = express.Router();

router.post('/login', login);

router.get('/me', authenticate , getCurrentUser);

// Update password
router.put('/users/password', authenticate, updatePassword);

export default router;