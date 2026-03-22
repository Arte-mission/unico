"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get Feed (All projects)
router.get('/', async (req, res) => {
    try {
        const projects = await index_1.prisma.project.findMany({
            include: {
                owner: { select: { id: true, name: true, university: true } },
                members: true,
                progressLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
                followers: true,
            },
            orderBy: { lastUpdated: 'desc' }
        });
        res.json(projects);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create Project
router.post('/', authMiddleware_1.authenticate, async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        const project = await index_1.prisma.project.create({
            data: {
                title,
                description,
                createdBy: req.user.id
            }
        });
        // Auto join as founder
        await index_1.prisma.projectMember.create({
            data: {
                userId: req.user.id,
                projectId: project.id,
                role: 'Founder',
                commitmentLevel: 'Full-time'
            }
        });
        res.status(201).json(project);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get Project By ID
router.get('/:id', async (req, res) => {
    try {
        const project = await index_1.prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                owner: { select: { id: true, name: true, university: true } },
                members: { include: { user: { select: { id: true, name: true } } } },
                progressLogs: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
                followers: true,
            }
        });
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Join Project
router.post('/:id/join', authMiddleware_1.authenticate, async (req, res) => {
    try {
        const { role, commitmentLevel } = req.body;
        if (!req.user?.id)
            return res.status(401).json({ error: 'Unauthorized' });
        // Ensure not already joined
        const existing = await index_1.prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: req.user.id,
                    projectId: req.params.id
                }
            }
        });
        if (existing) {
            return res.status(400).json({ error: 'Already joined this project' });
        }
        const member = await index_1.prisma.projectMember.create({
            data: {
                userId: req.user.id,
                projectId: req.params.id,
                role: role || 'Contributor',
                commitmentLevel: commitmentLevel || 'Flexible'
            }
        });
        res.status(201).json(member);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map