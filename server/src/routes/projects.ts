import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getIO } from '../socket';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// Standard Project Include Object to reduce duplication and ensure stability
const DEFAULT_PROJECT_INCLUDE = {
  owner: { select: { id: true, name: true, university: true, bio: true, skills: true } },
  members: { 
    include: { 
      user: { select: { id: true, name: true, skills: true } } 
    } 
  },
  _count: { select: { progressLogs: true, messages: true } }
};

// Helper: Standardize skills processing to avoid client-side JSON.parse failures
const processProjectData = (p: any) => {
  if (!p) return null;
  
  const ownerSkills = typeof p.owner?.skills === 'string' ? JSON.parse(p.owner.skills) : (p.owner?.skills || []);
  const processedMembers = (p.members || []).map((m: any) => ({
    ...m,
    user: m.user ? {
      ...m.user,
      skills: typeof m.user.skills === 'string' ? JSON.parse(m.user.skills) : (m.user.skills || [])
    } : null
  }));

  // Validation Score Logic (Simplified & Task 6: cleaned)
  const numUpdates = p._count?.progressLogs || 0;
  const numMessages = p._count?.messages || 0;
  const teamSize = p.members?.length || 0;
  const score = (numUpdates * 10) + (numMessages * 2) + (teamSize * 5);

  return {
    ...p,
    owner: p.owner ? { ...p.owner, skills: ownerSkills } : null,
    members: processedMembers,
    validationScore: score
  };
};

// GET /api/projects - Feed
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    include: {
      ...DEFAULT_PROJECT_INCLUDE,
      progressLogs: { orderBy: { createdAt: 'desc' }, take: 1 } // Only need latest for feed
    }
  });

  const processed = projects.map(processProjectData).filter(Boolean);
  res.json({ success: true, data: processed });
}));

// POST /api/projects - Create
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!title) {
    return res.status(400).json({ success: false, error: 'Project title is required' });
  }

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        title,
        description: description || '',
        createdBy: req.user!.id
      }
    });

    // Auto join as founder
    await tx.projectMember.create({
      data: {
        userId: req.user!.id,
        projectId: p.id,
        role: 'Founder',
        commitmentLevel: 'Full-time'
      }
    });

    return p;
  });

  res.status(201).json({ success: true, data: project });
}));

// GET /api/projects/:id - Details
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: String(req.params.id) },
    include: {
      ...DEFAULT_PROJECT_INCLUDE,
      progressLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  res.json({ success: true, data: processProjectData(project) });
}));

// POST /api/projects/:id/join - Join Request
router.post('/:id/join', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, contribution } = req.body;
  const projectId = String(req.params.id);
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  // Check existing membership or request
  const existingMember = await prisma.projectMember.findFirst({
    where: { userId, projectId }
  });
  if (existingMember) {
    return res.status(400).json({ success: false, error: 'Already a member' });
  }

  const existingRequest = await prisma.joinRequest.findFirst({
    where: { userId, projectId, status: 'PENDING' }
  });
  if (existingRequest) {
    return res.status(400).json({ success: false, error: 'Join request already pending' });
  }

  const joinReq = await prisma.joinRequest.create({
    data: {
      userId,
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

// GET /api/projects/:id/requests - Get PENDING join requests (Owner only)
router.get('/:id/requests', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const projectId = String(req.params.id);
  const userId = req.user?.id;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
  if (project.createdBy !== userId) return res.status(403).json({ success: false, error: 'Unauthorized: Not the owner' });

  const requests = await prisma.joinRequest.findMany({
    where: { projectId, status: 'PENDING' },
    include: {
      user: { select: { id: true, name: true, university: true, skills: true, bio: true } }
    }
  });

  res.json({ success: true, data: requests });
}));

// POST /api/projects/:id/requests/:requestId/respond - Accept/Reject Request
router.post('/:id/requests/:requestId/respond', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, role } = req.body; // status: 'ACCEPTED' or 'REJECTED'
  const projectId = String(req.params.id);
  const requestId = String(req.params.requestId);
  const userId = req.user?.id;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
  if (project.createdBy !== userId) return res.status(403).json({ success: false, error: 'Unauthorized: Not the owner' });

  const joinReq = await prisma.joinRequest.findUnique({ where: { id: requestId } });
  if (!joinReq || joinReq.projectId !== projectId) return res.status(404).json({ success: false, error: 'Request not found' });

  if (status === 'ACCEPTED') {
    await prisma.$transaction([
      prisma.joinRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } }),
      prisma.projectMember.create({
        data: {
          userId: joinReq.userId,
          projectId: joinReq.projectId,
          role: role || 'Contributor',
        }
      })
    ]);

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: joinReq.userId, projectId: joinReq.projectId } },
      include: { user: { select: { id: true, name: true } } }
    });

    getIO()?.to(`project_${projectId}`).emit('member_joined', member);
    console.log(`✅ [JOIN] User ${joinReq.userId} joined project ${projectId}`);
  } else {
    await prisma.joinRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
  }

  res.json({ success: true, data: { status } });
}));

// GET /api/projects/:id/messages
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
