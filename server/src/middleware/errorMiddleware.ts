import { Request, Response, NextFunction } from 'express';

// Log all requests
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

// Global error handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`🛑 [SYSTEM ERROR] ${req.method} ${req.url}:`, err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
};

// Async route wrapper
export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Ensure error logging is consistent
    console.error(`🔥 [ASYNC ERROR] ${req.method} ${req.url}`, err);
    next(err);
  });
};
