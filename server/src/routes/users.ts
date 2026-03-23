import { Router } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Get my profile
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        projectsOwned: true,
        memberships: { include: { project: true } },
        progressLogs: { orderBy: { createdAt: 'desc' }, include: { project: { select: { id: true, title: true } } } }
      }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Format skills back to array if needed
    const { password, skills, ...safeUser } = user;
    res.json({ ...safeUser, skills: JSON.parse(skills) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, phone, university, skills, intent } = req.body;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (university) updateData.university = university;
    if (skills && Array.isArray(skills)) updateData.skills = JSON.stringify(skills);
    if (intent) updateData.intent = intent;

    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: updateData
    });

    const { password, skills: dbSkills, ...safeUser } = user;
    res.json({ ...safeUser, skills: JSON.parse(dbSkills) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(req.params.id) },
      include: {
        projectsOwned: true,
        memberships: { include: { project: true } },
        progressLogs: { orderBy: { createdAt: 'desc' }, include: { project: { select: { id: true, title: true } } } }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password, skills, ...safeUser } = user;
    res.json({ ...safeUser, skills: JSON.parse(skills) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
