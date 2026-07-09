import {
    addAdminCastMember,
    banUser,
    createAdminMovie,
    createAdminPerson,
    flagReview,
    getAdminStats,
    getFlaggedReviews,
    getRecentReviews,
    importMoviesFromCsv,
    listAdminUsers,
    listNepaliMovies,
    moderateDeleteReview,
    removeAdminCastMember,
    searchAdminPersons,
    unbanUser,
    updateAdminUserRole
} from './admin.service.js';

const asyncController = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};

export const users = asyncController(async (req, res) => {
    const result = await listAdminUsers(req.query);
    res.status(200).json({ success: true, data: result });
});

export const updateRole = asyncController(async (req, res) => {
    const user = await updateAdminUserRole({
        targetUserId: parseInt(req.params.id),
        currentUserId: req.user.id,
        role: req.body.role
    });
    res.status(200).json({ success: true, data: user });
});

export const ban = asyncController(async (req, res) => {
    await banUser({ targetUserId: parseInt(req.params.id), currentUserId: req.user.id });
    res.status(200).json({ success: true, message: 'User banned' });
});

export const unban = asyncController(async (req, res) => {
    await unbanUser({ targetUserId: parseInt(req.params.id) });
    res.status(200).json({ success: true, message: 'User unbanned' });
});

export const recentReviews = asyncController(async (req, res) => {
    const result = await getRecentReviews(req.query);
    res.status(200).json({ success: true, data: result });
});

export const flaggedReviews = asyncController(async (req, res) => {
    const reviews = await getFlaggedReviews();
    res.status(200).json({ success: true, data: reviews });
});

export const flag = asyncController(async (req, res) => {
    const review = await flagReview(req.params.id);
    res.status(200).json({ success: true, data: review });
});

export const deleteReview = asyncController(async (req, res) => {
    await moderateDeleteReview(req.params.id);
    res.status(200).json({ success: true });
});

export const nepaliMovies = asyncController(async (req, res) => {
    const result = await listNepaliMovies(req.query);
    res.status(200).json({ success: true, data: result });
});

export const stats = asyncController(async (req, res) => {
    const result = await getAdminStats();
    res.status(200).json({ success: true, data: result });
});

export const createMovie = asyncController(async (req, res) => {
    const movie = await createAdminMovie({ data: req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: movie });
});

export const searchPersons = asyncController(async (req, res) => {
    const persons = await searchAdminPersons(req.query.q);
    res.status(200).json({ success: true, data: persons });
});

export const createPerson = asyncController(async (req, res) => {
    const person = await createAdminPerson(req.body);
    res.status(201).json({ success: true, data: person });
});

export const addCast = asyncController(async (req, res) => {
    const entry = await addAdminCastMember(req.body);
    res.status(201).json({ success: true, data: entry });
});

export const removeCast = asyncController(async (req, res) => {
    await removeAdminCastMember(req.params.id);
    res.status(200).json({ success: true });
});

export const importCsv = asyncController(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'CSV file is required' });
    }
    const csvContent = req.file.buffer.toString('utf-8');
    const rows = [];
    const { Readable } = await import('stream');
    const csvParser = (await import('csv-parser')).default;

    await new Promise((resolve, reject) => {
        const stream = Readable.from([csvContent]);
        stream.pipe(csvParser())
            .on('data', (row) => rows.push(row))
            .on('end', resolve)
            .on('error', reject);
    });

    const result = await importMoviesFromCsv({ rows, userId: req.user.id });
    res.status(200).json({ success: true, data: result });
});
