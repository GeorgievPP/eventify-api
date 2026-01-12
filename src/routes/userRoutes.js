import express from 'express';

import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/checkRole.js';

import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateUserRole,
    restoreUser,
} from '../controllers/userController.js';

const router = express.Router();

// GET /users  -> admin + poweruser (canViewUsers)
router.get('/', protect, requirePermission('canViewUsers'), getAllUsers);

// GET /users/:id -> admin + poweruser (canViewUsers)
router.get('/:id', protect, requirePermission('canViewUsers'), getUserById);

// PUT /users/:id -> само admin (canManageUsers)
router.put(
    '/:id',
    protect,
    requirePermission('canManageUsers'),
    updateUser
);

// PATCH /users/:id/role -> само admin (canManageUsers)
router.patch(
    '/:id/role',
    protect,
    requirePermission('canManageUsers'),
    updateUserRole
);

// PATCH /users/:id/restore -> само admin
router.patch(
    '/:id/restore',
    protect,
    requirePermission('canManageUsers'),
    restoreUser
);

// DELETE /users/:id -> само admin (canManageUsers)
router.delete(
    '/:id',
    protect,
    requirePermission('canManageUsers'),
    deleteUser
);

export default router;
