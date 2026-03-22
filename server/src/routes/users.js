"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get my profile
router.get('/me', authMiddleware_1.authenticate, async (req, res) => {
    try {
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.user?.id },
            include: {
                projectsOwned: true,
                memberships: { include: { project: true } }
            }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Format skills back to array if needed
        const { password, skills, ...safeUser } = user;
        res.json({ ...safeUser, skills: JSON.parse(skills) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update profile
router.put('/profile', authMiddleware_1.authenticate, async (req, res) => {
    try {
        const { name, phone, university, skills, intent } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (phone)
            updateData.phone = phone;
        if (university)
            updateData.university = university;
        if (skills && Array.isArray(skills))
            updateData.skills = JSON.stringify(skills);
        if (intent)
            updateData.intent = intent;
        const user = await index_1.prisma.user.update({
            where: { id: req.user?.id },
            data: updateData
        });
        const { password, skills: dbSkills, ...safeUser } = user;
        res.json({ ...safeUser, skills: JSON.parse(dbSkills) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user by id
router.get('/:id', authMiddleware_1.authenticate, async (req, res) => {
    try {
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                projectsOwned: true,
                memberships: { include: { project: true } }
            }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const { password, skills, ...safeUser } = user;
        res.json({ ...safeUser, skills: JSON.parse(skills) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map