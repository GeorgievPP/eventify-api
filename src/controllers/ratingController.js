import mongoose from 'mongoose';

import Rating from '../models/Rating.js';
import Event from '../models/Event.js';

import { recalcEventRating } from '../utils/rating.js';
import { sendSuccess } from '../utils/response.js';

// =============================
// POST /events/:id/rating
// (create/update rating for this user)
// =============================
export const rateEvent = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const { value } = req.body;

        if (!mongoose.isValidObjectId(eventId)) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (value == null) {
            res.status(400);
            throw new Error('Rating value is required');
        }

        if (value < 0 || value > 5) {
            res.status(400);
            throw new Error('Rating must be between 0 and 5');
        }

        const event = await Event.findById(eventId);
        if (!event || event.isDeleted) {
            res.status(404);
            throw new Error('Event not found');
        }

        const userId = req.user._id;

        let rating = await Rating.findOne({ eventId, userId });

        if (rating) {
            rating.value = value;
            await rating.save();
        } else {
            rating = await Rating.create({ eventId, userId, value });
        }

        const summary = await recalcEventRating(eventId);

        return sendSuccess(res, {
            eventId,
            userId,
            value: rating.value,
            ratingAvg: summary.ratingAvg,
            ratingCount: summary.ratingCount,
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// GET /events/:id/rating
// (summary only: average + count)
// =============================
export const getEventRating = async (req, res, next) => {
    try {
        const eventId = req.params.id;

        if (!mongoose.isValidObjectId(eventId)) {
            res.status(404);
            throw new Error('Event not found');
        }

        const event = await Event.findById(eventId);

        if (!event || event.isDeleted) {
            res.status(404);
            throw new Error('Event not found');
        }

        return sendSuccess(res, {
            eventId,
            ratingAvg: event.ratingAvg || 0,
            ratingCount: event.ratingCount || 0,
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// GET /events/:id/my-rating
// (за логнат user – какво е гласувал)
// =============================
export const getMyRatingForEvent = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const userId = req.user._id;

        if (!mongoose.isValidObjectId(eventId)) {
            res.status(404);
            throw new Error('Event not found');
        }

        const rating = await Rating.findOne({ eventId, userId });

        return sendSuccess(res, {
            eventId,
            value: rating ? rating.value : null,
        });
    } catch (error) {
        next(error);
    }
};
