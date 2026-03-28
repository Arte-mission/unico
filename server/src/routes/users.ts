import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// Helper to calculate weekly activity
const getWeeklyActivity = (progressLogs: any[]) => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return (progressLogs || []).filter(log => new Date(log.createdAt) > lastWeek).length;
};

// GET /api/users/me - Get my profile
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Record last active (fire and forget)
  prisma.user.update({
    where: { id: userId },
    data: { lastActive: new Date() }
  }).catch(err => console.error('Failed to update lastActive:', err));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projectsOwned: { select: { id: true, title: true, createdAt: true } },
      memberships: { include: { project: { select: { id: true, title: true } } } },
      progressLogs: { 
        orderBy: { createdAt: 'desc' }, 
        take: 10,
        include: { project: { select: { id: true, title: true } } } 
      }
    }
  });
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User account no longer exists' });
  }

  const weeklyActivity = getWeeklyActivity(user.progressLogs);
  const skillsArray = typeof user.skills === 'string' ? JSON.parse(user.skills) : (user.skills || []);

  const { password, ...safeUser } = user;
  res.json({ 
    success: true, 
    data: { ...safeUser, skills: skillsArray, weeklyActivity } 
  });
}));

// PUT /api/users/profile - Update profile
router.put('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, bio, phone, university, skills, intent } = req.body;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const updateData: any = { lastActive: new Date() };
  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (phone) updateData.phone = phone;
  if (university) updateData.university = university;
  if (skills && Array.isArray(skills)) updateData.skills = JSON.stringify(skills);
  if (intent) updateData.intent = intent;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  const skillsArray = typeof user.skills === 'string' ? JSON.parse(user.skills) : (user.skills || []);
  const { password, ...safeUser } = user;
  
  res.json({ 
    success: true, 
    data: { ...safeUser, skills: skillsArray } 
  });
}));

// GET /api/users/:id - Get user by id
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: String(req.params.id) },
    include: {
      projectsOwned: { select: { id: true, title: true } },
      memberships: { include: { project: { select: { id: true, title: true } } } },
      progressLogs: { 
        orderBy: { createdAt: 'desc' }, 
        take: 5,
        include: { project: { select: { id: true, title: true } } } 
      }
    }
  });

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const weeklyActivity = getWeeklyActivity(user.progressLogs);
  const skillsArray = typeof user.skills === 'string' ? JSON.parse(user.skills) : (user.skills || []);

  const { password, ...safeUser } = user;
  res.json({ 
    success: true, 
    data: { ...safeUser, skills: skillsArray, weeklyActivity } 
  });
}));

export default router;
