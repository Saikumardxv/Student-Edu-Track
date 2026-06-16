import { Router, Response } from 'express';
import prisma from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// 1. GET /api/notices -- Fetch relevant notices based on user's role and department
router.get('/notices', async (req: AuthRequest, res: Response) => {
  const { role, departmentId } = req.user!;

  try {
    let notices;

    if (role === 'ADMIN') {
      // Admins see all notices
      notices = await prisma.notice.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Students and Faculty see notices targeted to their role or null, and departmentId or null
      notices = await prisma.notice.findMany({
        where: {
          OR: [
            { targetRole: role, departmentId: null },
            { targetRole: role, departmentId: departmentId ? Number(departmentId) : null },
            { targetRole: null, departmentId: null },
            { targetRole: null, departmentId: departmentId ? Number(departmentId) : null },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.status(200).json(notices);
  } catch (error) {
    console.error('Fetch notices error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. POST /api/notices -- Post a new notice (Admin only)
router.post('/notices', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admin only' });
  }

  const { title, content, targetRole, departmentId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        targetRole: targetRole || null,
        departmentId: departmentId ? Number(departmentId) : null,
        createdBy: req.user!.id,
      },
    });

    return res.status(201).json({ message: 'Notice posted successfully', notice });
  } catch (error) {
    console.error('Post notice error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
