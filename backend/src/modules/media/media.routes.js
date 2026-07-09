import express from 'express';
import { optionalAuthenticate, requireAuth } from '../../middlewares/auth.middleware.js';
import {
  addFavorite,
  detail,
  favoritesByType,
  listFavorites,
  publicFavorites,
  removeFavorite,
  search
} from './media.controller.js';

const router = express.Router();

router.get('/search', optionalAuthenticate, search);
router.get('/favorites/types', optionalAuthenticate, favoritesByType);
router.get('/favorites', requireAuth, listFavorites);
router.post('/favorites', requireAuth, addFavorite);
router.delete('/favorites/:id', requireAuth, removeFavorite);
router.get('/favorites/user/:username', optionalAuthenticate, publicFavorites);
router.get('/:provider/:id', optionalAuthenticate, detail);

export default router;
