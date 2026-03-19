import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3200' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  register: (email: string, password: string) => api.post('/api/auth/register', { email, password }),
  me: () => api.get('/api/auth/me'),
};

// Settings
export const settingsApi = {
  get: () => api.get('/api/settings/'),
  saveDashscope: (dashscopeKey: string) => api.put('/api/settings/dashscope', { dashscopeKey }),
  saveSmtp: (data: any) => api.put('/api/settings/smtp', data),
  saveCooldown: (cooldownDays: number) => api.put('/api/settings/cooldown', { cooldownDays }),
  testSmtp: () => api.post('/api/send/test-smtp'),
};

// Profiles
export const profilesApi = {
  list: () => api.get('/api/profiles/'),
  create: (data: any) => api.post('/api/profiles/', data),
  update: (id: string, data: any) => api.put(`/api/profiles/${id}`, data),
  delete: (id: string) => api.delete(`/api/profiles/${id}`),
};

// Campaigns
export const campaignsApi = {
  list: () => api.get('/api/campaigns/'),
  get: (id: string) => api.get(`/api/campaigns/${id}`),
  create: (data: any) => api.post('/api/campaigns/', data),
  update: (id: string, data: any) => api.put(`/api/campaigns/${id}`, data),
  delete: (id: string) => api.delete(`/api/campaigns/${id}`),
  addCandidates: (id: string, candidates: any[]) => api.post(`/api/campaigns/${id}/candidates`, { candidates }),
  deleteCandidate: (candidateId: string) => api.delete(`/api/campaigns/candidates/${candidateId}`),
  getContactHistory: (id: string) => api.get(`/api/campaigns/${id}/contact-history`),
  updateCandidate: (candidateId: string, data: { name?: string; recruiterNote?: string; email?: string }) => api.put(`/api/campaigns/candidates/${candidateId}`, data),
  toggleReply: (candidateId: string) => api.put(`/api/campaigns/candidates/${candidateId}/reply`),
  markSent: (candidateId: string) => api.post(`/api/campaigns/candidates/${candidateId}/mark-sent`),
  unmarkSent: (candidateId: string) => api.post(`/api/campaigns/candidates/${candidateId}/unmark-sent`),
  requestRegen: (candidateId: string, reason: string) => api.post(`/api/campaigns/candidates/${candidateId}/request-regen`, { reason }),
};

// Parse
export const parseApi = {
  file: (file: File, dashscopeKey?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/api/parse/', fd);
  },
  csv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/api/parse-csv/', fd);
  },
  urls: (urls: string[]) => api.post('/api/parse/urls', { urls }),
};

// Generate
export const generateApi = {
  campaign: (campaignId: string, candidateIds?: string[]) => api.post(`/api/generate/campaign/${campaignId}`, { candidateIds }),
  approveEmail: (emailId: string) => api.put(`/api/generate/emails/${emailId}/approve`),
  unapproveEmail: (emailId: string) => api.put(`/api/generate/emails/${emailId}/unapprove`),
  updateEmail: (emailId: string, subject: string, body: string) => api.put(`/api/generate/emails/${emailId}`, { subject, body }),
  restyle: (emailId: string, style: string) => api.post(`/api/generate/emails/${emailId}/restyle`, { style }),
  regenerateCandidate: (candidateId: string) => api.post(`/api/generate/candidate/${candidateId}`),
};

// Send
export const sendApi = {
  campaign: (campaignId: string, force = false) => api.post(`/api/send/campaign/${campaignId}`, { force }),
};

// Admin
export const adminApi = {
  getStats: () => api.get('/api/admin/stats'),
};
