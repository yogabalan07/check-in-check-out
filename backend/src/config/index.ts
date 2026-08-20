import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

const envPath = path.join(__dirname, '../../.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const defaultFrontendUrl = 'http://localhost:5173';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  frontendUrl: process.env.FRONTEND_URL || defaultFrontendUrl,
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [process.env.FRONTEND_URL || defaultFrontendUrl],
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  hackathonStartTime: process.env.HACKATHON_START_TIME || '09:00',
  hackathonEndTime: process.env.HACKATHON_END_TIME || '17:00',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};