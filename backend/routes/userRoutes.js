import express from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updatePassword
} from '../controllers/userController.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticate, authorizeRoles('admin'), getUsers);

// Create a new user (admin only)
router.post('/users', authenticate, authorizeRoles('admin'), createUser);

// Get a single user by ID (admin only)
router.get('/users/:id', authenticate, authorizeRoles('admin'), getUser);

// Update a user by ID (admin only)
router.put('/users/:id', authenticate, authorizeRoles('admin'), updateUser);

// Delete a user by ID (admin only)
router.delete('/users/:id', authenticate, authorizeRoles('admin'), deleteUser);

export default router;
