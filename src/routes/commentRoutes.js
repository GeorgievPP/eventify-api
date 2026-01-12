import express from 'express';

import { protect } from '../middleware/auth.js';

import {
    updateComment,
    deleteComment,
    restoreComment,
    toggleLikeComment,
    getCommentHistory,
} from '../controllers/commentController.js';


const router = express.Router();

// Всички тези операции изискват логнат user.
// Permission-ите (owner/admin/poweruser) се проверяват в контролера.

// PUT /comments/:commentId       – редакция (owner или admin/poweruser)
router.put('/:commentId', protect, updateComment);

// DELETE /comments/:commentId    – soft delete (owner или admin/poweruser)
router.delete('/:commentId', protect, deleteComment);

// PATCH /comments/:commentId/restore – restore (owner или admin/poweruser)
router.patch('/:commentId/restore', protect, restoreComment);

// POST /comments/:commentId/like-toggle – like / unlike (само логнат user)
router.post('/:commentId/like-toggle', protect, toggleLikeComment);

// GET /comments/:commentId/history – owner + admin/poweruser
router.get('/:commentId/history', protect, getCommentHistory);

export default router;
