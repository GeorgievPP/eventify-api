import Order from '../models/Order.js';
import Event from '../models/Event.js';
import OrderHistory from '../models/OrderHistory.js';

import calculateOrderTotal from '../utils/calculateOrderTotal.js';
import { hasPermission } from '../utils/permissions.js';
import { sendSuccess } from '../utils/response.js';
import { logOrderChange } from '../utils/orderAudit.js';


export const getOrders = async (req, res, next) => {
    try {
        let query = {};

        if (!hasPermission(req.user, 'canManageAllOrders')) {
            query.userId = req.user._id;
        }

        const orders = await Order.find(query)
            .populate('userId', 'email role')
            .sort({ createdAt: -1 });

        return sendSuccess(res, orders);
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'email role')
            // .populate('items.eventId', 'title price');

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        if (!hasPermission(req.user, 'canManageAllOrders')) {
            if (order.userId._id.toString() !== req.user._id.toString()) {
                res.status(403);
                throw new Error('You do not have permission to view this order');
            }
        }

        return sendSuccess(res, order);
    } catch (error) {
        next(error);
    }
};



export const createOrder = async (req, res, next) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400);
            throw new Error('Order items are required');
        }

        const preparedItems = [];

        for (const item of items) {
            const { eventId, quantity } = item;

            if (!eventId || !quantity) {
                res.status(400);
                throw new Error('Each item must have eventId and quantity');
            }

            if (quantity < 1) {
                res.status(400);
                throw new Error('Quantity must be at least 1');
            }

            const event = await Event.findById(eventId);

            if (!event) {
                res.status(400);
                throw new Error(`Event with id ${eventId} not found`);
            }

            if (event.isDeleted) {
                res.status(400);
                throw new Error(`Event "${event.title}" is no longer available`);
            }

            if (event.eventDate < new Date()) {
                res.status(400);
                throw new Error(`Event "${event.title}" has already passed`);
            }

            if (event.availableTickets < quantity) {
                res.status(400);
                throw new Error(
                    `Not enough tickets for "${event.title}". Only ${event.availableTickets} tickets available.`
                );
            }

            event.availableTickets -= quantity;
            await event.save();


            preparedItems.push({
                eventId: event._id,
                title: event.title,
                unitPrice: event.price,
                quantity,
            });
        }

        const totalPrice = calculateOrderTotal(preparedItems);

        const order = await Order.create({
            userId: req.user._id,
            items: preparedItems,
            totalPrice,
            // status по подразбиране = pending
        });

        await logOrderChange({
            order,
            user: req.user,
            action: 'created',
            before: null,
            after: {
                status: order.status,
                items: order.items,
                totalPrice: order.totalPrice,
            },
        });

        return sendSuccess(res, order, 201);
    } catch (error) {
        next(error);
    }
};

export const updateOrder = async (req, res, next) => {
    try {
        if (!hasPermission(req.user, 'canManageAllOrders')) {
            res.status(403);
            throw new Error('You do not have permission to update orders');
        }

        const { items, status } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        const before = {
            status: order.status,
            items: order.items,
            totalPrice: order.totalPrice,
        };

        if (items) {
            if (!Array.isArray(items) || items.length === 0) {
                res.status(400);
                throw new Error('Order must contain at least one item');
            }

            for (const oldItem of order.items) {
                const event = await Event.findById(oldItem.eventId);
                if (event) {
                    event.availableTickets += oldItem.quantity;
                    await event.save();
                }
            }

            const preparedItems = [];

            for (const item of items) {
                const { eventId, quantity } = item;

                if (!eventId || !quantity) {
                    res.status(400);
                    throw new Error('Each item must have eventId and quantity');
                }

                const event = await Event.findById(eventId);

                if (!event) {
                    res.status(400);
                    throw new Error(`Event with id ${eventId} not found`);
                }

                if (event.availableTickets < quantity) {
                    res.status(400);
                    throw new Error(
                        `Not enough tickets for "${event.title}". Only ${event.availableTickets} available.`
                    );
                }

                event.availableTickets -= quantity;
                await event.save();

                preparedItems.push({
                    eventId: event._id,
                    title: event.title,
                    unitPrice: event.price,
                    quantity,
                });
            }

            order.items = preparedItems;
            order.totalPrice = calculateOrderTotal(preparedItems);
        }

        if (status) {
            order.status = status;
        }

        await order.save();

        const after = {
            status: order.status,
            items: order.items,
            totalPrice: order.totalPrice,
        };

        await logOrderChange({
            order,
            user: req.user,
            action: 'updated',
            before,
            after,
        });

        return sendSuccess(res, order);
    } catch (error) {
        next(error);
    }
};


export const cancelOrder = async (req, res, next) => {
    try {
        if (!hasPermission(req.user, 'canManageAllOrders')) {
            res.status(403);
            throw new Error('You do not have permission to cancel orders');
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        if (order.status === 'cancelled') {
            return sendSuccess(res, {
                message: 'Order is already cancelled',
                order,
            });
        }

        const before = {
            status: order.status,
            items: order.items,
            totalPrice: order.totalPrice,
        };

        order.status = 'cancelled';

        for (const item of order.items) {
            const event = await Event.findById(item.eventId);
            if (event) {
                event.availableTickets += item.quantity;
                await event.save();
            }
        }

        await order.save();

        const after = {
            status: order.status,
            items: order.items,
            totalPrice: order.totalPrice,
        };

        await logOrderChange({
            order,
            user: req.user,
            action: 'cancelled',
            before,
            after,
        });

        return sendSuccess(res, {
            message: 'Order cancelled successfully',
            order,
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderHistory = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        const order = await Order.findById(orderId).populate('userId', 'email role');

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        if (!hasPermission(req.user, 'canManageAllOrders')) {
            if (order.userId._id.toString() !== req.user._id.toString()) {
                res.status(403);
                throw new Error('You do not have permission to view this order history');
            }
        }

        const history = await OrderHistory.find({ orderId })
            .populate('userId', 'email role')
            .sort({ createdAt: 1 });

        return sendSuccess(res, history);
    } catch (error) {
        next(error);
    }
};



