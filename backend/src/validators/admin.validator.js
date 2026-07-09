import { z } from 'zod';

export const updateRoleSchema = z.object({
    role: z.enum(['user', 'moderator', 'super_admin'])
});

export const banUserSchema = z.object({
    reason: z.string().max(500).optional()
});
