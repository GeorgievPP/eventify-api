import express from 'express';

import { protect } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/checkRole.js';

import {
    getOrders,
    getOrderById,
    getOrderHistory,
    createOrder,
    updateOrder,
    cancelOrder,
} from '../controllers/orderController.js';

const router = express.Router();

// GET /orders – admin: всички, user: само неговите
router.get('/', protect, getOrders);

// GET /orders/:id – user: само своя, admin/poweruser: всички
router.get('/:id', protect, getOrderById);

// GET /orders/:id/history – история на поръчката
router.get('/:id/history', protect, getOrderHistory);

// POST /orders – създава order на база items
router.post('/', protect, createOrder);

// PUT /orders/:id – редакция на поръчка (само poweruser/admin)
router.put(
    '/:id',
    protect,
    requirePermission('canManageAllOrders'),
    updateOrder
);

// PATCH /orders/:id/cancel – маркира поръчката като cancelled (само poweruser/admin)
router.patch(
    '/:id/cancel',
    protect,
    requirePermission('canManageAllOrders'),
    cancelOrder
);

export default router;
