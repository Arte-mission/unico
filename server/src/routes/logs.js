"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Post Progress Log
router.post('/:projectId', authMiddleware_1.authenticate, async (req, res) => {
    try {
        const { content, mediaUrl } = req.body;
        const { projectId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        // Check if user is a member or owner
        const membership = await index_1.prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: req.user.id,
                    projectId
                }
            }
        });
        const project = await index_1.prisma.project.findUnique({ where: { id: projectId } });
        if (!membership && project?.createdBy !== req.user.id) {
            return res.status(403).json({ error: 'Only members can post progress logs' });
        }
        const log = await index_1.prisma.progressLog.create({
            data: {
                content,
                mediaUrl,
                projectId,
                userId: req.user.id
            }
        });
        // Update project lastUpdated
        await index_1.prisma.project.update({
            where: { id: projectId },
            data: { lastUpdated: new Date() }
        });
        res.status(201).json(log);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get Progress Logs for a project
router.get('/:projectId', async (req, res) => {
    try {
        const logs = await index_1.prisma.progressLog.findMany({
            where: { projectId: req.params.projectId },
            include: {
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(logs);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=logs.js.map