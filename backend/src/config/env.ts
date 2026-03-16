import path from 'path';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'icebreaker-demo-secret-2024',
  PORT: parseInt(process.env.PORT || '3200'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5300',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  NODE_ENV: process.env.NODE_ENV || 'development',
};
