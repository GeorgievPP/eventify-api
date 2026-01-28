import express from 'express';

import { protect } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/checkRole.js';

import {
  getEvents,
  getAllEventsAdmin,
  getEventById,
  getDeletedEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  restoreEvent,
  hardDeleteEvent,
  getEventHistory
} from '../controllers/eventController.js';

import {
  getCommentsForEvent,
  createComment,
} from '../controllers/commentController.js';

import {
  rateEvent,
  getEventRating,
  getMyRatingForEvent,
} from '../controllers/ratingController.js';


const router = express.Router();

// PUBLIC
router.get('/', getEvents);
// ADMIN / POWERUSER — get ALL events including deleted
router.get(
  '/all',
  protect,
  requirePermission('canManageEvents'),
  getAllEventsAdmin
);

router.get(
  '/deleted',
  protect,
  requirePermission('canManageEvents'),
  getDeletedEvents
);

// ----------------------
// COMMENTS за даден event
// GET /event/:id/comments  (public – виждат всички)
// POST /event/:id/comments (logged-in user)
// ----------------------
router.get('/:id/comments', getCommentsForEvent);
router.post('/:id/comments', protect, createComment);

// ----------------------
// RATING за дадено event
// POST /events/:id/rating      – създава/ъпдейтва rating на текущия user
// GET  /events/:id/rating      – summary (avg, count) – public
// GET  /events/:id/my-rating   – rating на текущия user – protected
// ----------------------
router.post('/:id/rating', protect, rateEvent);
router.get('/:id/rating', getEventRating);
router.get('/:id/my-rating', protect, getMyRatingForEvent);

// HISTORY
router.get('/:id/history', protect, requirePermission('canManageEvents'), getEventHistory);

router.get('/:id', getEventById);

// PROTECTED
router.post('/', protect, requirePermission('canManageEvents'), createEvent);
router.put('/:id', protect, requirePermission('canManageEvents'), updateEvent);

// SOFT DELETE
router.delete('/:id', protect, requirePermission('canManageEvents'), deleteEvent);

// RESTORE
router.patch('/:id/restore', protect, requirePermission('canManageEvents'), restoreEvent);

// HARD DELETE (admin-only ➜ optional)
router.delete(
  '/:id/hard-delete',
  protect,
  requirePermission('canManageEvents'),
  hardDeleteEvent
);


export default router;
