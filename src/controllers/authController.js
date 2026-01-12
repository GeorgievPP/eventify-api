import User from '../models/User.js';

import generateToken from '../utils/generateToken.js';
import { sendSuccess } from '../utils/response.js';

export const register = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('Email and password are required');
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            res.status(400);
            throw new Error('User with this email already exists');
        }

        const user = await User.create({
            email,
            password,
            role: role || 'user',
        });

        const token = generateToken(user);

        return sendSuccess(
            res,
            {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                },
            },
            201
        );
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('Email and password are required');
        }

        const user = await User.findOne({ email });

        if (!user || user.isDeleted) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        const token = generateToken(user);

        return sendSuccess(res, {
            token,
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
