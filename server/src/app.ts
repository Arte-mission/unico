import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';

// Routes imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import logRoutes from './routes/logs';
import searchRoutes from './routes/search';
import { errorHandler, requestLogger } from './middleware/errorMiddleware';

dotenv.config();

const app = express();

// Database Connection with Retry
async function connectWithRetry(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Connected to Supabase PostgreSQL database.');
      return;
    } catch (err) {
      console.error(`❌ DB Connection failed (Attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
      if (i === retries - 1) {
        console.error('🛑 Max retries reached. Database is unreachable.');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

connectWithRetry();

export { prisma }; // Re-export for any modules still importing from app

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(express.json());
app.use(requestLogger);

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/search', searchRoutes);

// Enhanced Health Check
app.get('/health', async (req, res) => {
  try {
    // Basic DB check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      success: true, 
      status: 'ok', 
      database: 'connected', 
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(503).json({ 
      success: false, 
      status: 'error', 
      database: 'disconnected', 
      timestamp: new Date().toISOString() 
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found or invalid API call' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
