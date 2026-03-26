import { Router, Request, Response } from 'express';
import { prisma } from '../app';
import { getIO } from '../socket';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// Post Progress Log
router.post('/:projectId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, mediaUrl } = req.body;
  const projectId = String(req.params.projectId);

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Progress log content cannot be empty' });
  }

  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Check if project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }

  // Check if user is a member OR the owner
  const membershipFound = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: req.user.id,
        projectId
      }
    }
  });

  if (!membershipFound && project.createdBy !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Only members can post progress logs' });
  }

  const log = await prisma.progressLog.create({
    data: {
      content,
      mediaUrl,
      projectId,
      userId: req.user.id
    },
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { title: true } }
    }
  });

  // Emit event to project room
  getIO()?.to(`project_${projectId}`).emit('new_progress_log', log);
  // Emit globally for feed
  getIO()?.emit('feed_update', log);

  // Update project lastUpdated
  await prisma.project.update({
    where: { id: projectId },
    data: { lastUpdated: new Date() }
  });

  res.status(201).json({ success: true, data: log });
}));

// Get Progress Logs for a project
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
