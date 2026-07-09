import express from 'express';
import multer from 'multer';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import {
    addCast,
    ban,
    createMovie,
    createPerson,
    deleteReview,
    flag,
    flaggedReviews,
    importCsv,
    nepaliMovies,
    recentReviews,
    removeCast,
    searchPersons,
    stats,
    unban,
    updateRole,
    users
} from './admin.controller.js';

const router = express.Router();
const csvUpload = multer({ storage: multer.memoryStorage() });

router.get('/users', requireAuth, requireRole('super_admin'), users);
router.put('/users/:id/role', requireAuth, requireRole('super_admin'), updateRole);
router.delete('/users/:id', requireAuth, requireRole('super_admin'), ban);
router.put('/users/:id/unban', requireAuth, requireRole('super_admin'), unban);
router.get('/reviews', requireAuth, requireRole('moderator', 'super_admin'), recentReviews);
router.get('/reviews/flagged', requireAuth, requireRole('moderator', 'super_admin'), flaggedReviews);
router.post('/reviews/:id/flag', requireAuth, requireRole('moderator', 'super_admin'), flag);
router.delete('/reviews/:id', requireAuth, requireRole('moderator', 'super_admin'), deleteReview);
router.get('/movies/nepali', requireAuth, requireRole('moderator', 'super_admin'), nepaliMovies);
router.get('/stats', requireAuth, requireRole('super_admin'), stats);
router.post('/movies', requireAuth, requireRole('moderator', 'super_admin'), createMovie);
router.get('/persons/search', requireAuth, requireRole('moderator', 'super_admin'), searchPersons);
router.post('/persons', requireAuth, requireRole('moderator', 'super_admin'), createPerson);
router.post('/cast', requireAuth, requireRole('moderator', 'super_admin'), addCast);
router.delete('/cast/:id', requireAuth, requireRole('moderator', 'super_admin'), removeCast);
router.post('/movies/import', requireAuth, requireRole('moderator', 'super_admin'), csvUpload.single('file'), importCsv);

export default router;
