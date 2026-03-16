import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { campaignsApi, profilesApi } from '../api/client';
import { AppLayout } from '../components/layout/AppLayout';
import { Campaign, SenderProfile } from '../types';

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-pending',
  GENERATING: 'badge-generating',
  GENERATED: 'badge-generated',
  SENT: 'badge-sent',
  PARTIAL_SENT: 'badge-generating',
};

export function CampaignsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list().then(r => r.data),
  });
  const { data: profiles = [] } = useQuery<SenderProfile[]>({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.list().then(r => r.data),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', jobTitle: '', profileId: '', language: 'English', emailCount: 1 });

  const createCampaign = useMutation({
    mutationFn: () => campaignsApi.create({ ...form, emailCount: Number(form.emailCount), profileId: form.profileId || undefined }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      navigate(`/campaigns/${res.data.id}`);
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => campaignsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Projects</h1>
            <p className="text-sm text-gray-500 mt-0.5">Each project is a batch outreach job with multiple candidates</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
        </div>

        {showCreate && (
          <div className="card p-5 space-y-4 border-sky-200">
            <h2 className="font-semibold">New Project</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Project Name *</label>
                <input className="input" placeholder="Q1 Backend Engineers" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Job Title</label>
                <input className="input" placeholder="Senior Backend Engineer" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
              <div>
                <label className="label">Sender Profile</label>
                <select className="input" value={form.profileId} onChange={(e) => setForm({ ...form, profileId: e.target.value })}>
                  <option value="">Select profile...</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name} @ {p.company}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Language</label>
                <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  <option>English</option>
                  <option>Chinese (Simplified)</option>
                  <option>Japanese</option>
                  <option>Korean</option>
                  <option>German</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className="label">Emails per Candidate</label>
                <select className="input" value={form.emailCount} onChange={(e) => setForm({ ...form, emailCount: Number(e.target.value) })}>
                  <option value={1}>1 variant</option>
                  <option value={2}>2 variants</option>
                  <option value={3}>3 variants</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createCampaign.mutate()} disabled={!form.name || createCampaign.isPending}>
                {createCampaign.isPending ? 'Creating...' : 'Create & Add Candidates'}
              </button>
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
            {createCampaign.isError && (
              <p className="text-red-600 text-sm">{(createCampaign.error as any)?.response?.data?.error || 'Error creating project'}</p>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="text-4xl mb-3">📬</div>
            <p className="font-medium text-gray-700">No projects yet</p>
            <p className="text-sm text-gray-500 mt-1">Create your first project to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="card p-4 flex items-center justify-between hover:border-sky-200 cursor-pointer transition-colors" onClick={() => navigate(`/campaigns/${c.id}`)}>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <span className={STATUS_BADGE[c.status] || 'badge-pending'}>{c.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {c.jobTitle && <span className="mr-3">{c.jobTitle}</span>}
                      {c.profile && <span className="mr-3">via {c.profile.name}</span>}
                      <span>{c._count?.candidates || 0} candidates</span>
                      {(c._sentCount ?? 0) > 0 && (
                        <span className="ml-3 text-green-600 font-medium">
                          {c._replyCount ?? 0}/{c._sentCount} replied
                        </span>
                      )}
                      <span className="ml-3">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                  onClick={(e) => { e.stopPropagation(); if (confirm('Delete project?')) deleteCampaign.mutate(c.id); }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
