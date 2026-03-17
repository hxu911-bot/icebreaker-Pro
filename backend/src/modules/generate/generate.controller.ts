import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as svc from './generate.service';
import { UnprocessableError } from '../../shared/errors';

export const generateRouter = Router();

generateRouter.post('/campaign/:campaignId', authenticate, async (req, res, next) => {
  try {
    if (!req.user!.dashscopeKey) return next(new UnprocessableError('请先在设置中添加 DashScope Key'));
    const { candidateIds } = req.body as { candidateIds?: string[] };
    const results = await svc.generateForCampaign(req.params.campaignId, req.user!.dashscopeKey!, candidateIds);
    res.json({ results });
  } catch (e) { next(e); }
});

generateRouter.put('/emails/:emailId/approve', authenticate, async (req, res, next) => {
  try { res.json(await svc.approveEmail(req.params.emailId)); } catch (e) { next(e); }
});

generateRouter.put('/emails/:emailId/unapprove', authenticate, async (req, res, next) => {
  try { res.json(await svc.unapproveEmail(req.params.emailId)); } catch (e) { next(e); }
});

generateRouter.put('/emails/:emailId', authenticate, async (req, res, next) => {
  try {
    const { subject, body } = req.body;
    res.json(await svc.updateEmailContent(req.params.emailId, subject, body));
  } catch (e) { next(e); }
});

generateRouter.post('/emails/:emailId/restyle', authenticate, async (req, res, next) => {
  try {
    if (!req.user!.dashscopeKey) return next(new UnprocessableError('请先在设置中添加 DashScope Key'));
    const { style } = req.body;
    res.json(await svc.restyleEmail(req.params.emailId, style, req.user!.dashscopeKey!));
  } catch (e) { next(e); }
});

// Feature 2: regenerate for a single candidate
generateRouter.post('/candidate/:candidateId', authenticate, async (req, res, next) => {
  try {
    if (!req.user!.dashscopeKey) return next(new UnprocessableError('请先在设置中添加 DashScope Key'));
    res.json(await svc.regenerateForCandidate(req.params.candidateId, req.user!.id, req.user!.dashscopeKey!));
  } catch (e) { next(e); }
});
