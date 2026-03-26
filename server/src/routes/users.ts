import { Router, Request, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// Helper to calculate weekly activity
const getWeeklyActivity = (progressLogs: any[]) => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return progressLogs.filter(log => new Date(log.createdAt) > lastWeek).length;
};

// Get my profile
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Record last active
  await (prisma.user as any).update({
    where: { id: req.user.id },
    data: { lastActive: new Date() }
  });

  const user = await (prisma.user as any).findUnique({
    where: { id: req.user.id },
    include: {
      projectsOwned: true,
      memberships: { include: { project: true } },
      progressLogs: { 
        orderBy: { createdAt: 'desc' }, 
        include: { project: { select: { id: true, title: true } } } 
      }
    }
  });
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const weeklyActivity = getWeeklyActivity(user.progressLogs || []);
  const skillsArray = typeof user.skills === 'string' ? JSON.parse(user.skills) : (user.skills || []);

  const { password, skills, ...safeUser } = user;
  res.json({ 
    success: true, 
    data: { ...safeUser, skills: skillsArray, weeklyActivity } 
  });
}));

// Update profile
router.put('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, bio, phone, university, skills, intent } = req.body;
  
  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const updateData: any = { lastActive: new Date() };
  if (name) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (phone) updateData.phone = phone;
  if (university) updateData.university = university;
  if (skills && Array.isArray(skills)) updateData.skills = JSON.stringify(skills);
  if (intent) updateData.intent = intent;

  const user = await (prisma.user as any).update({
    where: { id: req.user.id },
    data: updateData
  });

  const skillsArray = typeof user.skills === 'string' ? JSON.parse(user.skills) : (user.skills || []);
  const { password, skills: dbSkills, ...safeUser } = user;
  
  res.json({ 
    success: true, 
    data: { ...safeUser, skills: skillsArray } 
  });
}));

// Get user by id
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: String(req.params.id) },
    include: {
      projectsOwned: true,
      memberships: { include: { project: true } },
      progressLogs: { 
        orderBy: { createdAt: 'desc' }, 
        include: { project: { select: { id: true, title: true } } } 
      }
    }
  });

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const weeklyActivity = getWeeklyActivity(user.progressLogs || []);
  const skillsArray = typeof user.skills === 'string' ? JSON.parse(user.skills) : (user.skills || []);

  const { password, skills, ...safeUser } = user;
  res.json({ 
    success: true, 
    data: { ...safeUser, skills: skillsArray, weeklyActivity } 
  });
}));

export default router;
