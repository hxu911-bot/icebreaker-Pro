import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, AppError } from '../../shared/errors';

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

  // Recalculate sentCount from sendLogs to handle candidates created before
  // the sentCount field existed (their DB value is 0 despite having send history).
  // Also clear regenRequestedAt if a successful send occurred after the regen request
  // (handles existing DB records where this wasn't cleared at send time).
  return {
    ...campaign,
    candidates: campaign.candidates.map(c => {
      const sentCount = c.sendLogs.filter(log => log.status === 'SENT').length;
      const latestSentAt = c.sendLogs
        .filter(log => log.status === 'SENT')
        .reduce<Date | null>((max, log) => {
          const t = new Date(log.sentAt);
          return max === null || t > max ? t : max;
        }, null);
      const regenStillPending = c.regenRequestedAt && latestSentAt
        ? latestSentAt <= c.regenRequestedAt
        : !!c.regenRequestedAt;
      return {
        ...c,
        sentCount,
        regenRequestedAt: regenStillPending ? c.regenRequestedAt : null,
        regenReason: regenStillPending ? c.regenReason : null,
      };
    }),
  };
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

// Mark a candidate as sent via an external channel (creates a SendLog tagged [EXTERNAL])
export async function markCandidateSent(candidateId: string, userId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: { campaign: true } });
  if (!candidate) throw new NotFoundError();
  if (candidate.campaign.userId !== userId) throw new ForbiddenError();
  await prisma.sendLog.create({
    data: { candidateId, toEmail: candidate.email || '—', subject: '[EXTERNAL]', status: 'SENT' },
  });
  return prisma.candidate.update({ where: { id: candidateId }, data: { status: 'SENT' } });
}

// Unmark: only allowed when all sendLogs are external (i.e. never system-sent)
export async function unmarkCandidateSent(candidateId: string, userId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { campaign: true, emails: { take: 1 }, sendLogs: true },
  });
  if (!candidate) throw new NotFoundError();
  if (candidate.campaign.userId !== userId) throw new ForbiddenError();
  const allExternal = (candidate.sendLogs as any[]).every(l => l.subject === '[EXTERNAL]');
  if (!allExternal) throw new AppError(422, '只能取消手动标记的已发送状态');
  await prisma.sendLog.deleteMany({ where: { candidateId, subject: '[EXTERNAL]' } });
  const newStatus = (candidate.emails as any[]).length > 0 ? 'GENERATED' : 'PENDING';
  return prisma.candidate.update({ where: { id: candidateId }, data: { status: newStatus } });
}

// Feature 2: update candidate fields (name, recruiterNote, email)
export async function updateCandidate(candidateId: string, userId: string, data: { name?: string; recruiterNote?: string; email?: string }) {
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

const REGEN_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export async function requestRegen(candidateId: string, userId: string, reason: string) {
  if (!reason?.trim()) throw new AppError(422, '请填写重新生成的原因');
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: { campaign: true } });
  if (!candidate) throw new NotFoundError();
  if (candidate.campaign.userId !== userId) throw new ForbiddenError();
  if (candidate.status !== 'SENT') throw new AppError(422, '只有已发送的人选才需要申请重新生成');
  if (candidate.regenRequestedAt) {
    const elapsed = Date.now() - new Date(candidate.regenRequestedAt).getTime();
    if (elapsed < REGEN_COOLDOWN_MS) {
      const minutesLeft = Math.ceil((REGEN_COOLDOWN_MS - elapsed) / 60000);
      throw new AppError(409, `冷却期未结束，还需等待 ${minutesLeft} 分钟`);
    }
  }
  return prisma.candidate.update({
    where: { id: candidateId },
    data: { regenRequestedAt: new Date(), regenReason: reason.trim() },
  });
}
