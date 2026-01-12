import mongoose from 'mongoose';

import Event from '../models/Event.js';
import EventHistory from '../models/EventHistory.js';
// import { hasPermission } from '../utils/permissions.js';
import { sendSuccess, sendMessage } from '../utils/response.js';
import { logEventChange } from '../utils/eventAudit.js';

// =============================
// GET ALL (excluding deleted)
// =============================
export const getEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ isDeleted: false }).populate('owner', 'email role');
        return sendSuccess(res, events);
    } catch (error) {
        next(error);
    }
};

// =============================
// GET ALL (including deleted) — admin/poweruser
// =============================
export const getAllEventsAdmin = async (req, res, next) => {
    try {
        const events = await Event.find()
            .populate('owner', 'email role')
            .populate('deletedBy', 'email role');

        return sendSuccess(res, events);
    } catch (error) {
        next(error);
    }
};

// =============================
// GET ALL DELETED — admin/poweruser
// =============================
export const getDeletedEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ isDeleted: true })
            .populate('owner', 'email role')
            .populate('deletedBy', 'email role');

        return sendSuccess(res, events);
    } catch (error) {
        next(error);
    }
};


// =============================
// GET ONE
// =============================
export const getEventById = async (req, res, next) => {
    try {
        const id = req.params.id;

        // ако id-то не е валидно ObjectId -> 404
        if (!mongoose.isValidObjectId(id)) {
            res.status(404);
            throw new Error('Event not found');
        }

        const event = await Event.findById(id)
            .populate('owner', 'email role')
            .populate('deletedBy', 'email role');

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        return sendSuccess(res, event);
    } catch (error) {
        next(error);
    }
};

// =============================
// CREATE EVENT
// =============================
export const createEvent = async (req, res, next) => {
    try {
        const { title, imageUrl, genre, country, details, price, eventDate, eventTime, venue, location, totalTickets } = req.body;

        if (!title || !genre || price == null || !eventDate) {
            res.status(400);
            throw new Error('title, genre, price, eventDate are required');
        }

        const eventDateObj = new Date(eventDate);
        if (eventDateObj < new Date()) {
            res.status(400);
            throw new Error('Event date must be in the future');
        }

        const tickets = totalTickets || 0;
        if (tickets < 0) {
            res.status(400);
            throw new Error('Total tickets must be positive');
        }

        const event = await Event.create({
            title,
            imageUrl,
            genre,
            country,
            details,
            price,
            eventDate,
            eventTime,
            venue,
            location,
            totalTickets: tickets,
            availableTickets: tickets,
            owner: req.user._id,
        });

        await logEventChange({
            event,
            user: req.user,
            action: 'created',
            before: null,
            after: event.toObject(),
        });

        return sendSuccess(res, event, 201);
    } catch (error) {
        next(error);
    }
};

// =============================
// UPDATE EVENT
// =============================
export const updateEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event || event.isDeleted) {
            res.status(404);
            throw new Error('Event not found');
        }

        const before = { ...event._doc };

        // обновяваме нормалните полета (без price)
        const fields = ['title', 'imageUrl', 'genre', 'country', 'details', 'eventDate', 'eventTime', 'venue', 'location'];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) event[field] = req.body[field];
        });

        // Ако променят totalTickets, adjust availableTickets
        if (req.body.totalTickets !== undefined) {
            const oldTotal = event.totalTickets; 
            const newTotal = Number(req.body.totalTickets);

            if (newTotal < 0) {
                res.status(400);
                throw new Error('Total tickets must be positive');
            }

            const diff = newTotal - oldTotal;
            event.availableTickets = Math.max(0, event.availableTickets + diff);
            event.totalTickets = newTotal;
        }

        if (req.body.price !== undefined) {
            const newPrice = Number(req.body.price);

            if (Number.isNaN(newPrice) || newPrice < 0) {
                res.status(400);
                throw new Error('Invalid price');
            }

            // ако е различна от текущата цена -> пазим предишната
            if (event.price !== newPrice) {
                event.previousPrice = event.price;
                event.priceChangedAt = new Date();
                event.price = newPrice;
            }
        }


        await event.save();

        await logEventChange({
            event,
            user: req.user,
            action: 'updated',
            before,
            after: event.toObject(),
        });

        return sendSuccess(res, event);
    } catch (error) {
        next(error);
    }
};

// =============================
// SOFT DELETE EVENT
// =============================
export const deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (event.isDeleted) {
            return sendMessage(res, 'Event already deleted');
        }

        const before = { ...event._doc };

        event.isDeleted = true;
        event.deletedAt = new Date();
        event.deletedBy = req.user._id;

        await event.save();

        await logEventChange({
            event,
            user: req.user,
            action: 'soft_deleted',
            before,
            after: event.toObject(),
        });

        return sendMessage(res, 'Event was soft-deleted successfully');
    } catch (error) {
        next(error);
    }
};

// =============================
// RESTORE EVENT
// =============================
export const restoreEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (!event.isDeleted) {
            return sendMessage(res, 'Event is not deleted');
        }

        const before = { ...event._doc };

        event.isDeleted = false;
        event.deletedAt = null;
        event.deletedBy = null;

        await event.save();

        await logEventChange({
            event,
            user: req.user,
            action: 'restored',
            before,
            after: event.toObject(),
        });

        return sendMessage(res, 'Event was restored successfully');
    } catch (error) {
        next(error);
    }
};

// =============================
// HARD DELETE EVENT
// =============================
export const hardDeleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const before = { ...event._doc };

        await event.deleteOne();

        await logEventChange({
            event,
            user: req.user,
            action: 'hard_deleted',
            before,
            after: null,
        });

        return sendMessage(res, 'Event was permanently deleted');
    } catch (error) {
        next(error);
    }
};

// =============================
// GET EVENT HISTORY
// =============================
export const getEventHistory = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const history = await EventHistory.find({ eventId })
            .populate('userId', 'email role')
            .sort({ createdAt: 1 });

        return sendSuccess(res, history);
    } catch (error) {
        next(error);
    }
};