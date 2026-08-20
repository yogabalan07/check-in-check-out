import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

const envPath = path.join(__dirname, '../../.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const defaultFrontendUrl = 'http://localhost:5173';
const productionFrontendUrl = 'https://check-in-check-out-nhav.onrender.com';

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function buildCorsOrigins(): string[] {
  const origins = new Set<string>();

  if (process.env.FRONTEND_URL) {
    origins.add(normalizeOrigin(process.env.FRONTEND_URL));
  }

  // Local development origins
  origins.add('http://localhost:5173');
  origins.add('http://127.0.0.1:5173');

  // Explicitly allow the deployed production frontend, even if the
  // environment variables are not configured on the hosting service.
  origins.add(productionFrontendUrl);

  if (process.env.CORS_ORIGINS) {
    for (const origin of process.env.CORS_ORIGINS.split(',')) {
      const trimmed = normalizeOrigin(origin);
      if (trimmed) origins.add(trimmed);
    }
  }

  return Array.from(origins);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  frontendUrl: process.env.FRONTEND_URL || defaultFrontendUrl,
  corsOrigins: buildCorsOrigins(),
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  hackathonStartTime: process.env.HACKATHON_START_TIME || '09:00',
  hackathonEndTime: process.env.HACKATHON_END_TIME || '17:00',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};