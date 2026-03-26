import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getIO } from '../socket';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// Helper to calculate validation score for a project
const calculateScore = (project: any) => {
  const updatesWeight = 10;
  const frequencyWeight = 5;
  const commentsWeight = 2;
  const teamWeight = 8;

  const numUpdates = project._count?.progressLogs || project.progressLogs?.length || 0;

  // Frequency: updates in last 7 days
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const recentUpdates = project.progressLogs?.filter((l: any) => new Date(l.createdAt) > lastWeek).length || 0;

  const numComments = project.messages?.length || 0;
  const teamSize = project.members?.length || 0;

  return (numUpdates * updatesWeight) + (recentUpdates * frequencyWeight) + (numComments * commentsWeight) + (teamSize * teamWeight);
};

// Get Feed (All projects)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const projects = await (prisma.project as any).findMany({
    include: {
      owner: { select: { id: true, name: true, university: true, bio: true, skills: true } },
      members: { include: { user: { select: { id: true, name: true, skills: true } } } },
      progressLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      messages: { select: { id: true } },
      _count: { select: { progressLogs: true } }
    }
  });

  // Calculate scores and sort
  const scoredProjects = projects.map((p: any) => {
    // Standardize skills parsing for owner and members
    const ownerSkills = typeof p.owner?.skills === 'string' ? JSON.parse(p.owner.skills) : (p.owner?.skills || []);
    const processedMembers = (p.members || []).map((m: any) => ({
      ...m,
      user: {
        ...m.user,
        skills: typeof m.user?.skills === 'string' ? JSON.parse(m.user.skills) : (m.user?.skills || [])
      }
    }));

    return {
      ...p,
      owner: { ...p.owner, skills: ownerSkills },
      members: processedMembers,
      validationScore: calculateScore(p)
    };
  }).sort((a: any, b: any) => b.validationScore - a.validationScore);

  res.json({ success: true, data: scoredProjects });
}));

// Create Project
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!title) {
    return res.status(400).json({ success: false, error: 'Project title is required' });
  }

  const project = await prisma.project.create({
    data: {
      title,
      description: description || '',
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

  res.status(201).json({ success: true, data: project });
}));

// Get Project By ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: String(req.params.id) },
    include: {
      owner: { select: { id: true, name: true, university: true, skills: true } },
      members: { include: { user: { select: { id: true, name: true, skills: true } } } },
      progressLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      },
      messages: { select: { id: true } }
    }
  });

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  const score = calculateScore(project);
  res.json({ success: true, data: { ...project, validationScore: score } });
}));

// Join Project (Create Request)
router.post('/:id/join', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, contribution } = req.body;
  const projectId = String(req.params.id);

  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Check if project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  // Check if already member
  const existingMember = await (prisma as any).projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId } }
  });
  if (existingMember) {
    return res.status(400).json({ success: false, error: 'Already a member' });
  }

  // Check if already requested
  const existingRequest = await (prisma as any).joinRequest.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId } }
  });
  if (existingRequest) {
    return res.status(400).json({ success: false, error: 'Request already pending' });
  }

  const joinReq = await (prisma as any).joinRequest.create({
    data: {
      userId: req.user.id,
      projectId,
      message: message || "I'd like to join!",
      contribution: contribution || "General support"
    },
    include: { user: { select: { id: true, name: true, skills: true } } }
  });

  // Notify project owner
  getIO()?.to(`user_${project.createdBy}`).emit('new_join_request', joinReq);

  res.status(201).json({ success: true, data: joinReq });
}));

// Get Join Requests (for project owner)
router.get('/:id/requests', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const projectId = String(req.params.id);
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  if (project.createdBy !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Unauthorized: You are not the owner' });
  }

  const requests = await (prisma as any).joinRequest.findMany({
    where: { projectId: project.id, status: 'PENDING' },
    include: {
      user: { select: { id: true, name: true, university: true, skills: true, bio: true } }
    }
  });

  res.json({ success: true, data: requests });
}));

// Respond to Join Request
router.post('/:id/requests/:requestId/respond', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, role } = req.body; // status: 'ACCEPTED' or 'REJECTED'
  const projectId = String(req.params.id);
  const requestId = String(req.params.requestId);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  if (project.createdBy !== req.user?.id) {
    return res.status(403).json({ success: false, error: 'Unauthorized: You are not the owner' });
  }

  const joinReq = await (prisma as any).joinRequest.findUnique({ where: { id: requestId } });
  if (!joinReq) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }

  if (status === 'ACCEPTED') {
    await prisma.$transaction([
      (prisma as any).joinRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } }),
      (prisma as any).projectMember.create({
        data: {
          userId: joinReq.userId,
          projectId: joinReq.projectId,
          role: role || 'Contributor',
        }
      })
    ]);

    const member = await (prisma as any).projectMember.findUnique({
      where: { userId_projectId: { userId: joinReq.userId, projectId: joinReq.projectId } },
      include: { user: { select: { id: true, name: true } } }
    });

    getIO()?.to(`project_${projectId}`).emit('member_joined', member);
  } else {
    await (prisma as any).joinRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
  }

  res.json({ success: true, data: { status } });
}));

// Get messages for a project
router.get('/:id/messages', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const messages = await prisma.message.findMany({
    where: { projectId: String(req.params.id) },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true } }
    }
  });

  res.json({ success: true, data: messages });
}));

export default router;
