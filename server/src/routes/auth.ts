import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, university, skills, intent } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Name, email and password are required' });
  }

  // Check existing
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ success: false, error: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const parsedSkills = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify([]);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      university: university || 'Macquarie University',
      skills: parsedSkills,
      intent
    }
  });

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  
  res.status(201).json({ 
    success: true, 
    data: { 
      token, 
      user: { id: user.id, name: user.name, email: user.email } 
    } 
  });
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(400).json({ success: false, error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  
  res.json({ 
    success: true, 
    data: { 
      token, 
      user: { id: user.id, name: user.name, email: user.email } 
    } 
  });
}));

export default router;
