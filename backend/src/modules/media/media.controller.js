import { prisma } from '../../lib/prisma.js';
import * as mediaService from './media.service.js';

const asyncController = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const search = asyncController(async (req, res) => {
  const { q, page, limit } = req.query;
  const result = await mediaService.unifiedSearch({ q, page: parseInt(page) || 1, limit: parseInt(limit) || 100 });
  res.json({ success: true, data: result });
});

export const detail = asyncController(async (req, res) => {
  const { provider, id } = req.params;
  const result = await mediaService.getMediaDetail(provider, id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  res.json({ success: true, data: result });
});

export const addFavorite = asyncController(async (req, res) => {
  const { provider, externalId, mediaType, title, poster, subtitle } = req.body;
  if (!provider || !externalId || !mediaType || !title) {
    return res.status(400).json({ success: false, message: 'provider, externalId, mediaType, and title are required' });
  }
  const favorite = await mediaService.addFavorite({
    userId: req.user.id,
    provider,
    externalId,
    mediaType,
    title,
    poster,
    subtitle
  });
  res.status(201).json({ success: true, data: favorite });
});

export const removeFavorite = asyncController(async (req, res) => {
  const result = await mediaService.removeFavorite({
    userId: req.user.id,
    favoriteId: req.params.id
  });
  res.json({ success: true, data: result });
});

export const listFavorites = asyncController(async (req, res) => {
  const { type, page, limit } = req.query;
  const result = await mediaService.getUserFavorites({
    userId: req.user.id,
    mediaType: type || undefined,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20
  });
  res.json({ success: true, data: result });
});

export const favoritesByType = asyncController(async (req, res) => {
  if (!req.user) {
    return res.json({ success: true, data: { movie: [], book: [], album: [], artist: [], music: [], person: [], recent: [] } });
  }
  const result = await mediaService.getUserFavoritesByType(req.user.id);
  res.json({ success: true, data: result });
});

export const publicFavorites = asyncController(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const result = await mediaService.getUserFavoritesByType(user.id);
  res.json({ success: true, data: result });
});
