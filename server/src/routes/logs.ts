import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getIO } from '../socket';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// POST /api/logs/:projectId - Post Progress Log
router.post('/:projectId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, mediaUrl } = req.body;
  const projectId = String(req.params.projectId);
  const userId = req.user?.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Progress log content cannot be empty' });
  }

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Check if project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  // Check if user is a member OR the owner
  const membershipFound = await prisma.projectMember.findFirst({
    where: { userId, projectId }
  });

  if (!membershipFound && project.createdBy !== userId) {
    return res.status(403).json({ success: false, error: 'Access denied: Must be a project member' });
  }

  const log = await prisma.progressLog.create({
    data: {
      content,
      mediaUrl,
      projectId,
      userId
    },
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { title: true } }
    }
  });

  // Emit event to project room
  getIO()?.to(`project_${projectId}`).emit('new_progress_log', log);
  // Emit globally for feed updates
  getIO()?.emit('feed_update', log);

  // Update project lastUpdated
  await prisma.project.update({
    where: { id: projectId },
    data: { lastUpdated: new Date() }
  });

  console.log(`📈 [LOG] New progress logged for project ${projectId} by user ${userId}`);

  res.status(201).json({ success: true, data: log });
}));

// GET /api/logs/:projectId - Get Progress Logs for a project
router.get('/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const projectId = String(req.params.projectId);
  const logs = await prisma.progressLog.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: logs });
}));

export default router;
