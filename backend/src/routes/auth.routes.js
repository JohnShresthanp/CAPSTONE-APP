import express from 'express';
import { 
    registerUser, 
    registerSuperAdmin,
    loginUser,
    forgotPassword,
    resetPassword,
    verifyEmail,
    handleOAuthCallback
} from '../controllers/auth.controller.js';
import passport from '../config/passport.js';

import {
    getAllUsers,
    updateUserRole,
    deleteUser,
    getUsersByRole,
    getRoleAuditLog,
    getRoleStatistics
} from '../controllers/admin.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { 
    isSuperAdmin, 
    isModeratorOrHigher
} from '../middlewares/role.middleware.js';
import { authRateLimiter, passwordResetRateLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

const requireOAuthConfig = (provider) => (req, res, next) => {
    const providerKey = provider.toUpperCase();

    if (!process.env[`${providerKey}_CLIENT_ID`] || !process.env[`${providerKey}_CLIENT_SECRET`]) {
        return res.status(503).json({
            message: `${provider} OAuth is not configured`
        });
    }

    next();
};

// ========== PUBLIC ROUTES ==========
router.post('/register', authRateLimiter, registerUser);
router.post('/login', authRateLimiter, loginUser);
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.post('/reset-password', passwordResetRateLimiter, resetPassword);
router.post('/verify-email', authRateLimiter, verifyEmail);
router.get('/verify-email', authRateLimiter, verifyEmail);

// ========== OAUTH ROUTES ==========
router.get('/google', authRateLimiter, requireOAuthConfig('google'), passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    authRateLimiter,
    requireOAuthConfig('google'),
    passport.authenticate('google', { session: false, failureRedirect: '/api/auth/oauth/failure' }),
    handleOAuthCallback
);
router.get('/oauth-urls', (req, res) => {
    res.json({
        google: `${process.env.API_URL || 'http://localhost:3000'}/api/auth/google`,
        github: `${process.env.API_URL || 'http://localhost:3000'}/api/auth/github`
    });
});


router.get('/github', authRateLimiter, requireOAuthConfig('github'), passport.authenticate('github', { scope: ['user:email'] }));
router.get(
    '/github/callback',
    authRateLimiter,
    requireOAuthConfig('github'),
    passport.authenticate('github', { session: false, failureRedirect: '/api/auth/oauth/failure' }),
    handleOAuthCallback
);

router.get('/oauth/failure', (req, res) => {
    res.status(401).json({ message: 'OAuth authentication failed' });
});

// ========== SUPER ADMIN ONLY ROUTES ==========
// Create new super admin (requires existing super admin)
router.post('/register/super-admin', authenticate, isSuperAdmin, registerSuperAdmin);

// Role management
router.put('/users/:id/role', authenticate, isSuperAdmin, updateUserRole);
router.get('/audit-log', authenticate, isSuperAdmin, getRoleAuditLog);
router.get('/statistics/roles', authenticate, isSuperAdmin, getRoleStatistics);

// Delete any user (except self)
router.delete('/users/:id', authenticate, isSuperAdmin, deleteUser);

// ========== MODERATOR + SUPER ADMIN ROUTES ==========
// View users (moderators see limited, super admins see all)
router.get('/users', authenticate, isModeratorOrHigher, getAllUsers);
router.get('/users/role/:role', authenticate, isModeratorOrHigher, getUsersByRole);

// ========== PERMISSION-BASED ROUTES ==========
// Any authenticated user can access their own profile
router.get('/profile/me', authenticate, async (req, res) => {
    res.json({ user: req.user });
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
    const { verifyRefreshToken, generateToken, generateRefreshToken } = await import('../utils/jwt.js');
    const { prisma } = await import('../lib/prisma.js');
    
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
        
        const decoded = verifyRefreshToken(refreshToken);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, username: true, email: true, role: true, avatar_url: true, isBanned: true, token_version: true }
        });
        
        if (!user || user.isBanned) return res.status(401).json({ message: 'Invalid refresh token' });
        if (user.token_version !== decoded.tokenVersion) return res.status(401).json({ message: 'Token revoked' });
        
        // Token rotation: increment version so old token can't be reused
        await prisma.user.update({
            where: { id: user.id },
            data: { token_version: { increment: 1 } }
        });
        
        const updatedUser = { ...user, token_version: user.token_version + 1 };
        const newAccessToken = generateToken(updatedUser);
        const newRefreshToken = generateRefreshToken(updatedUser);
        
        res.json({ token: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
});

// Logout endpoint - increments token_version to invalidate refresh tokens
router.post('/logout', authenticate, async (req, res) => {
    const { prisma } = await import('../lib/prisma.js');
    await prisma.user.update({
        where: { id: req.user.id },
        data: { token_version: { increment: 1 } }
    });
    res.json({ message: 'Logged out successfully' });
});

export default router;
