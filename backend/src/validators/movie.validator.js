import { z } from 'zod';

export const createMovieSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    releaseDate: z.string().optional(),
    runtime: z.number().int().positive().optional(),
    posterUrl: z.string().url().optional().or(z.literal('')),
    backdropUrl: z.string().url().optional().or(z.literal('')),
    language: z.string().optional(),
    genres: z.array(z.string()).optional(),
    status: z.string().optional(),
    tmdbRating: z.number().min(0).max(10).optional(),
    tmdbVoteCount: z.number().int().positive().optional()
});

export const createNepaliMovieSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    releaseDate: z.string().optional(),
    runtime: z.number().int().positive().optional(),
    language: z.string().default('ne'),
    genres: z.array(z.string()).optional(),
    productionHouse: z.string().optional(),
    distributor: z.string().optional(),
    boxOfficeNpr: z.number().positive().optional(),
    extraNotes: z.string().optional()
});

export const updateNepaliMovieSchema = createNepaliMovieSchema.partial();

export const addCastSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['DIRECTOR', 'ACTOR', 'WRITER']),
    characterName: z.string().optional(),
    orderIndex: z.number().int().positive().optional(),
    profileImage: z.string().url().optional().or(z.literal('')),
    biography: z.string().optional()
});

export const movieSearchSchema = z.object({
    q: z.string().min(1).optional(),
    genre: z.string().optional(),
    language: z.string().optional(),
    source: z.enum(['TMDB', 'NEPALI']).optional()
});

export const validate = (schema) => (data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }));
        throw { statusCode: 400, message: 'Validation error', errors };
    }
    return result.data;
};
