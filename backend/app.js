import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.routes.js';
import movieRoutes from './src/modules/movies/movie.routes.js';
import reviewRoutes from './src/modules/reviews/review.routes.js';
import listRoutes from './src/modules/lists/list.routes.js';
import userRoutes from './src/modules/users/user.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';
import mediaRoutes from './src/modules/media/media.routes.js';
import passport from './src/config/passport.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import './src/jobs/tmdbSync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);
app.use(helmet());

// Early CORS handler to echo the incoming Origin in development and handle preflight
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (process.env.NODE_ENV !== 'production') {
        // In development, always echo the origin or use wildcard
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
    }

    next();
});
const corsOptions = process.env.NODE_ENV === 'production'
    ? {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allowed = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim());
            return callback(null, allowed.includes(origin));
        },
        credentials: true
    }
    : { origin: true, credentials: true };

// Use custom CORS handling above; skip the `cors` package handler to avoid
// conflicting header behavior during development.
// app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'change-this-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Auth API is running' });
});

app.use(errorHandler);

export default app;
