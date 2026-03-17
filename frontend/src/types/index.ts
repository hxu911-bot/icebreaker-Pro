export interface User {
  id: string;
  email: string;
  hasDashscopeKey: boolean;
  hasSmtp: boolean;
  isAdmin?: boolean;
}

export interface AdminStats {
  totalUsers: number;
  userGrowth: { date: string; count: number }[];
  perUserStats: { email: string; createdAt: string; projectCount: number; emailsGenerated: number }[];
}

export interface SenderProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  role: string;
  signature: string;
  personalNote?: string;
  isDefault: boolean;
}

export interface GeneratedEmail {
  id: string;
  subject: string;
  body: string;
  style: string;
  approved: boolean;
}

export interface SendLog {
  id: string;
  toEmail: string;
  status: string;
  error?: string;
  sentAt: string;
}

export interface Candidate {
  id: string;
  name?: string;
  email?: string;
  rawText: string;
  source: string;
  status: string;
  recruiterNote?: string;
  replied: boolean;
  repliedAt?: string;
  sentCount: number;
  regenRequestedAt?: string;
  regenReason?: string;
  emails: GeneratedEmail[];
  sendLogs: SendLog[];
}

export interface Campaign {
  id: string;
  name: string;
  jobTitle?: string;
  style: string;
  language: string;
  emailCount: number;
  status: string;
  createdAt: string;
  profile?: SenderProfile;
  candidates: Candidate[];
  _count?: { candidates: number };
  _replyCount?: number;
  _sentCount?: number;
}

export interface ContactHistoryEntry {
  sentAt: string;
  campaignName: string;
  campaignId: string;
  daysAgo: number;
}

export interface CooldownWarning {
  email: string;
  sentAt: string;
  campaignName: string;
  campaignId: string;
  daysAgo: number;
}
