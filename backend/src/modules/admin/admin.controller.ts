import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { UnauthorizedError } from '../../shared/errors';

export const adminRouter = Router();

adminRouter.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.isAdmin) return next(new UnauthorizedError('Admin only'));

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        createdAt: true,
        campaigns: {
          select: {
            id: true,
            candidates: {
              select: {
                emails: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    const totalUsers = users.length;

    // Group by date (YYYY-MM-DD)
    const growthMap: Record<string, number> = {};
    for (const u of users) {
      const date = u.createdAt.toISOString().slice(0, 10);
      growthMap[date] = (growthMap[date] || 0) + 1;
    }
    const userGrowth = Object.entries(growthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const perUserStats = users.map((u) => {
      const projectCount = u.campaigns.length;
      const emailsGenerated = u.campaigns.reduce(
        (sum, c) => sum + c.candidates.reduce((s2, cand) => s2 + cand.emails.length, 0),
        0
      );
      return { email: u.email, createdAt: u.createdAt.toISOString(), projectCount, emailsGenerated };
    });

    res.json({ totalUsers, userGrowth, perUserStats });
  } catch (e) { next(e); }
});
