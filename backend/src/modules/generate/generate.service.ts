import OpenAI, { APIError } from 'openai';
import { AppError, ForbiddenError, NotFoundError } from '../../shared/errors';
import { prisma } from '../../lib/prisma';

function createClient(key: string) {
  return new OpenAI({ apiKey: key, baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1' });
}

function handleError(err: unknown): never {
  if (err instanceof APIError) {
    if (err.status === 401 || err.status === 403) throw new AppError(422, 'DashScope Key 无效');
    if (err.status === 429) throw new AppError(429, '请求超限，请稍后再试');
    throw new AppError(502, `AI 服务错误: ${err.message}`);
  }
  throw err;
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
  PROFESSIONAL: 'Formal and structured. Clear value proposition, precise language, explicit next steps. Suitable for finance/consulting/executive roles.',
  WARM: 'First-person, genuine, conversational. Express authentic interest, invite a casual chat. Suitable for internet/startup cultures.',
  CONCISE: 'Under 150 words. No filler. One core question or hook. Straight to the point. Suitable for engineering cultures.',
  STORYTELLING: 'Open with a scene or story, narrative transition, open-ended close. Suitable for product/growth/creative roles.',
};

// Native-language instruction so the model doesn't fall back to English
const LANGUAGE_INSTRUCTION: Record<string, string> = {
  'English': 'Write the entire email in English.',
  'Chinese (Simplified)': '必须用简体中文撰写整封邮件（包括主题行），不得使用英文。',
  'Japanese': 'メール全文（件名含む）を日本語で書いてください。英語は使わないでください。',
  'Korean': '이메일 전체(제목 포함)를 한국어로 작성하세요. 영어를 사용하지 마세요.',
  'German': 'Schreiben Sie die gesamte E-Mail (einschließlich Betreff) auf Deutsch. Kein Englisch.',
  'French': "Rédigez l'intégralité de l'e-mail (y compris l'objet) en français. Pas d'anglais.",
};

function getLanguageInstruction(language: string): string {
  return LANGUAGE_INSTRUCTION[language] || `Write the entire email in ${language}.`;
}

// Heuristic: pick best email style based on candidate background
function detectBestStyle(rawText: string): string {
  const t = rawText.toLowerCase();
  if (/finance|banking|consulting|partner|director|vp |svp|cfo|coo|cto|legal|audit/.test(t)) return 'PROFESSIONAL';
  if (/product manager|growth|marketing|brand|design|ux|ui|creative|content/.test(t)) return 'STORYTELLING';
  if (/engineer|developer|backend|frontend|fullstack|devops|sre|infrastructure|ml |ai |llm|algorithm/.test(t)) return 'CONCISE';
  if (/startup|founder|early.stage|seed|series a|entrepreneur/.test(t)) return 'WARM';
  return 'PROFESSIONAL';
}

const ANGLE_HINTS = [
  'Lead with a specific achievement or project from their background.',
  'Lead with a compelling question about their career growth.',
  'Lead with a unique company culture or mission angle.',
];

async function generateSingle(openai: OpenAI, params: {
  candidateText: string;
  senderName: string; senderTitle: string; senderCompany: string;
  senderRole: string; senderSignature: string; senderNote?: string;
  recruiterNote?: string;
  style: string; language: string; jobTitle?: string; angleHint: string;
}) {
  const { candidateText, senderName, senderTitle, senderCompany, senderRole,
    senderSignature, senderNote, recruiterNote, style, language, jobTitle, angleHint } = params;

  const langInstruction = getLanguageInstruction(language);

  let response;
  try {
    response = await openai.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: `[MANDATORY LANGUAGE RULE — MUST FOLLOW]: ${langInstruction}

You are an expert recruitment email writer. Generate a highly personalized outreach email.
Reference specific details from the candidate's background. Return ONLY valid JSON: {"subject": "...", "body": "..."}

[REMINDER]: ${langInstruction}`,
        },
        {
          role: 'user',
          content: `SENDER: ${senderName}, ${senderTitle} at ${senderCompany} (${senderRole})
SIGNATURE: ${senderSignature}${senderNote ? '\nNOTE: ' + senderNote : ''}

CANDIDATE:
${candidateText}
${recruiterNote ? `\n[RECRUITER'S PERSONAL OBSERVATION — WEAVE NATURALLY]: ${recruiterNote}` : ''}
ROLE: ${jobTitle || 'infer from background'}
STYLE: ${style} - ${STYLE_DESCRIPTIONS[style] || ''}
ANGLE: ${angleHint}

[LANGUAGE — NON-NEGOTIABLE]: ${langInstruction}

Return JSON: {"subject": "...", "body": "..."}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });
  } catch (err) { handleError(err); }

  const content = response!.choices[0]?.message?.content || '{}';
  try { return JSON.parse(content); } catch { return { subject: '', body: content }; }
}

export async function generateForCampaign(campaignId: string, dashscopeKey: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { profile: true, candidates: true },
  });
  if (!campaign) throw new AppError(404, 'Campaign not found');
  if (!campaign.profile) throw new AppError(422, 'Campaign needs a sender profile');

  const openai = createClient(dashscopeKey);
  const profile = campaign.profile;
  const results: Array<{ candidateId: string; success: boolean; error?: string }> = [];

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'GENERATING' } });

  for (let i = 0; i < campaign.candidates.length; i++) {
    const candidate = campaign.candidates[i];
    try {
      await prisma.candidate.update({ where: { id: candidate.id }, data: { status: 'GENERATING' } });

      // Auto-detect best style for each candidate, apply same style to all variants
      const count = campaign.emailCount as 1 | 2 | 3;
      const bestStyle = detectBestStyle(candidate.rawText);
      const styles = Array.from({ length: count }, () => bestStyle);

      const emails = await Promise.all(
        Array.from({ length: count }, (_, idx) =>
          generateSingle(openai, {
            candidateText: candidate.rawText,
            senderName: profile.name, senderTitle: profile.title,
            senderCompany: profile.company, senderRole: profile.role,
            senderSignature: profile.signature, senderNote: profile.personalNote || undefined,
            recruiterNote: (candidate as any).recruiterNote || undefined,
            style: styles[idx] || styles[0],
            language: campaign.language,
            jobTitle: campaign.jobTitle || undefined,
            angleHint: ANGLE_HINTS[idx] || ANGLE_HINTS[0],
          })
        )
      );

      await prisma.generatedEmail.createMany({
        data: emails.map((e, idx) => ({
          candidateId: candidate.id,
          subject: e.subject || '',
          body: e.body || '',
          style: styles[idx] || styles[0],
        })),
      });
      await prisma.candidate.update({ where: { id: candidate.id }, data: { status: 'GENERATED' } });
      results.push({ candidateId: candidate.id, success: true });
    } catch (err: any) {
      await prisma.candidate.update({ where: { id: candidate.id }, data: { status: 'ERROR' } });
      results.push({ candidateId: candidate.id, success: false, error: err.message });
    }
  }

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'GENERATED' } });
  return results;
}

export async function restyleEmail(emailId: string, newStyle: string, dashscopeKey: string) {
  const email = await prisma.generatedEmail.findUnique({
    where: { id: emailId },
    include: { candidate: { include: { campaign: { include: { profile: true } } } } },
  });
  if (!email) throw new AppError(404, 'Email not found');

  const { candidate } = email;
  const { campaign } = candidate;
  if (!campaign.profile) throw new AppError(422, 'No sender profile on campaign');

  const openai = createClient(dashscopeKey);
  const profile = campaign.profile;

  const result = await generateSingle(openai, {
    candidateText: candidate.rawText,
    senderName: profile.name, senderTitle: profile.title,
    senderCompany: profile.company, senderRole: profile.role,
    senderSignature: profile.signature, senderNote: profile.personalNote || undefined,
    style: newStyle,
    language: campaign.language,
    jobTitle: campaign.jobTitle || undefined,
    angleHint: ANGLE_HINTS[0],
  });

  return prisma.generatedEmail.update({
    where: { id: emailId },
    data: { subject: result.subject || '', body: result.body || '', style: newStyle, approved: false },
  });
}

export async function approveEmail(emailId: string) {
  return prisma.generatedEmail.update({ where: { id: emailId }, data: { approved: true } });
}

export async function unapproveEmail(emailId: string) {
  return prisma.generatedEmail.update({ where: { id: emailId }, data: { approved: false } });
}

export async function updateEmailContent(emailId: string, subject: string, body: string) {
  return prisma.generatedEmail.update({ where: { id: emailId }, data: { subject, body } });
}

// Feature 2: regenerate emails for a single candidate (uses recruiterNote)
export async function regenerateForCandidate(candidateId: string, userId: string, dashscopeKey: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { campaign: { include: { profile: true } } },
  });
  if (!candidate) throw new NotFoundError('Candidate not found');
  if (candidate.campaign.userId !== userId) throw new ForbiddenError();
  if (candidate.status === 'GENERATING') throw new AppError(409, 'Already generating');

  const { campaign } = candidate;
  if (!campaign.profile) throw new AppError(422, 'Campaign needs a sender profile');

  const openai = createClient(dashscopeKey);
  const profile = campaign.profile;

  await prisma.candidate.update({ where: { id: candidateId }, data: { status: 'GENERATING' } });

  try {
    await prisma.generatedEmail.deleteMany({ where: { candidateId } });

    const count = campaign.emailCount as 1 | 2 | 3;
    const bestStyle = detectBestStyle(candidate.rawText);
    const styles = Array.from({ length: count }, () => bestStyle);

    const emails = await Promise.all(
      Array.from({ length: count }, (_, idx) =>
        generateSingle(openai, {
          candidateText: candidate.rawText,
          senderName: profile.name, senderTitle: profile.title,
          senderCompany: profile.company, senderRole: profile.role,
          senderSignature: profile.signature, senderNote: profile.personalNote || undefined,
          recruiterNote: (candidate as any).recruiterNote || undefined,
          style: styles[idx] || styles[0],
          language: campaign.language,
          jobTitle: campaign.jobTitle || undefined,
          angleHint: ANGLE_HINTS[idx] || ANGLE_HINTS[0],
        })
      )
    );

    await prisma.generatedEmail.createMany({
      data: emails.map((e, idx) => ({
        candidateId,
        subject: e.subject || '',
        body: e.body || '',
        style: styles[idx] || styles[0],
      })),
    });
    await prisma.candidate.update({ where: { id: candidateId }, data: { status: 'GENERATED' } });
    return { success: true };
  } catch (err: any) {
    await prisma.candidate.update({ where: { id: candidateId }, data: { status: 'ERROR' } });
    throw err;
  }
}
