import express from 'express';

import { register, login, logout } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

/**
 * Register new user
 * @route POST /api/auth/register
 * @body { email: string, password: string, role?: string }
 */
router.post('/register', register);

/**
 * Login user
 * @route POST /api/auth/login
 * @body { email: string, password: string }
 */
router.post('/login', login);

// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================

/**
 * Logout current user
 * @route POST /api/auth/logout
 * @access Private (requires valid JWT token)
 * @headers { Authorization: 'Bearer <token>' }
 */
router.post('/logout', protect, logout);


export default router;
