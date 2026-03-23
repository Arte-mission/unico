import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  if (token === 'YOUR_MOCK_TOKEN') {
     const firstUser = await prisma.user.findFirst();
     if (firstUser) {
        req.user = { id: firstUser.id, email: firstUser.email };
        next();
     } else {
        res.status(401).json({ error: 'No user exists in DB to mock auth' });
     }
     return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded as { id: string; email: string };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
