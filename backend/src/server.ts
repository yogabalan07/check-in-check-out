import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimit';
import prisma from './config/prisma';
import authRoutes from './routes/authRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import participantRoutes from './routes/participantRoutes';
import hallRoutes from './routes/hallRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import qrRoutes from './routes/qrRoutes';
import settingsRoutes from './routes/settingsRoutes';

const app = express();

// Render sits behind a proxy; trust it so rate limiting and req.ip work.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Safety net: any OPTIONS preflight that reaches Express is answered with 204
// (CORS headers are attached by the cors middleware above).
app.options('*', (_req, res) => {
  res.sendStatus(204);
});

// Rate limiting (high global safety cap; stricter limits applied per route)
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/halls', hallRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'Hackathon Attendance API',
    health: '/api/health',
  });
});

app.get('/api/health', async (_req, res) => {
  let database: { status: string; code?: string } = { status: 'ok' };
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error: any) {
    database = { status: 'error', code: error?.code || 'UNKNOWN' };
  }
  res.json({
    success: true,
    message: 'Server is running',
    uptime: process.uptime(),
    database,
  });
});

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export default app;
