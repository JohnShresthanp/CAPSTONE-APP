import jwt from 'jsonwebtoken';

const getRoleLevel = (role) => {
    const levels = { 'user': 1, 'moderator': 2, 'super_admin': 3 };
    return levels[role] || 1;
};

export const generateToken = (user) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role || 'user', username: user.username, roleLevel: getRoleLevel(user.role), type: 'access' },
        secret,
        { expiresIn: '15m' }
    );
};

export const generateRefreshToken = (user) => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role || 'user', type: 'refresh', tokenVersion: user.token_version || 0 },
        secret,
        { expiresIn: '7d' }
    );
};

export const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');
    try { return jwt.verify(token, secret); } catch (error) { throw error; }
};

export const verifyRefreshToken = (token) => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
    try { return jwt.verify(token, secret); } catch (error) { throw error; }
};

export const decodeToken = (token) => {
    try { return jwt.decode(token); } catch (error) { return null; }
};
