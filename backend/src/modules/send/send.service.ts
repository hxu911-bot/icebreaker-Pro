import nodemailer from 'nodemailer';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../shared/errors';

export async function sendCampaignEmails(campaignId: string, userId: string, force = false) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.smtpHost) throw new AppError(422, '请先在设置中配置 SMTP');
  const cooldownDays = user.cooldownDays ?? 90;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      candidates: {
        include: { emails: { where: { approved: true } } },
      },
    },
  });
  if (!campaign) throw new AppError(404, 'Campaign not found');

  // Cooldown check
  if (!force) {
    const emails = campaign.candidates.map((c: any) => c.email).filter(Boolean) as string[];
    if (emails.length > 0) {
      const cutoff = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);
      const recentLogs = await prisma.sendLog.findMany({
        where: {
          toEmail: { in: emails },
          status: 'SENT',
          sentAt: { gte: cutoff },
          candidate: { campaign: { userId } },
        },
        include: { candidate: { include: { campaign: { select: { id: true, name: true } } } } },
        orderBy: { sentAt: 'desc' },
      });

      if (recentLogs.length > 0) {
        const seen = new Set<string>();
        const cooldownWarnings = recentLogs
          .filter(log => {
            if (seen.has(log.toEmail)) return false;
            seen.add(log.toEmail);
            return true;
          })
          .map(log => ({
            email: log.toEmail,
            sentAt: log.sentAt.toISOString(),
            campaignName: log.candidate.campaign.name,
            campaignId: log.candidate.campaign.id,
            daysAgo: Math.floor((Date.now() - new Date(log.sentAt).getTime()) / (1000 * 60 * 60 * 24)),
          }));

        const error = new AppError(409, 'Cooldown period not elapsed for some recipients');
        (error as any).cooldownWarnings = cooldownWarnings;
        throw error;
      }
    }
  }

  const transporter = nodemailer.createTransport({
    host: user.smtpHost,
    port: user.smtpPort || 587,
    secure: (user.smtpPort || 587) === 465,
    auth: { user: user.smtpUser!, pass: user.smtpPass! },
    tls: { rejectUnauthorized: false },
  });

  const results: Array<{ candidateId: string; toEmail: string; status: string; error?: string }> = [];

  for (const candidate of campaign.candidates) {
    if (!candidate.email) {
      results.push({ candidateId: candidate.id, toEmail: '', status: 'SKIPPED_NO_EMAIL' });
      continue;
    }
    const emailToSend = candidate.emails[0];
    if (!emailToSend) {
      results.push({ candidateId: candidate.id, toEmail: candidate.email, status: 'SKIPPED_NO_APPROVED' });
      continue;
    }
    try {
      await transporter.sendMail({
        from: user.smtpFrom || user.smtpUser!,
        to: candidate.email,
        subject: emailToSend.subject,
        text: emailToSend.body,
      });
      await prisma.sendLog.create({
        data: { candidateId: candidate.id, toEmail: candidate.email, subject: emailToSend.subject, status: 'SENT' },
      });
      await prisma.candidate.update({ where: { id: candidate.id }, data: { status: 'SENT' } });
      results.push({ candidateId: candidate.id, toEmail: candidate.email, status: 'SENT' });
    } catch (err: any) {
      await prisma.sendLog.create({
        data: { candidateId: candidate.id, toEmail: candidate.email, subject: emailToSend.subject, status: 'FAILED', error: err.message },
      });
      results.push({ candidateId: candidate.id, toEmail: candidate.email, status: 'FAILED', error: err.message });
    }
  }

  const allDone = results.every(r => r.status === 'SENT' || r.status.startsWith('SKIPPED'));
  await prisma.campaign.update({ where: { id: campaignId }, data: { status: allDone ? 'SENT' : 'PARTIAL_SENT' } });
  return results;
}

export async function testSmtp(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.smtpHost) throw new AppError(422, 'No SMTP configured');
  const transporter = nodemailer.createTransport({
    host: user.smtpHost,
    port: user.smtpPort || 587,
    secure: (user.smtpPort || 587) === 465,
    auth: { user: user.smtpUser!, pass: user.smtpPass! },
    tls: { rejectUnauthorized: false },
  });
  await transporter.verify();
  return { ok: true };
}
