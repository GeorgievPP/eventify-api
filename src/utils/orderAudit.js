import OrderHistory from '../models/OrderHistory.js';

export const logOrderChange = async ({
    order,
    user,
    action,
    before = null,
    after = null,
}) => {
    try {
        const fromStatus = before?.status ?? null;
        const toStatus = after?.status ?? null;

        await OrderHistory.create({
            orderId: order._id,
            userId: user ? user._id : null,
            action,
            fromStatus,
            toStatus,
            before,
            after,
        });
    } catch (err) {
        console.error('Failed to log order change:', err.message);
    }
};
