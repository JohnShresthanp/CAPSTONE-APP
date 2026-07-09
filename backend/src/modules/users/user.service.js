import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { getPagination } from '../../utils/pagination.js';
import { logActivity } from '../../utils/activityLogger.js';

const publicUserSelect = {
    id: true,
    username: true,
    avatar_url: true,
    bio: true,
    created_at: true
};

const paginate = (query) => {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 50);

    return { page, limit, skip: (page - 1) * limit };
};

const findUserByUsername = async (username) => {
    const user = await prisma.user.findUnique({
        where: { username },
        select: publicUserSelect
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return user;
};

export const getPublicProfile = async (username, currentUserId) => {
    const user = await findUserByUsername(username);
    const [followersCount, followingCount, reviewsCount, watchedList, likedList, favorites, isFollowing] = await Promise.all([
        prisma.follow.count({ where: { followingId: user.id } }),
        prisma.follow.count({ where: { followerId: user.id } }),
        prisma.review.count({ where: { userId: user.id, isDeleted: false } }),
        prisma.list.findFirst({
            where: { userId: user.id, systemType: 'watched' },
            include: {
                movies: {
                    orderBy: { addedAt: 'desc' },
                    take: 4,
                    include: { movie: true }
                },
                _count: { select: { movies: true } }
            }
        }),
        prisma.list.findFirst({
            where: { userId: user.id, systemType: 'liked' },
            include: {
                movies: {
                    orderBy: { addedAt: 'desc' },
                    take: 4,
                    include: { movie: true }
                }
            }
        }),
        prisma.favorite.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        }),
        currentUserId ? prisma.follow.findFirst({
            where: { followerId: currentUserId, followingId: user.id }
        }).then(Boolean) : false
    ]);

    const cleanFavorites = favorites.map((f) => ({
        ...f,
        externalId: f.externalId.replace(/^\//, '')
    }));

    const groupedFavorites = {
        movie: cleanFavorites.filter((f) => f.mediaType === 'movie'),
        book: cleanFavorites.filter((f) => f.mediaType === 'book'),
        album: cleanFavorites.filter((f) => f.mediaType === 'album'),
        artist: cleanFavorites.filter((f) => f.mediaType === 'artist'),
        person: cleanFavorites.filter((f) => f.mediaType === 'person'),
        music: cleanFavorites.filter((f) => f.mediaType === 'album' || f.mediaType === 'artist')
    };

    return {
        ...user,
        isFollowing,
        counts: {
            followers: followersCount,
            following: followingCount,
            reviews: reviewsCount,
            watchedMovies: watchedList?._count.movies || 0
        },
        recentlyWatched: watchedList?.movies.map((item) => item.movie) || [],
        likedMovies: likedList?.movies.map((item) => item.movie) || [],
        favorites: groupedFavorites
    };
};

export const getUserReviews = async ({ username, query }) => {
    const user = await findUserByUsername(username);
    const { page, limit, skip } = paginate(query);
    const where = { userId: user.id, isDeleted: false };

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            include: {
                movie: { select: { id: true, title: true, posterUrl: true } },
                _count: { select: { likes: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.review.count({ where })
    ]);

    return getPagination({ data: reviews, page, limit, total });
};

export const getProfileLists = async ({ username, requesterId }) => {
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
        include: { _count: { select: { movies: true } } },
        orderBy: { createdAt: 'desc' }
    });
};

export const toggleFollow = async ({ username, requesterId }) => {
    const targetUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true }
    });

    if (!targetUser) {
        throw new ApiError(404, 'User not found');
    }

    if (targetUser.id === requesterId) {
        throw new ApiError(400, 'Cannot follow yourself');
    }

    const existing = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId: requesterId,
                followingId: targetUser.id
            }
        }
    });

    if (existing) {
        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: requesterId,
                    followingId: targetUser.id
                }
            }
        });

        const followerCount = await prisma.follow.count({ where: { followingId: targetUser.id } });
        return { following: false, followerCount };
    }

    await prisma.follow.create({
        data: {
            followerId: requesterId,
            followingId: targetUser.id
        }
    });
    await logActivity({
        actorId: requesterId,
        type: 'FOLLOWED_USER',
        targetType: 'user',
        targetId: String(targetUser.id),
        metadata: { username: targetUser.username }
    });

    const followerCount = await prisma.follow.count({ where: { followingId: targetUser.id } });
    return { following: true, followerCount };
};

export const getFollowers = async ({ username, query }) => {
    const user = await findUserByUsername(username);
    const { page, limit, skip } = paginate(query);
    const where = { followingId: user.id };

    const [followers, total] = await Promise.all([
        prisma.follow.findMany({
            where,
            include: { follower: { select: publicUserSelect } },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.follow.count({ where })
    ]);

    return getPagination({ data: followers.map((item) => item.follower), page, limit, total });
};

export const getFollowing = async ({ username, query }) => {
    const user = await findUserByUsername(username);
    const { page, limit, skip } = paginate(query);
    const where = { followerId: user.id };

    const [following, total] = await Promise.all([
        prisma.follow.findMany({
            where,
            include: { following: { select: publicUserSelect } },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.follow.count({ where })
    ]);

    return getPagination({ data: following.map((item) => item.following), page, limit, total });
};

export const updateMyProfile = async ({ userId, body, file }) => {
    if (body.username) {
        const existing = await prisma.user.findUnique({
            where: { username: body.username },
            select: { id: true }
        });

        if (existing && existing.id !== userId) {
            throw new ApiError(409, 'Username is already taken');
        }
    }

    return prisma.user.update({
        where: { id: userId },
        data: {
            ...(body.bio !== undefined ? { bio: body.bio || null } : {}),
            ...(body.username ? { username: body.username } : {}),
            ...(file?.filename ? { avatar_url: `/uploads/avatars/${file.filename}` } : {})
        },
        select: publicUserSelect
    });
};

export const getUserStats = async (username) => {
    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const watchedList = await prisma.list.findFirst({
        where: { userId: user.id, systemType: 'watched' },
        select: { id: true }
    });

    const watchedMovieIds = watchedList
        ? (await prisma.listMovie.findMany({
            where: { listId: watchedList.id },
            select: { movieId: true }
        })).map((item) => item.movieId)
        : [];

    const watchCount = watchedMovieIds.length;

    const reviews = await prisma.review.findMany({
        where: { userId: user.id, isDeleted: false },
        select: { rating: true, createdAt: true }
    });

    const totalRatings = reviews.length;
    const averageRating = totalRatings > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    const ratingDistribution = {};
    for (const r of reviews) {
        const key = String(r.rating);
        ratingDistribution[key] = (ratingDistribution[key] || 0) + 1;
    }

    let favoriteGenres = [];
    let favoriteActors = [];
    let favoriteDirectors = [];

    if (watchedMovieIds.length > 0) {
        const movies = await prisma.movie.findMany({
            where: { id: { in: watchedMovieIds } },
            select: { genres: true }
        });

        const genreCounts = {};
        for (const movie of movies) {
            for (const genre of movie.genres) {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            }
        }
        favoriteGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([genre, count]) => ({ genre, count }));

        const castCounts = await prisma.movieCast.groupBy({
            by: ['personId', 'role'],
            where: { movieId: { in: watchedMovieIds } },
            _count: { personId: true }
        });

        const actorCounts = {};
        const directorCounts = {};
        for (const entry of castCounts) {
            if (entry.role === 'ACTOR') {
                actorCounts[entry.personId] = entry._count.personId;
            } else if (entry.role === 'DIRECTOR') {
                directorCounts[entry.personId] = entry._count.personId;
            }
        }

        const topActorIds = Object.entries(actorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => id);

        const topDirectorIds = Object.entries(directorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => id);

        if (topActorIds.length > 0) {
            const actors = await prisma.person.findMany({
                where: { id: { in: topActorIds } },
                select: { id: true, name: true, profileImage: true }
            });
            const actorMap = new Map(actors.map((a) => [a.id, a]));
            favoriteActors = topActorIds.map((id) => ({
                ...actorMap.get(id),
                count: actorCounts[id]
            }));
        }

        if (topDirectorIds.length > 0) {
            const directors = await prisma.person.findMany({
                where: { id: { in: topDirectorIds } },
                select: { id: true, name: true, profileImage: true }
            });
            const directorMap = new Map(directors.map((d) => [d.id, d]));
            favoriteDirectors = topDirectorIds.map((id) => ({
                ...directorMap.get(id),
                count: directorCounts[id]
            }));
        }
    }

    const dayCounts = {};
    for (const r of reviews) {
        const day = new Date(r.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
        dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
    const mostActiveDay = Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 1)
        .map(([day, count]) => ({ day, count }))[0] || null;

    const recentActivity = await prisma.activityFeed.findMany({
        where: { actorId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    return {
        totalMoviesWatched: watchCount,
        totalReviews: totalRatings,
        averageRating: Math.round(averageRating * 100) / 100,
        ratingDistribution,
        favoriteGenres,
        favoriteActors,
        favoriteDirectors,
        mostActiveDay,
        recentActivity
    };
};

export const diary = async (username) => {
    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const watchedList = await prisma.list.findFirst({
        where: { userId: user.id, systemType: 'watched' },
        select: { id: true }
    });

    if (!watchedList) {
        return [];
    }

    const diaryEntries = await prisma.listMovie.findMany({
        where: { listId: watchedList.id },
        include: { movie: true },
        orderBy: { addedAt: 'desc' }
    });

    return diaryEntries.map((entry) => ({
        id: entry.id,
        movie: entry.movie,
        watchedAt: entry.addedAt,
        notes: entry.notes
    }));
};

export const updateGenrePreferences = async ({ userId, genres }) => {
    if (!Array.isArray(genres)) {
        throw new ApiError(400, 'Genres must be an array');
    }

    return prisma.user.update({
        where: { id: userId },
        data: { genrePreferences: genres.map(String) },
        select: { id: true, username: true, genrePreferences: true }
    });
};

export const getActivityFeed = async ({ userId, query }) => {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = 20;
    const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
    });
    const actorIds = [userId, ...follows.map((item) => item.followingId)];
    const [activities, total] = await Promise.all([
        prisma.activityFeed.findMany({
            where: { actorId: { in: actorIds } },
            include: { actor: { select: publicUserSelect } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        }),
        prisma.activityFeed.count({ where: { actorId: { in: actorIds } } })
    ]);

    return getPagination({ data: activities, page, limit, total });
};
