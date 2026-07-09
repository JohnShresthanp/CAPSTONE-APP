import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

const createStorage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(uploadsDir, folder));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${folder}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only jpg, jpeg, png, and webp files are allowed'), false);
    }
};

export const posterUpload = multer({
    storage: createStorage('posters'),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const avatarUpload = multer({
    storage: createStorage('avatars'),
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});
