import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();

// GET /api/search - Unified Search
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  const type = String(req.query.type || 'all');
  
  let projects: any[] = [];
  let users: any[] = [];

  // Search logic for projects
  if (type === 'all' || type === 'projects') {
     const rawProjects = await prisma.project.findMany({
       where: {
         OR: [
           { title: { contains: q, mode: 'insensitive' } },
           { description: { contains: q, mode: 'insensitive' } }
         ]
       },
       include: { 
         owner: { select: { id: true, name: true, university: true, skills: true } }, 
         members: { include: { user: { select: { name: true } } } },
         _count: { select: { progressLogs: true, messages: true } }
       },
       take: 20
     });

     projects = rawProjects.map((p: any) => ({
        ...p,
        validationScore: (p._count?.progressLogs || 0) * 10 + (p.members?.length || 0) * 8,
        owner: {
          ...p.owner,
          skills: typeof p.owner?.skills === 'string' ? JSON.parse(p.owner.skills) : (p.owner?.skills || [])
        }
     }));
  }

  // Search logic for users
  if (type === 'all' || type === 'users') {
     const rawUsers = await prisma.user.findMany({
       where: {
         OR: [
           { name: { contains: q, mode: 'insensitive' } },
           { university: { contains: q, mode: 'insensitive' } }
         ]
       },
       select: { id: true, name: true, university: true, skills: true, bio: true, intent: true },
       take: 20
     });

     users = rawUsers.map((u: any) => ({
       ...u,
       skills: typeof u.skills === 'string' ? JSON.parse(u.skills) : (u.skills || [])
     }));
  }

  res.json({ 
    success: true, 
    data: { projects, users } 
  });
}));

export default router;
