import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { ValidationError, NotFoundError, ForbiddenError } from '../../shared/errors';

export const profilesRouter = Router();

profilesRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const profiles = await prisma.senderProfile.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'asc' } });
    res.json(profiles);
  } catch (e) { next(e); }
});

profilesRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, title, company, role, signature, personalNote, isDefault } = req.body;
    if (!name || !title || !company || !role || !signature) return next(new ValidationError('Missing required fields'));
    if (isDefault) {
      await prisma.senderProfile.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    }
    const profile = await prisma.senderProfile.create({
      data: { userId: req.user!.id, name, title, company, role, signature, personalNote, isDefault: isDefault ?? false },
    });
    res.status(201).json(profile);
  } catch (e) { next(e); }
});

profilesRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.senderProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return next(new NotFoundError());
    if (profile.userId !== req.user!.id) return next(new ForbiddenError());
    await prisma.senderProfile.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
