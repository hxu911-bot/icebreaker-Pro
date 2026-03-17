import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { campaignsApi, profilesApi } from '../api/client';
import { AppLayout } from '../components/layout/AppLayout';
import { Campaign, SenderProfile } from '../types';
import { useT } from '../lib/i18n';

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
  const { t } = useT();
  const p = t.projects;

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
            <h1 className="text-xl font-semibold">{p.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{p.subtitle}</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>{p.newProject}</button>
        </div>

        {showCreate && (
          <div className="card p-5 space-y-4 border-sky-200">
            <h2 className="font-semibold">{p.newProjectTitle}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">{p.projectName}</label>
                <input className="input" placeholder={p.projectNamePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">{p.jobTitle}</label>
                <input className="input" placeholder={p.jobTitlePlaceholder} value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
              <div>
                <label className="label">{p.senderProfile}</label>
                <select className="input" value={form.profileId} onChange={(e) => setForm({ ...form, profileId: e.target.value })}>
                  <option value="">{p.selectProfile}</option>
                  {profiles.map(pr => <option key={pr.id} value={pr.id}>{pr.name} @ {pr.company}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{p.language}</label>
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
                <label className="label">{p.emailsPerCandidate}</label>
                <select className="input" value={form.emailCount} onChange={(e) => setForm({ ...form, emailCount: Number(e.target.value) })}>
                  <option value={1}>1 {p.variant}</option>
                  <option value={2}>2 {p.variant}</option>
                  <option value={3}>3 {p.variant}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => createCampaign.mutate()} disabled={!form.name || createCampaign.isPending}>
                {createCampaign.isPending ? p.creating : p.createBtn}
              </button>
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>{p.cancel}</button>
            </div>
            {createCampaign.isError && (
              <p className="text-red-600 text-sm">{(createCampaign.error as any)?.response?.data?.error || p.errorCreating}</p>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">{p.loading}</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="text-4xl mb-3">📬</div>
            <p className="font-medium text-gray-700">{p.noProjects}</p>
            <p className="text-sm text-gray-500 mt-1">{p.noProjectsSub}</p>
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
                      {c.profile && <span className="mr-3">{p.via}{c.profile.name}</span>}
                      <span>{c._count?.candidates || 0} {p.candidates}</span>
                      {(c._sentCount ?? 0) > 0 && (
                        <span className="ml-3 text-green-600 font-medium">
                          {c._replyCount ?? 0}/{c._sentCount} {p.replied}
                        </span>
                      )}
                      <span className="ml-3">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                  onClick={(e) => { e.stopPropagation(); if (confirm(p.deleteConfirm)) deleteCampaign.mutate(c.id); }}
                >
                  {p.delete}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
