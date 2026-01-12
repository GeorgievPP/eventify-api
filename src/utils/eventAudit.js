import EventHistory from "../models/EventHistory.js";

export const logEventChange = async ({ event, user, action, before = null, after = null }) => {
    try {
        await EventHistory.create({
            eventId: event._id,
            userId: user?._id || null,
            action,
            before,
            after,
        });
    } catch (err) {
        console.error('Event audit log error:', err.message);
    }
};
