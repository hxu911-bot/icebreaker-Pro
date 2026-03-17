import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, profilesApi, adminApi } from '../api/client';
import { AppLayout } from '../components/layout/AppLayout';
import { SenderProfile, AdminStats } from '../types';
import { useAuthStore } from '../store/auth';
import { useT } from '../lib/i18n';

export function SettingsPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const s = t.settings;
  const a = t.admin;
  const cd = t.cooldown;

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then(r => r.data) });
  const { data: profiles = [] } = useQuery<SenderProfile[]>({ queryKey: ['profiles'], queryFn: () => profilesApi.list().then(r => r.data) });
  const { data: adminStats, isLoading: adminLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then(r => r.data),
    enabled: !!user?.isAdmin,
  });

  const [cooldownDays, setCooldownDays] = useState<number>(90);
  const [dashscopeKey, setDashscopeKey] = useState('');
  const [smtp, setSmtp] = useState({ smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', smtpFrom: '' });
  const [smtpStatus, setSmtpStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [smtpError, setSmtpError] = useState('');
  const [profile, setProfile] = useState({ name: '', title: '', company: '', role: 'Recruiter', signature: '', personalNote: '', isDefault: false });
  const [msg, setMsg] = useState('');
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; title: string; company: string; role: string; signature: string; personalNote: string; isDefault: boolean } | null>(null);

  useEffect(() => {
    if (settings?.cooldownDays) setCooldownDays(settings.cooldownDays);
  }, [settings?.cooldownDays]);

  const saveCooldown = useMutation({
    mutationFn: () => settingsApi.saveCooldown(cooldownDays),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); setMsg('Cooldown saved'); },
  });

  const saveDashscope = useMutation({
    mutationFn: () => settingsApi.saveDashscope(dashscopeKey),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); setMsg('DashScope key saved'); setDashscopeKey(''); },
  });

  const saveSmtp = useMutation({
    mutationFn: () => settingsApi.saveSmtp(smtp),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); setMsg('SMTP saved'); },
  });

  const createProfile = useMutation({
    mutationFn: () => profilesApi.create(profile),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profiles'] }); setMsg('Profile created'); setProfile({ name: '', title: '', company: '', role: 'Recruiter', signature: '', personalNote: '', isDefault: false }); },
  });

  const deleteProfile = useMutation({
    mutationFn: (id: string) => profilesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });

  const updateProfile = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => profilesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profiles'] }); setMsg('Profile updated'); setEditingProfileId(null); setEditForm(null); },
  });

  async function testSmtp() {
    setSmtpStatus('testing');
    setSmtpError('');
    try {
      await settingsApi.testSmtp();
      setSmtpStatus('ok');
    } catch (err: any) {
      setSmtpStatus('error');
      setSmtpError(err.response?.data?.error || 'Connection failed');
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-xl font-semibold">{s.title}</h1>
        {msg && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">{msg}</div>}

        {/* DashScope */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{s.dashscopeTitle}</h2>
            {settings?.hasDashscopeKey && <span className="badge-generated">{s.configured}{settings.dashscopeKeyPreview}</span>}
          </div>
          <div className="flex gap-2">
            <input className="input flex-1" type="password" placeholder={s.dashscopePlaceholder} value={dashscopeKey} onChange={(e) => setDashscopeKey(e.target.value)} />
            <button className="btn-primary" onClick={() => saveDashscope.mutate()} disabled={!dashscopeKey}>{s.dashscopeSave}</button>
          </div>
        </div>

        {/* Cooldown */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold">{cd.title}</h2>
          <p className="text-xs text-gray-500">{cd.desc}</p>
          <div className="flex items-center gap-3">
            <select
              className="input w-48"
              value={cooldownDays}
              onChange={(e) => setCooldownDays(Number(e.target.value))}
            >
              {([15, 30, 45, 90] as const).map((d) => (
                <option key={d} value={d}>{(cd.options as any)[d]}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={() => saveCooldown.mutate()} disabled={saveCooldown.isPending}>
              {cd.save}
            </button>
          </div>
        </div>

        {/* SMTP */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{s.smtpTitle}</h2>
            {settings?.hasSmtp && <span className="badge-generated">{s.configured}{settings.smtpHost}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">{s.smtpHost}</label>
              <input className="input" placeholder={s.smtpHostPlaceholder} value={smtp.smtpHost} onChange={(e) => setSmtp({ ...smtp, smtpHost: e.target.value })} />
            </div>
            <div>
              <label className="label">{s.smtpPort}</label>
              <input className="input" type="number" placeholder="587" value={smtp.smtpPort} onChange={(e) => setSmtp({ ...smtp, smtpPort: e.target.value })} />
            </div>
            <div>
              <label className="label">{s.smtpUser}</label>
              <input className="input" placeholder={s.smtpUserPlaceholder} value={smtp.smtpUser} onChange={(e) => setSmtp({ ...smtp, smtpUser: e.target.value })} />
            </div>
            <div>
              <label className="label">{s.smtpPass}</label>
              <input className="input" type="password" value={smtp.smtpPass} onChange={(e) => setSmtp({ ...smtp, smtpPass: e.target.value })} />
            </div>
            <div>
              <label className="label">{s.smtpFrom}</label>
              <input className="input" placeholder={s.smtpFromPlaceholder} value={smtp.smtpFrom} onChange={(e) => setSmtp({ ...smtp, smtpFrom: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => saveSmtp.mutate()}>{s.saveSmtp}</button>
            <button className="btn-secondary" onClick={testSmtp} disabled={smtpStatus === 'testing'}>
              {smtpStatus === 'testing' ? s.testing : s.testConnection}
            </button>
            {smtpStatus === 'ok' && <span className="text-green-600 text-sm self-center">{s.connected}</span>}
            {smtpStatus === 'error' && <span className="text-red-600 text-sm self-center">{smtpError}</span>}
          </div>
          <p className="text-xs text-gray-400">{s.smtpNote}</p>
        </div>

        {/* Sender Profiles */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">{s.profilesTitle}</h2>
          {profiles.length > 0 && (
            <div className="space-y-2">
              {profiles.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Profile row */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                    <div className="min-w-0">
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-gray-500 text-xs ml-2">{p.title} @ {p.company}</span>
                      {p.isDefault && <span className="ml-2 text-xs text-sky-600 font-medium">{s.default}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        className="text-xs text-sky-500 hover:text-sky-700"
                        onClick={() => {
                          if (expandedPreviewId === p.id) { setExpandedPreviewId(null); } else {
                            setExpandedPreviewId(p.id); setEditingProfileId(null); setEditForm(null);
                          }
                        }}
                      >{s.preview}</button>
                      <button
                        className="text-xs text-gray-500 hover:text-gray-700"
                        onClick={() => {
                          if (editingProfileId === p.id) { setEditingProfileId(null); setEditForm(null); } else {
                            setEditingProfileId(p.id);
                            setEditForm({ name: p.name, title: p.title, company: p.company, role: p.role, signature: p.signature, personalNote: p.personalNote || '', isDefault: p.isDefault });
                            setExpandedPreviewId(null);
                          }
                        }}
                      >{s.edit}</button>
                      <button className="text-xs text-red-400 hover:text-red-600" onClick={() => deleteProfile.mutate(p.id)}>{s.remove}</button>
                    </div>
                  </div>

                  {/* Preview panel */}
                  {expandedPreviewId === p.id && (
                    <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.signaturePreviewTitle}</p>
                      <div className="border border-dashed border-gray-200 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50">
                        {p.signature || <span className="text-gray-300">（未填写签名）</span>}
                      </div>
                      {p.personalNote && (
                        <p className="text-xs text-gray-400">💡 Personal context (AI only, not in email): {p.personalNote}</p>
                      )}
                    </div>
                  )}

                  {/* Inline edit form */}
                  {editingProfileId === p.id && editForm && (
                    <div className="px-4 py-4 bg-white border-t border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="label">{s.name}</label>
                          <input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div><label className="label">{s.titleLabel}</label>
                          <input className="input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                        </div>
                        <div><label className="label">{s.company}</label>
                          <input className="input" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} />
                        </div>
                        <div><label className="label">{s.role}</label>
                          <select className="input" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                            <option>Recruiter</option><option>Hiring Manager</option><option>Founder</option><option>HR Partner</option>
                          </select>
                        </div>
                        <div className="col-span-2"><label className="label">{s.signature}</label>
                          <textarea className="input resize-none" rows={3} value={editForm.signature} onChange={e => setEditForm({ ...editForm, signature: e.target.value })} />
                        </div>
                        <div className="col-span-2"><label className="label">{s.personalNote}</label>
                          <textarea className="input resize-none" rows={2} placeholder={s.personalNotePlaceholder} value={editForm.personalNote} onChange={e => setEditForm({ ...editForm, personalNote: e.target.value })} />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <input type="checkbox" id={`isDefault-${p.id}`} checked={editForm.isDefault} onChange={e => setEditForm({ ...editForm, isDefault: e.target.checked })} />
                          <label htmlFor={`isDefault-${p.id}`} className="text-sm">{s.setDefault}</label>
                        </div>
                      </div>
                      {/* Live preview */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.signaturePreviewTitle}</p>
                        <div className="border border-dashed border-gray-200 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50">
                          {editForm.signature || <span className="text-gray-300">在上方填写签名内容...</span>}
                        </div>
                        {editForm.personalNote && (
                          <p className="text-xs text-gray-400">💡 Personal context (AI only, not in email): {editForm.personalNote}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-primary" onClick={() => updateProfile.mutate({ id: p.id, data: editForm })} disabled={!editForm.name || !editForm.title || !editForm.company || !editForm.signature}>{s.saveChanges}</button>
                        <button className="btn-secondary" onClick={() => { setEditingProfileId(null); setEditForm(null); }}>{t.common.cancel}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">{s.addProfile}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{s.name}</label>
                <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label className="label">{s.titleLabel}</label>
                <input className="input" placeholder={s.titlePlaceholder} value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} />
              </div>
              <div>
                <label className="label">{s.company}</label>
                <input className="input" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
              </div>
              <div>
                <label className="label">{s.role}</label>
                <select className="input" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })}>
                  <option>Recruiter</option>
                  <option>Hiring Manager</option>
                  <option>Founder</option>
                  <option>HR Partner</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">{s.signature}</label>
                <textarea className="input resize-none" rows={3} placeholder={s.signaturePlaceholder} value={profile.signature} onChange={(e) => setProfile({ ...profile, signature: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">{s.personalNote}</label>
                <textarea className="input resize-none" rows={2} placeholder={s.personalNotePlaceholder} value={profile.personalNote} onChange={(e) => setProfile({ ...profile, personalNote: e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={profile.isDefault} onChange={(e) => setProfile({ ...profile, isDefault: e.target.checked })} />
                <label htmlFor="isDefault" className="text-sm">{s.setDefault}</label>
              </div>
            </div>
            <button className="btn-primary" onClick={() => createProfile.mutate()} disabled={!profile.name || !profile.title || !profile.company || !profile.signature}>
              {s.addProfileBtn}
            </button>
          </div>
        </div>

        {/* Admin Stats */}
        {user?.isAdmin && (
          <div className="card p-5 space-y-4 border-amber-200 bg-amber-50">
            <h2 className="font-semibold text-amber-800">🔐 {a.title}</h2>
            {adminLoading ? (
              <p className="text-sm text-gray-500">{a.loading}</p>
            ) : adminStats ? (
              <>
                <div className="text-sm">
                  <span className="font-medium">{a.totalUsers}:</span>{' '}
                  <span className="text-2xl font-bold text-sky-600">{adminStats.totalUsers}</span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{a.userGrowth}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-3 py-2">{a.date}</th>
                          <th className="text-right px-3 py-2">{a.newUsers}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminStats.userGrowth.map((row) => (
                          <tr key={row.date} className="border-t border-gray-100 bg-white">
                            <td className="px-3 py-2">{row.date}</td>
                            <td className="px-3 py-2 text-right font-medium">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{a.perUserStats}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-3 py-2">{a.emailCol}</th>
                          <th className="text-left px-3 py-2">{a.joinedCol}</th>
                          <th className="text-right px-3 py-2">{a.projectsCol}</th>
                          <th className="text-right px-3 py-2">{a.emailsCol}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminStats.perUserStats.map((row) => (
                          <tr key={row.email} className="border-t border-gray-100 bg-white">
                            <td className="px-3 py-2">{row.email}</td>
                            <td className="px-3 py-2 text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-right">{row.projectCount}</td>
                            <td className="px-3 py-2 text-right font-medium">{row.emailsGenerated}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
