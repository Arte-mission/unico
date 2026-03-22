import { Router } from 'express';
import { prisma, io } from '../index';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Get Feed (All projects)
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        owner: { select: { id: true, name: true, university: true } },
        members: { include: { user: { select: { name: true } } } },
        progressLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        followers: true,
        _count: { select: { progressLogs: true } }
      },
      orderBy: { lastUpdated: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Project
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description } = req.body;
    
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const project = await prisma.project.create({
      data: {
        title,
        description,
        createdBy: req.user.id
      }
    });

    // Auto join as founder
    await prisma.projectMember.create({
      data: {
        userId: req.user.id,
        projectId: project.id,
        role: 'Founder',
        commitmentLevel: 'Full-time'
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Project By ID
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: String(req.params.id) },
      include: {
        owner: { select: { id: true, name: true, university: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
        progressLogs: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
        followers: true,
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join Project
router.post('/:id/join', authenticate, async (req: AuthRequest, res) => {
  try {
    const { role, commitmentLevel } = req.body;
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    // Ensure not already joined
    const existing = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: String(req.params.id)
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already joined this project' });
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: req.user.id,
        projectId: String(req.params.id),
        role: role || 'Contributor',
        commitmentLevel: commitmentLevel || 'Flexible'
      },
      include: { user: { select: { id: true, name: true } } }
    });

    io.to(`project_${req.params.id}`).emit('member_joined', member);
    
    // Also emit globally so the feed can update follower/member counts
    const updatedProject = await prisma.project.findUnique({
      where: { id: String(req.params.id) },
      include: { members: true }
    });
    io.emit('project_updated', updatedProject);

    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow Project
router.post('/:id/follow', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.follower.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: String(req.params.id)
        }
      }
    });

    if (existing) {
      // Unfollow
      await prisma.follower.delete({ where: { id: existing.id } });
      return res.json({ following: false });
    }

    // Follow
    await prisma.follower.create({
      data: {
        userId: req.user.id,
        projectId: String(req.params.id)
      }
    });

    res.status(201).json({ following: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a project
router.get('/:id/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { projectId: String(req.params.id) },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true } }
      }
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
