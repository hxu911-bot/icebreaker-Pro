import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as svc from './campaigns.service';

export const campaignsRouter = Router();

campaignsRouter.get('/', authenticate, async (req, res, next) => {
  try { res.json(await svc.getCampaigns(req.user!.id)); } catch (e) { next(e); }
});

campaignsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const campaign = await svc.createCampaign(req.user!.id, req.body);
    res.status(201).json(campaign);
  } catch (e) { next(e); }
});

campaignsRouter.get('/:id', authenticate, async (req, res, next) => {
  try { res.json(await svc.getCampaign(req.params.id, req.user!.id)); } catch (e) { next(e); }
});

campaignsRouter.put('/:id', authenticate, async (req, res, next) => {
  try { res.json(await svc.updateCampaign(req.params.id, req.user!.id, req.body)); } catch (e) { next(e); }
});

campaignsRouter.delete('/:id', authenticate, async (req, res, next) => {
  try { await svc.deleteCampaign(req.params.id, req.user!.id); res.json({ ok: true }); } catch (e) { next(e); }
});

campaignsRouter.post('/:id/candidates', authenticate, async (req, res, next) => {
  try {
    const result = await svc.addCandidates(req.params.id, req.user!.id, req.body.candidates);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

// Feature 1: contact history for a campaign
campaignsRouter.get('/:id/contact-history', authenticate, async (req, res, next) => {
  try {
    const campaign = await svc.getCampaign(req.params.id, req.user!.id);
    const emails = campaign.candidates.map((c: any) => c.email).filter(Boolean) as string[];
    const history = await svc.getContactHistory(req.user!.id, emails);
    res.json(history);
  } catch (e) { next(e); }
});

// Feature 3: toggle reply — MUST be before PUT /candidates/:id
campaignsRouter.put('/candidates/:id/reply', authenticate, async (req, res, next) => {
  try { res.json(await svc.toggleCandidateReply(req.params.id, req.user!.id)); } catch (e) { next(e); }
});

// Feature 2: update candidate (recruiterNote)
campaignsRouter.put('/candidates/:id', authenticate, async (req, res, next) => {
  try { res.json(await svc.updateCandidate(req.params.id, req.user!.id, req.body)); } catch (e) { next(e); }
});

campaignsRouter.delete('/candidates/:candidateId', authenticate, async (req, res, next) => {
  try { await svc.deleteCandidate(req.params.candidateId, req.user!.id); res.json({ ok: true }); } catch (e) { next(e); }
});
