import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '');
    const type = String(req.query.type || 'all');
    
    let projects: any[] = [];
    let users: any[] = [];

    // On SQLite Prisma, contains is case-sensitive by default unless configured.
    // For MVP, we will just use contains.
    if (type === 'all' || type === 'projects') {
       projects = await prisma.project.findMany({
         where: {
           OR: [
             { title: { contains: q } },
             { description: { contains: q } }
           ]
         },
         include: { owner: { select: { id: true, name: true } }, members: true },
         take: 20
       });
    }

    if (type === 'all' || type === 'users') {
       users = await prisma.user.findMany({
         where: {
           OR: [
             { name: { contains: q } },
             { university: { contains: q } }
           ]
         },
         select: { id: true, name: true, university: true, skills: true },
         take: 20
       });
    }

    res.json({ projects, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
