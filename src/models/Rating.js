import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: false,
        },
        value: {
            type: Number,
            min: 0,
            max: 5,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

ratingSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Rating', ratingSchema);
