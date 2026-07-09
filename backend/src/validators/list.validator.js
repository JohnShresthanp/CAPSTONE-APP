import { z } from 'zod';

export const createListSchema = z.object({
    name: z.string().min(1, 'List name is required').max(100),
    description: z.string().max(1000).optional().or(z.literal('')),
    isPrivate: z.boolean().optional().default(false)
});

export const updateListSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional().or(z.literal('')),
    isPrivate: z.boolean().optional()
});

export const addMovieToListSchema = z.object({
    movieId: z.string().uuid('Invalid movie ID')
});
