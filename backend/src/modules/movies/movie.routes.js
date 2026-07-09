import express from 'express';
import { optionalAuthenticate, requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { posterUpload } from '../../middlewares/upload.js';
import {
    addNepaliCast,
    createNepali,
    deleteNepali,
    deleteNepaliCast,
    movieReviews,
    newReleases,
    personDetail,
    popularMovies,
    recommendedMovies,
    search,
    showMovie,
    similarMovies,
    syncTmdbMovie,
    topRatedMovies,
    trendingNepaliMovies,
    updateNepali
} from './movie.controller.js';

const router = express.Router();

router.post('/tmdb/sync/:tmdb_id', requireAuth, requireRole('moderator', 'super_admin'), syncTmdbMovie);
router.get('/recommended', requireAuth, recommendedMovies);
router.post('/nepali', requireAuth, requireRole('moderator', 'super_admin'), posterUpload.single('poster'), createNepali);
router.put('/nepali/:id', requireAuth, requireRole('moderator', 'super_admin'), posterUpload.single('poster'), updateNepali);
router.delete('/nepali/:id', requireAuth, requireRole('super_admin'), deleteNepali);
router.post('/nepali/:id/cast', requireAuth, requireRole('moderator', 'super_admin'), addNepaliCast);
router.delete('/nepali/:id/cast/:castId', requireAuth, requireRole('moderator', 'super_admin'), deleteNepaliCast);
router.get('/popular', popularMovies);
router.get('/new-releases', newReleases);
router.get('/top-rated', topRatedMovies);
router.get('/nepali/trending', trendingNepaliMovies);
router.get('/search', search);
router.get('/:id/reviews', optionalAuthenticate, movieReviews);
router.get('/:id/similar', similarMovies);
router.get('/person/:id', personDetail);
router.get('/:id', showMovie);

export default router;
