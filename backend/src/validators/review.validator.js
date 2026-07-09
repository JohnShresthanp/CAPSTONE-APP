import { z } from 'zod';

export const createReviewSchema = z.object({
    movieId: z.string().uuid('Invalid movie ID'),
    rating: z.number().min(0.5).max(5).multipleOf(0.5),
    body: z.string().max(5000).optional().or(z.literal('')),
    containsSpoiler: z.boolean().optional().default(false)
});

export const updateReviewSchema = z.object({
    rating: z.number().min(0.5).max(5).multipleOf(0.5).optional(),
    body: z.string().max(5000).optional().or(z.literal('')),
    containsSpoiler: z.boolean().optional()
});

export const createCommentSchema = z.object({
    body: z.string().min(1, 'Comment cannot be empty').max(1000),
    parentCommentId: z.string().uuid().optional()
});
