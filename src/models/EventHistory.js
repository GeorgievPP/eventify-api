import mongoose from 'mongoose';

const eventHistorySchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        action: {
            type: String,
            enum: ['created', 'updated', 'soft_deleted', 'restored', 'hard_deleted'],
            required: true,
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
    { timestamps: true }
);

export default mongoose.model('EventHistory', eventHistorySchema);
