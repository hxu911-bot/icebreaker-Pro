import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as svc from './send.service';

export const sendRouter = Router();

sendRouter.post('/campaign/:campaignId', authenticate, async (req, res, next) => {
  try {
    const force = req.body?.force === true;
    res.json({ results: await svc.sendCampaignEmails(req.params.campaignId, req.user!.id, force) });
  } catch (e) { next(e); }
});

sendRouter.post('/test-smtp', authenticate, async (req, res, next) => {
  try { res.json(await svc.testSmtp(req.user!.id)); } catch (e) { next(e); }
});
