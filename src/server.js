import logger from './config/logger.js';

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';


dotenv.config();

// Свързване към MongoDB
connectDB();

// Общ limiter за всички заявки
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минути
    max: 100, // макс 100 заявки от IP за този период
    standardHeaders: true,
    legacyHeaders: false,
});

// По-строг limiter за login
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // макс 10 login опита за 15 мин
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Too many login attempts, please try again later',
            code: 'TOO_MANY_REQUESTS',
        },
    },
});

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json()); // за JSON body
app.use(morgan('dev'));
app.use(apiLimiter); // прилагаме на всички маршрути

// Routes
app.use('/api/auth/login', authLimiter); // специално за login
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

// 404 middleware
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
