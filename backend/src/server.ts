import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: '*' }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(errorHandler);

// Start
async function bootstrap(): Promise<void> {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`[server] QuickAPI backend running on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

