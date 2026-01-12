import mongoose from 'mongoose';

import Comment from '../models/Comment.js';
import CommentHistory from '../models/CommentHistory.js';
import Event from '../models/Event.js';

import { hasPermission } from '../utils/permissions.js';
import { sendSuccess, sendMessage } from '../utils/response.js';

// helper за permission (owner или poweruser/admin)
const canModifyComment = (comment, user) => {
    const isOwner =
        comment.userId.toString() === user._id.toString();
    const canManageEvents = hasPermission(user, 'canManageEvents');
    return isOwner || canManageEvents;
};

// helper за audit лог
const logCommentHistory = async ({ comment, user, action, before = null, after = null }) => {
    try {
        await CommentHistory.create({
            commentId: comment._id,
            userId: user?._id,
            action,
            before,
            after,
        });
    } catch (err) {
        console.error('CommentHistory error:', err.message);
    }
};

// =============================
// GET /events/:id/comments
// =============================
export const getCommentsForEvent = async (req, res, next) => {
    try {
        const eventId = req.params.id;

        if (!mongoose.isValidObjectId(eventId)) {
            res.status(404);
            throw new Error('Event not found');
        }

        const event = await Event.findById(eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const comments = await Comment.find({
            eventId,
            isDeleted: false,
        })
            .populate('userId', 'email role')
            .sort({ createdAt: 1 });

        return sendSuccess(res, comments);
    } catch (error) {
        next(error);
    }
};

// =============================
// POST /events/:id/comments
// =============================
export const createComment = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const { content } = req.body;

        if (!mongoose.isValidObjectId(eventId)) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (!content || !content.trim()) {
            res.status(400);
            throw new Error('Comment content is required');
        }

        const event = await Event.findById(eventId);
        if (!event || event.isDeleted) {
            res.status(404);
            throw new Error('Event not found');
        }

        const comment = await Comment.create({
            eventId,
            userId: req.user._id,
            content: content.trim(),
        });

        await logCommentHistory({
            comment,
            user: req.user,
            action: 'created',
            before: null,
            after: comment.toObject(),
        });

        const populated = await Comment.findById(comment._id)
            .populate('userId', 'email role');

        return sendSuccess(res, populated, 201);
    } catch (error) {
        next(error);
    }
};

// =============================
// PUT /comments/:commentId
// =============================
export const updateComment = async (req, res, next) => {
    try {
        const commentId = req.params.commentId;
        const { content } = req.body;

        if (!mongoose.isValidObjectId(commentId)) {
            res.status(404);
            throw new Error('Comment not found');
        }

        const comment = await Comment.findById(commentId);
        if (!comment || comment.isDeleted) {
            res.status(404);
            throw new Error('Comment not found');
        }

        if (!canModifyComment(comment, req.user)) {
            res.status(403);
            throw new Error('Not allowed to edit this comment');
        }

        if (!content || !content.trim()) {
            res.status(400);
            throw new Error('Comment content is required');
        }

        const before = { ...comment._doc };
        comment.content = content.trim();
        await comment.save();

        await logCommentHistory({
            comment,
            user: req.user,
            action: 'updated',
            before,
            after: comment.toObject(),
        });

        const populated = await Comment.findById(comment._id)
            .populate('userId', 'email role');

        return sendSuccess(res, populated);
    } catch (error) {
        next(error);
    }
};

// =============================
// DELETE /comments/:commentId  (SOFT)
// =============================
export const deleteComment = async (req, res, next) => {
    try {
        const commentId = req.params.commentId;

        if (!mongoose.isValidObjectId(commentId)) {
            res.status(404);
            throw new Error('Comment not found');
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            res.status(404);
            throw new Error('Comment not found');
        }

        if (!canModifyComment(comment, req.user)) {
            res.status(403);
            throw new Error('Not allowed to delete this comment');
        }

        if (comment.isDeleted) {
            return sendMessage(res, 'Comment already deleted');
        }

        const before = { ...comment._doc };
        comment.isDeleted = true;
        comment.deletedAt = new Date();
        await comment.save();

        await logCommentHistory({
            comment,
            user: req.user,
            action: 'soft-deleted',
            before,
            after: comment.toObject(),
        });

        return sendMessage(res, 'Comment was soft-deleted successfully');
    } catch (error) {
        next(error);
    }
};

// =============================
// PATCH /comments/:commentId/restore
// =============================
export const restoreComment = async (req, res, next) => {
    try {
        const commentId = req.params.commentId;

        if (!mongoose.isValidObjectId(commentId)) {
            res.status(404);
            throw new Error('Comment not found');
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            res.status(404);
            throw new Error('Comment not found');
        }

        if (!canModifyComment(comment, req.user)) {
            res.status(403);
            throw new Error('Not allowed to restore this comment');
        }

        if (!comment.isDeleted) {
            return sendMessage(res, 'Comment is not deleted');
        }

        const before = { ...comment._doc };

        comment.isDeleted = false;
        comment.deletedAt = null;
        await comment.save();

        await logCommentHistory({
            comment,
            user: req.user,
            action: 'restored',
            before,
            after: comment.toObject(),
        });

        const populated = await Comment.findById(comment._id)
            .populate('userId', 'email role');

        return sendSuccess(res, populated);
    } catch (error) {
        next(error);
    }
};

// =============================
// POST /comments/:commentId/like-toggle
// =============================
export const toggleLikeComment = async (req, res, next) => {
    try {
        const commentId = req.params.commentId;

        if (!mongoose.isValidObjectId(commentId)) {
            res.status(404);
            throw new Error('Comment not found');
        }

        const comment = await Comment.findById(commentId);
        if (!comment || comment.isDeleted) {
            res.status(404);
            throw new Error('Comment not found');
        }

        const userId = req.user._id.toString();
        const index = comment.likes.findIndex(
            (id) => id.toString() === userId
        );

        let liked;
        if (index === -1) {
            comment.likes.push(req.user._id);
            liked = true;
        } else {
            comment.likes.splice(index, 1);
            liked = false;
        }

        await comment.save();

        return sendSuccess(res, {
            commentId: comment._id,
            liked,
            likesCount: comment.likes.length,
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// GET /comments/:commentId/history
// =============================
export const getCommentHistory = async (req, res, next) => {
    try {
        const commentId = req.params.commentId;

        if (!mongoose.isValidObjectId(commentId)) {
            res.status(404);
            throw new Error('Comment not found');
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            res.status(404);
            throw new Error('Comment not found');
        }

        if (!canModifyComment(comment, req.user)) {
            res.status(403);
            throw new Error('Not allowed to view this comment history');
        }

        const history = await CommentHistory.find({ commentId })
            .populate('userId', 'email role')
            .sort({ createdAt: 1 });

        return sendSuccess(res, history);
    } catch (error) {
        next(error);
    }
};
