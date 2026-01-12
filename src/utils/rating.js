import Rating from '../models/Rating.js';

import Event from '../models/Event.js';

export const recalcEventRating = async (eventId) => {
    const ratings = await Rating.find({ eventId });

    if (ratings.length === 0) {
        await Event.findByIdAndUpdate(eventId, {
            ratingAvg: 0,
            ratingCount: 0,
        });
        return { ratingAvg: 0, ratingCount: 0 };
    }

    const sum = ratings.reduce((acc, r) => acc + r.value, 0);
    const avg = sum / ratings.length;

    const ratingAvg = Math.round(avg * 10) / 10;
    const ratingCount = ratings.length;

    await Event.findByIdAndUpdate(eventId, {
        ratingAvg,
        ratingCount,
    });

    return { ratingAvg, ratingCount };
};
