import express from 'express';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { avatarUpload } from '../../middlewares/upload.js';
import {
    activityFeed,
    diary,
    follow,
    followers,
    following,
    lists,
    reviews,
    show,
    updateGenres,
    updateMe,
    userStats
} from './user.controller.js';

const router = express.Router();

router.get('/feed/activity', authenticate, activityFeed);
router.put('/me/profile', authenticate, avatarUpload.single('avatar'), updateMe);
router.put('/me/genres', authenticate, updateGenres);
router.get('/:username', optionalAuthenticate, show);
router.get('/:username/stats', userStats);
router.get('/:username/diary', diary);
router.get('/:username/reviews', reviews);
router.get('/:username/lists', optionalAuthenticate, lists);
router.post('/:username/follow', authenticate, follow);
router.get('/:username/followers', followers);
router.get('/:username/following', following);

export default router;
