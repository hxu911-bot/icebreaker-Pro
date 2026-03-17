import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';

export const settingsRouter = Router();

settingsRouter.put('/dashscope', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dashscopeKey } = req.body;
    await prisma.user.update({ where: { id: req.user!.id }, data: { dashscopeKey } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

settingsRouter.put('/smtp', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = req.body;
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { smtpHost, smtpPort: smtpPort ? parseInt(smtpPort) : null, smtpUser, smtpPass, smtpFrom },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

settingsRouter.put('/cooldown', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cooldownDays } = req.body;
    await prisma.user.update({ where: { id: req.user!.id }, data: { cooldownDays: parseInt(cooldownDays) } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

settingsRouter.get('/', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  res.json({
    hasDashscopeKey: !!user!.dashscopeKey,
    dashscopeKeyPreview: user!.dashscopeKey ? user!.dashscopeKey.slice(0, 8) + '...' : null,
    hasSmtp: !!user!.smtpHost,
    smtpHost: user!.smtpHost,
    smtpPort: user!.smtpPort,
    smtpUser: user!.smtpUser,
    smtpFrom: user!.smtpFrom,
    cooldownDays: user!.cooldownDays ?? 90,
  });
});
