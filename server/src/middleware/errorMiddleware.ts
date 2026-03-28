import { Request, Response, NextFunction } from 'express';

// Enhanced Request Logger
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
};

// Global Error Handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log full error for internal debugging
  console.error(`🛑 [SYSTEM ERROR] ${req.method} ${req.url}:`, {
    message: err.message,
    stack: err.stack,
    details: err.details || null
  });
  
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred on the server';

  // Ensure consistent response format
  res.status(status).json({
    success: false,
    error: message
  });
};

// Robust Async Wrapper
export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(`🔥 [ASYNC ERROR HANDLED] ${req.method} ${req.url}:`, err.message);
    next(err);
  });
};
