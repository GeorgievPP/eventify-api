import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        imageUrl: {
            type: String,
            default: '',
        },
        genre: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            default: '',
        },
        details: {
            type: String,
            default: '',
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        // ✅ NEW
        previousPrice: { type: Number, default: null, min: 0 },
        priceChangedAt: { type: Date, default: null },

        // 🎫 EVENT-SPECIFIC FIELDS FOR EVENTPASS
        eventDate: {
            type: Date,
            required: true,
        },
        eventTime: {
            type: String,
            default: '',
            trim: true,
        },
        venue: {
            type: String,
            default: '',
            trim: true,
        },
        location: {
            type: String,
            default: '',
            trim: true,
        },
        totalTickets: {
            type: Number,
            default: 0,
            min: 0,
        },
        availableTickets: {
            type: Number,
            default: 0,
            min: 0,
        },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        ratingAvg: {
            type: Number,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

eventSchema.virtual('isPastEvent').get(function () {
    return this.eventDate < new Date();
});

eventSchema.virtual('isSoldOut').get(function () {
    return this.availableTickets === 0;
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
