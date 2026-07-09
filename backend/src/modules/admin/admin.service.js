import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { getPagination } from '../../utils/pagination.js';
import { buildMovieSlug } from '../../utils/tmdbMapper.js';

const userPublicSelect = {
    id: true,
    username: true,
    email: true,
    role: true,
    avatar_url: true,
    bio: true,
    created_at: true,
    isBanned: true
};

const paginate = (query) => {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

const assertValidId = (id, label = 'id') => {
    if (!Number.isInteger(id)) {
        throw new ApiError(400, `Invalid ${label}`);
    }
};

export const listAdminUsers = async (query) => {
    const { page, limit, skip } = paginate(query);
    const normalizedRole = query.role === 'end_user' ? 'user' : query.role;
    const where = {
        ...(query.search
            ? {
                OR: [
                    { username: { contains: query.search, mode: 'insensitive' } },
                    { email: { contains: query.search, mode: 'insensitive' } }
                ]
            }
            : {}),
        ...(normalizedRole ? { role: normalizedRole } : {})
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                ...userPublicSelect,
                _count: { select: { reviews: true, lists: true } }
            },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit
        }),
        prisma.user.count({ where })
    ]);

    return getPagination({ data: users, page, limit, total });
};

export const updateAdminUserRole = async ({ targetUserId, currentUserId, role }) => {
    assertValidId(targetUserId, 'user id');

    const normalizedRole = role === 'end_user' ? 'user' : role;
    const validRoles = ['user', 'moderator', 'super_admin'];

    if (!validRoles.includes(normalizedRole)) {
        throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    if (targetUserId === currentUserId && normalizedRole !== 'super_admin') {
        throw new ApiError(400, 'You cannot downgrade your own role');
    }

    const existingUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true }
    });

    if (!existingUser) {
        throw new ApiError(404, 'User not found');
    }

    return prisma.user.update({
        where: { id: targetUserId },
        data: { role: normalizedRole },
        select: userPublicSelect
    });
};

export const banUser = async ({ targetUserId, currentUserId }) => {
    assertValidId(targetUserId, 'user id');

    if (targetUserId === currentUserId) {
        throw new ApiError(400, 'You cannot ban your own account');
    }

    const existingUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true }
    });

    if (!existingUser) {
        throw new ApiError(404, 'User not found');
    }

    await prisma.user.update({
        where: { id: targetUserId },
        data: { isBanned: true }
    });
};

export const unbanUser = async ({ targetUserId }) => {
    assertValidId(targetUserId, 'user id');

    const existingUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true }
    });

    if (!existingUser) {
        throw new ApiError(404, 'User not found');
    }

    await prisma.user.update({
        where: { id: targetUserId },
        data: { isBanned: false }
    });
};

export const getRecentReviews = async (query) => {
    const { page, limit, skip } = paginate(query);
    const where = { isDeleted: false };

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            include: {
                user: { select: { id: true, username: true, avatar_url: true } },
                movie: { select: { id: true, title: true, posterUrl: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.review.count({ where })
    ]);

    return getPagination({ data: reviews, page, limit, total });
};

export const getFlaggedReviews = () => prisma.review.findMany({
    where: { isFlagged: true, isDeleted: false },
    include: {
        user: { select: { id: true, username: true, avatar_url: true } },
        movie: { select: { id: true, title: true, posterUrl: true } }
    },
    orderBy: { createdAt: 'desc' }
});

export const flagReview = async (reviewId) => {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
        throw new ApiError(404, 'Review not found');
    }

    return prisma.review.update({
        where: { id: reviewId },
        data: { isFlagged: true }
    });
};

export const moderateDeleteReview = async (reviewId) => {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { id: true }
    });

    if (!review) {
        throw new ApiError(404, 'Review not found');
    }

    await prisma.review.update({
        where: { id: reviewId },
        data: { isDeleted: true }
    });
};

export const listNepaliMovies = async (query) => {
    const { page, limit, skip } = paginate(query);
    const where = { source: 'NEPALI' };

    const [movies, total] = await Promise.all([
        prisma.movie.findMany({
            where,
            include: {
                nepaliDetail: true,
                createdBy: { select: { id: true, username: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.movie.count({ where })
    ]);

    return getPagination({
        data: movies.map((movie) => ({
            ...movie,
            nepaliDetail: movie.nepaliDetail?.boxOfficeNpr
                ? { ...movie.nepaliDetail, boxOfficeNpr: movie.nepaliDetail.boxOfficeNpr.toString() }
                : movie.nepaliDetail
        })),
        page,
        limit,
        total
    });
};

export const getAdminStats = async () => {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [
        totalUsers,
        totalMovies,
        tmdbMovies,
        nepaliMovies,
        totalReviews,
        newUsersThisWeek,
        newReviewsThisWeek
    ] = await Promise.all([
        prisma.user.count(),
        prisma.movie.count(),
        prisma.movie.count({ where: { source: 'TMDB' } }),
        prisma.movie.count({ where: { source: 'NEPALI' } }),
        prisma.review.count(),
        prisma.user.count({ where: { created_at: { gte: since } } }),
        prisma.review.count({ where: { createdAt: { gte: since } } })
    ]);

    return {
        totalUsers,
        totalMovies,
        moviesBySource: {
            TMDB: tmdbMovies,
            NEPALI: nepaliMovies
        },
        totalReviews,
        totalNepaliMovies: nepaliMovies,
        newUsersThisWeek,
        newReviewsThisWeek
    };
};

export const createAdminMovie = async ({ data, userId }) => {
    const slug = buildMovieSlug(data.title, data.releaseDate);
    const existing = await prisma.movie.findFirst({
        where: { OR: [{ slug }, { title: data.title }] }
    });
    if (existing) throw new ApiError(409, 'A movie with this title already exists');

    return prisma.movie.create({
        data: {
            source: data.source || 'NEPALI',
            title: data.title,
            slug,
            description: data.description || null,
            releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
            runtime: data.runtime ? parseInt(data.runtime, 10) : null,
            posterUrl: data.posterUrl || null,
            backdropUrl: data.backdropUrl || null,
            language: data.language || 'ne',
            genres: data.genres || [],
            themes: data.themes || [],
            culturalMetadata: data.culturalMetadata || null,
            status: data.status || 'Released',
            createdById: userId
        }
    });
};

export const searchAdminPersons = async (query) => {
    if (!query || query.length < 2) return [];
    return prisma.person.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        orderBy: { name: 'asc' },
        take: 20
    });
};

export const createAdminPerson = async ({ name, profileImage, biography }) => {
    const existing = await prisma.person.findFirst({
        where: { name }
    });
    if (existing) return existing;

    return prisma.person.create({
        data: { name, profileImage: profileImage || null, biography: biography || null }
    });
};

export const addAdminCastMember = async ({ movieId, personId, role, characterName }) => {
    const movie = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
    if (!movie) throw new ApiError(404, 'Movie not found');

    return prisma.movieCast.upsert({
        where: { movieId_personId_role: { movieId, personId, role } },
        update: { characterName: characterName || null },
        create: { movieId, personId, role, characterName: characterName || null },
        include: { person: true }
    });
};

export const removeAdminCastMember = async (movieCastId) => {
    const entry = await prisma.movieCast.findUnique({ where: { id: movieCastId } });
    if (!entry) throw new ApiError(404, 'Cast entry not found');
    await prisma.movieCast.delete({ where: { id: movieCastId } });
};

const parseCsvArray = (val) => {
    if (!val) return [];
    return val.split(',').map((s) => s.trim()).filter(Boolean);
};

const parseCsvDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
};

export const importMoviesFromCsv = async ({ rows, userId }) => {
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const row of rows) {
        const title = row.title?.trim();
        if (!title) {
            skipped++;
            continue;
        }

        try {
            const slug = buildMovieSlug(title, row.release_date);
            const existing = await prisma.movie.findFirst({
                where: { OR: [{ slug }, { title }] }
            });
            if (existing) {
                skipped++;
                continue;
            }

            const movie = await prisma.movie.create({
                data: {
                    source: 'NEPALI',
                    title,
                    slug,
                    description: row.overview || row.description || null,
                    releaseDate: parseCsvDate(row.release_date),
                    posterUrl: row.poster_url || row.posterUrl || null,
                    backdropUrl: row.backdrop_url || row.backdropUrl || null,
                    language: row.language || 'ne',
                    genres: parseCsvArray(row.genres),
                    themes: parseCsvArray(row.themes),
                    culturalMetadata: row.cultural_metadata || row.culturalMetadata ? (() => { try { return JSON.parse(row.cultural_metadata || row.culturalMetadata); } catch { return null; } })() : null,
                    runtime: row.runtime ? parseInt(row.runtime, 10) : null,
                    status: row.status || 'Released',
                    createdById: userId
                }
            });

            const castNames = parseCsvArray(row.cast);
            for (const name of castNames) {
                let person = await prisma.person.findFirst({ where: { name } });
                if (!person) person = await prisma.person.create({ data: { name } });
                await prisma.movieCast.create({
                    data: { movieId: movie.id, personId: person.id, role: 'ACTOR' }
                }).catch(() => {});
            }

            const directorNames = parseCsvArray(row.directors || row.director);
            for (const name of directorNames) {
                let person = await prisma.person.findFirst({ where: { name } });
                if (!person) person = await prisma.person.create({ data: { name } });
                await prisma.movieCast.create({
                    data: { movieId: movie.id, personId: person.id, role: 'DIRECTOR' }
                }).catch(() => {});
            }

            imported++;
        } catch (err) {
            errors.push({ row: title, message: err.message });
        }
    }

    return { imported, skipped, errors };
};
