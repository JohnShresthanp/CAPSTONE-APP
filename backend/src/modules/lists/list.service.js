import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { logActivity } from '../../utils/activityLogger.js';

const listInclude = {
    movies: {
        include: { movie: true },
        orderBy: { addedAt: 'desc' }
    },
    _count: {
        select: { movies: true }
    }
};

const SYSTEM_LIST_DEFAULTS = [
    { name: 'Watchlist', systemType: 'watchlist' },
    { name: 'Liked Movies', systemType: 'liked' },
    { name: 'Watched', systemType: 'watched' }
];

const ensureSystemLists = async (userId) => {
    const existing = await prisma.list.findMany({
        where: { userId, isSystem: true },
        select: { systemType: true }
    });
    const existingTypes = new Set(existing.map((l) => l.systemType));
    const missing = SYSTEM_LIST_DEFAULTS.filter((l) => !existingTypes.has(l.systemType));
    if (missing.length > 0) {
        await prisma.list.createMany({
            data: missing.map((l) => ({ ...l, userId, isSystem: true })),
            skipDuplicates: true
        });
    }
};

const getOwnedList = async ({ listId, userId }) => {
    const list = await prisma.list.findFirst({
        where: { id: listId, userId }
    });

    if (!list) {
        throw new ApiError(404, 'List not found');
    }

    return list;
};

export const getMyLists = async (userId) => {
    await ensureSystemLists(userId);
    return prisma.list.findMany({
        where: { userId },
        include: listInclude,
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }]
    });
};

export const createList = ({ userId, body }) => {
    if (!body.name?.trim()) {
        throw new ApiError(400, 'List name is required');
    }

    return prisma.list.create({
        data: {
            userId,
            name: body.name.trim(),
            description: body.description || null,
            isPrivate: Boolean(body.isPrivate)
        },
        include: listInclude
    });
};

export const updateList = async ({ listId, userId, body }) => {
    const list = await getOwnedList({ listId, userId });

    if (list.isSystem && body.name !== undefined) {
        throw new ApiError(400, 'Cannot rename system lists');
    }

    if (body.name !== undefined && !body.name.trim()) {
        throw new ApiError(400, 'List name is required');
    }

    return prisma.list.update({
        where: { id: listId },
        data: {
            ...(body.name !== undefined ? { name: body.name.trim() } : {}),
            ...(body.description !== undefined ? { description: body.description || null } : {}),
            ...(body.isPrivate !== undefined ? { isPrivate: Boolean(body.isPrivate) } : {})
        },
        include: listInclude
    });
};

export const deleteList = async ({ listId, userId }) => {
    const list = await getOwnedList({ listId, userId });

    if (list.isSystem) {
        throw new ApiError(400, 'Cannot delete system lists');
    }

    await prisma.list.delete({ where: { id: listId } });
};

export const addMovieToList = async ({ listId, userId, body }) => {
    if (!body.movieId) {
        throw new ApiError(400, 'movieId is required');
    }

    await ensureSystemLists(userId);

    const list = await getOwnedList({ listId, userId });
    let movie = await prisma.movie.findUnique({
        where: { id: body.movieId },
        select: { id: true, title: true, posterUrl: true }
    });

    if (!movie) {
        const tmdbId = parseInt(body.movieId, 10);
        if (!isNaN(tmdbId)) {
            movie = await prisma.movie.findUnique({
                where: { tmdbId },
                select: { id: true, title: true, posterUrl: true }
            });
        }
    }

    if (!movie) {
        throw new ApiError(404, 'Movie not found');
    }

    const sortOrder = body.sortOrder !== undefined ? parseInt(body.sortOrder) : null;

    if (body.sortOrder !== undefined && Number.isNaN(sortOrder)) {
        throw new ApiError(400, 'sortOrder must be a valid number');
    }

    await prisma.listMovie.upsert({
        where: {
            listId_movieId: {
                listId,
                movieId: movie.id
            }
        },
        create: {
            listId,
            movieId: movie.id,
            notes: body.notes || null,
            sortOrder
        },
        update: {
            notes: body.notes || null,
            sortOrder
        }
    });

    await logActivity({
        actorId: userId,
        type: list.systemType === 'watched' ? 'WATCHED' : 'ADDED_TO_LIST',
        targetType: list.systemType === 'watched' ? 'movie' : 'list',
        targetId: list.systemType === 'watched' ? movie.id : list.id,
        metadata: {
            listName: list.name,
            movieId: movie.id,
            movieTitle: movie.title,
            posterUrl: movie.posterUrl
        }
    });

    return prisma.list.findUnique({
        where: { id: listId },
        include: listInclude
    });
};

export const removeMovieFromList = async ({ listId, userId, movieId }) => {
    await ensureSystemLists(userId);
    await getOwnedList({ listId, userId });

    let movie = await prisma.movie.findUnique({
        where: { id: movieId },
        select: { id: true }
    });
    if (!movie) {
        const tmdbId = parseInt(movieId, 10);
        if (!isNaN(tmdbId)) {
            movie = await prisma.movie.findUnique({
                where: { tmdbId },
                select: { id: true }
            });
        }
    }

    if (!movie) {
        throw new ApiError(404, 'Movie not found in list');
    }

    await prisma.listMovie.deleteMany({
        where: { listId, movieId: movie.id }
    });
};

export const getList = async (listId) => {
    const list = await prisma.list.findUnique({
        where: { id: listId },
        include: listInclude
    });

    if (!list) {
        throw new ApiError(404, 'List not found');
    }

    return list;
};

export const getUserLists = async ({ username, requesterId }) => {
    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return prisma.list.findMany({
        where: {
            userId: user.id,
            ...(requesterId === user.id ? {} : { isPrivate: false })
        },
        include: listInclude,
        orderBy: { createdAt: 'desc' }
    });
};
