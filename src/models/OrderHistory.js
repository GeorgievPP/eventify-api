import mongoose from 'mongoose';

const orderHistorySchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        action: {
            type: String,
            enum: ['created', 'updated', 'status_changed', 'cancelled'],
            required: true,
        },
        fromStatus: {
            type: String,
            default: null,
        },
        toStatus: {
            type: String,
            default: null,
        },
        before: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        after: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const OrderHistory = mongoose.model('OrderHistory', orderHistorySchema);

export default OrderHistory;
