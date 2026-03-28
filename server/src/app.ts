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

// Database Connection check
const checkDbConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ [DATABASE] Connected to Supabase PostgreSQL database.');
  } catch (err: any) {
    console.error('🛑 [DATABASE ERROR] Connection failed:', err.message);
    // Don't exit immediately on retryable connection issues
  }
};
checkDbConnection();

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

// Task 5: Enhanced Health Check
app.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    res.json({ 
      status: 'ok', 
      database: 'connected', 
      latency: `${latency}ms`,
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    console.error('🚨 Health Check Failed:', err);
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected', 
      timestamp: new Date().toISOString() 
    });
  }
});

// Task 1: 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found or invalid API call' });
});

// Task 1: Global Error Handler
app.use(errorHandler);

export default app;
