import { Router } from 'express';
import { prisma, io } from '../index';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Post Progress Log
router.post('/:projectId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { content, mediaUrl } = req.body;
    const projectId = String(req.params.projectId);

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Progress log content cannot be empty' });
    }

    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    // Check if user is a member or owner
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId
        }
      }
    });

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!membership && project?.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Only members can post progress logs' });
    }

    const log = await prisma.progressLog.create({
      data: {
        content,
        mediaUrl,
        projectId,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    // Emit event to project room
    io.to(`project_${projectId}`).emit('new_progress_log', log);
    // Emit globally for feed
    io.emit('feed_update', log);

    // Update project lastUpdated
    await prisma.project.update({
      where: { id: projectId },
      data: { lastUpdated: new Date() }
    });

    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Progress Logs for a project
router.get('/:projectId', async (req, res) => {
  try {
    const logs = await prisma.progressLog.findMany({
      where: { projectId: String(req.params.projectId) },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
