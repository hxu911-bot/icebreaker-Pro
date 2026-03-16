import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';

export async function getCampaigns(userId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    include: {
      profile: true,
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Append reply and sent counts
  const campaignIds = campaigns.map(c => c.id);
  if (campaignIds.length === 0) return campaigns;

  const [repliedGroups, sentGroups] = await Promise.all([
    prisma.candidate.groupBy({
      by: ['campaignId'],
      where: { campaignId: { in: campaignIds }, replied: true },
      _count: { id: true },
    }),
    prisma.candidate.groupBy({
      by: ['campaignId'],
      where: { campaignId: { in: campaignIds }, status: 'SENT' },
      _count: { id: true },
    }),
  ]);

  const replyCountByCampaign = Object.fromEntries(repliedGroups.map(g => [g.campaignId, g._count.id]));
  const sentCountByCampaign = Object.fromEntries(sentGroups.map(g => [g.campaignId, g._count.id]));

  return campaigns.map(c => ({
    ...c,
    _replyCount: replyCountByCampaign[c.id] || 0,
    _sentCount: sentCountByCampaign[c.id] || 0,
  }));
}

export async function getCampaign(id: string, userId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      profile: true,
      candidates: {
        include: { emails: true, sendLogs: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (campaign.userId !== userId) throw new ForbiddenError();
  return campaign;
}

export async function createCampaign(userId: string, data: {
  name: string; jobTitle?: string; profileId?: string;
  style?: string; language?: string; emailCount?: number;
}) {
  return prisma.campaign.create({
    data: {
      userId,
      name: data.name,
      jobTitle: data.jobTitle,
      profileId: data.profileId,
      style: data.style || 'PROFESSIONAL',
      language: data.language || 'English',
      emailCount: data.emailCount || 1,
    },
    include: { profile: true },
  });
}

export async function updateCampaign(id: string, userId: string, data: Partial<{
  name: string; jobTitle: string; profileId: string;
  style: string; language: string; emailCount: number; status: string;
}>) {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError();
  if (campaign.userId !== userId) throw new ForbiddenError();
  return prisma.campaign.update({ where: { id }, data });
}

export async function deleteCampaign(id: string, userId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError();
  if (campaign.userId !== userId) throw new ForbiddenError();
  await prisma.campaign.delete({ where: { id } });
}

export async function addCandidates(campaignId: string, userId: string, candidates: Array<{
  name?: string; email?: string; rawText: string; source: string;
}>) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new NotFoundError();
  if (campaign.userId !== userId) throw new ForbiddenError();
  return prisma.candidate.createMany({
    data: candidates.map(c => ({ ...c, campaignId })),
  });
}

export async function deleteCandidate(candidateId: string, userId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: { campaign: true } });
  if (!candidate) throw new NotFoundError();
  if (candidate.campaign.userId !== userId) throw new ForbiddenError();
  await prisma.candidate.delete({ where: { id: candidateId } });
}

// Feature 2: update candidate fields (recruiterNote)
export async function updateCandidate(candidateId: string, userId: string, data: { recruiterNote?: string }) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: { campaign: true } });
  if (!candidate) throw new NotFoundError();
  if (candidate.campaign.userId !== userId) throw new ForbiddenError();
  return prisma.candidate.update({ where: { id: candidateId }, data });
}

// Feature 3: toggle replied status
export async function toggleCandidateReply(candidateId: string, userId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: { campaign: true } });
  if (!candidate) throw new NotFoundError();
  if (candidate.campaign.userId !== userId) throw new ForbiddenError();
  const newReplied = !candidate.replied;
  return prisma.candidate.update({
    where: { id: candidateId },
    data: {
      replied: newReplied,
      repliedAt: newReplied ? new Date() : null,
    },
  });
}

// Feature 1: contact history per email
export async function getContactHistory(userId: string, emails: string[]) {
  if (emails.length === 0) return {};

  const logs = await prisma.sendLog.findMany({
    where: {
      toEmail: { in: emails },
      status: 'SENT',
      candidate: { campaign: { userId } },
    },
    include: { candidate: { include: { campaign: { select: { id: true, name: true } } } } },
    orderBy: { sentAt: 'desc' },
  });

  const result: Record<string, { sentAt: string; campaignName: string; campaignId: string; daysAgo: number }> = {};
  for (const log of logs) {
    if (!result[log.toEmail]) {
      const daysAgo = Math.floor((Date.now() - new Date(log.sentAt).getTime()) / (1000 * 60 * 60 * 24));
      result[log.toEmail] = {
        sentAt: log.sentAt.toISOString(),
        campaignName: log.candidate.campaign.name,
        campaignId: log.candidate.campaign.id,
        daysAgo,
      };
    }
  }
  return result;
}
