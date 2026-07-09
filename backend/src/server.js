import app from '../app.js';
import { prisma } from './config/db.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running on http://0.0.0.0:${PORT}`);

  prisma.$connect()
    .then(() => logger.info('Connected to PostgreSQL Database'))
    .catch(err => logger.error('Database connection failed:', err));
});
