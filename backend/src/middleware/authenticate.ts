import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { UnauthorizedError } from '../shared/errors';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; dashscopeKey: string | null };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError());
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return next(new UnauthorizedError());
    req.user = { id: user.id, email: user.email, dashscopeKey: user.dashscopeKey };
    next();
  } catch {
    next(new UnauthorizedError());
  }
}
