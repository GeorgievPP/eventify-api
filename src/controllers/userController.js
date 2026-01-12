import User from '../models/User.js';

import { sendSuccess } from '../utils/response.js';
import { hasPermission } from '../utils/permissions.js';

// GET /users
export const getAllUsers = async (req, res, next) => {
    try {
        const filter = hasPermission(req.user, 'canSeeDeletedUsers')
            ? {}
            : { isDeleted: false };

        const users = await User.find(filter).select('-password');

        return sendSuccess(res, users);
    } catch (error) {
        next(error);
    }
};

// GET /users/:id
export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        return sendSuccess(res, user);
    } catch (error) {
        next(error);
    }
};

// PUT /users/:id  (редакция на базова инфо, без role)
export const updateUser = async (req, res, next) => {
    try {
        const { email } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId).select('-password');

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (email && email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing && existing._id.toString() !== userId) {
                res.status(400);
                throw new Error('Email is already in use by another user');
            }
            user.email = email;
        }

        const updated = await user.save();

        return sendSuccess(res, {
            id: updated._id,
            email: updated.email,
            role: updated.role,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /users/:id
export const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        if (req.user._id.toString() === userId.toString()) {
            res.status(400);
            throw new Error('You cannot delete your own user');
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (user.isDeleted) {
            return sendSuccess(res, {
                message: 'User is already deleted',
            });
        }
        // soft delete
        user.isDeleted = true;
        user.deletedAt = new Date();

        await user.save();

        console.log("USER DELETED: ", user)


        return sendSuccess(res, {
            message: 'User was soft-deleted (disabled) successfully',
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /users/:id/role
export const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            res.status(400);
            throw new Error('Role is required');
        }

        const allowedRoles = ['user', 'poweruser', 'admin'];
        if (!allowedRoles.includes(role)) {
            res.status(400);
            throw new Error('Invalid role');
        }

        const user = await User.findById(id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.role = role;
        await user.save();

        return sendSuccess(res, {
            message: `User role updated to ${role}`,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /users/:id/restore
export const restoreUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (!user.isDeleted) {
            return sendSuccess(res, {
                message: 'User is already active',
            });
        }

        user.isDeleted = false;
        user.deletedAt = null;

        await user.save();

        return sendSuccess(res, {
            message: 'User was restored successfully',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isDeleted: user.isDeleted,
            },
        });
    } catch (error) {
        next(error);
    }
};
