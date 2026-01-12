import mongoose from 'mongoose';

const commentHistorySchema = new mongoose.Schema(
    {
        commentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            enum: ['created', 'updated', 'soft-deleted', 'restored'],
            required: true,
        },
        before: {
            type: Object,
            default: null,
        },
        after: {
            type: Object,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('CommentHistory', commentHistorySchema);
