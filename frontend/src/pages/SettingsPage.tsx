import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, profilesApi } from '../api/client';
import { AppLayout } from '../components/layout/AppLayout';
import { SenderProfile } from '../types';

export function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get().then(r => r.data) });
  const { data: profiles = [] } = useQuery<SenderProfile[]>({ queryKey: ['profiles'], queryFn: () => profilesApi.list().then(r => r.data) });

  const [dashscopeKey, setDashscopeKey] = useState('');
  const [smtp, setSmtp] = useState({ smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', smtpFrom: '' });
  const [smtpStatus, setSmtpStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [smtpError, setSmtpError] = useState('');
  const [profile, setProfile] = useState({ name: '', title: '', company: '', role: 'Recruiter', signature: '', personalNote: '', isDefault: false });
  const [msg, setMsg] = useState('');

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
        <h1 className="text-xl font-semibold">Settings</h1>
        {msg && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">{msg}</div>}

        {/* DashScope */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">DashScope API Key</h2>
            {settings?.hasDashscopeKey && <span className="badge-generated">Configured: {settings.dashscopeKeyPreview}</span>}
          </div>
          <div className="flex gap-2">
            <input className="input flex-1" type="password" placeholder="sk-..." value={dashscopeKey} onChange={(e) => setDashscopeKey(e.target.value)} />
            <button className="btn-primary" onClick={() => saveDashscope.mutate()} disabled={!dashscopeKey}>Save</button>
          </div>
        </div>

        {/* SMTP */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">SMTP Configuration</h2>
            {settings?.hasSmtp && <span className="badge-generated">Configured: {settings.smtpHost}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">SMTP Host</label>
              <input className="input" placeholder="smtp.gmail.com" value={smtp.smtpHost} onChange={(e) => setSmtp({ ...smtp, smtpHost: e.target.value })} />
            </div>
            <div>
              <label className="label">Port</label>
              <input className="input" type="number" placeholder="587" value={smtp.smtpPort} onChange={(e) => setSmtp({ ...smtp, smtpPort: e.target.value })} />
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input" placeholder="you@gmail.com" value={smtp.smtpUser} onChange={(e) => setSmtp({ ...smtp, smtpUser: e.target.value })} />
            </div>
            <div>
              <label className="label">Password / App Password</label>
              <input className="input" type="password" value={smtp.smtpPass} onChange={(e) => setSmtp({ ...smtp, smtpPass: e.target.value })} />
            </div>
            <div>
              <label className="label">From Address (optional)</label>
              <input className="input" placeholder="Your Name <you@gmail.com>" value={smtp.smtpFrom} onChange={(e) => setSmtp({ ...smtp, smtpFrom: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => saveSmtp.mutate()}>Save SMTP</button>
            <button className="btn-secondary" onClick={testSmtp} disabled={smtpStatus === 'testing'}>
              {smtpStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
            {smtpStatus === 'ok' && <span className="text-green-600 text-sm self-center">Connected</span>}
            {smtpStatus === 'error' && <span className="text-red-600 text-sm self-center">{smtpError}</span>}
          </div>
          <p className="text-xs text-gray-400">For Gmail: use App Password (not account password). Enable 2FA first.</p>
        </div>

        {/* Sender Profiles */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Sender Profiles</h2>
          {profiles.length > 0 && (
            <div className="space-y-2">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className="text-gray-500 text-xs ml-2">{p.title} @ {p.company}</span>
                    {p.isDefault && <span className="ml-2 text-xs text-sky-600">default</span>}
                  </div>
                  <button className="text-xs text-red-500 hover:text-red-700" onClick={() => deleteProfile.mutate(p.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Add Profile</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="Senior Recruiter" value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Company *</label>
                <input className="input" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })}>
                  <option>Recruiter</option>
                  <option>Hiring Manager</option>
                  <option>Founder</option>
                  <option>HR Partner</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Signature *</label>
                <input className="input" placeholder="Best, John | Acme Corp" value={profile.signature} onChange={(e) => setProfile({ ...profile, signature: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">Personal Note (optional)</label>
                <input className="input" placeholder="Context about your team or role..." value={profile.personalNote} onChange={(e) => setProfile({ ...profile, personalNote: e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={profile.isDefault} onChange={(e) => setProfile({ ...profile, isDefault: e.target.checked })} />
                <label htmlFor="isDefault" className="text-sm">Set as default</label>
              </div>
            </div>
            <button className="btn-primary" onClick={() => createProfile.mutate()} disabled={!profile.name || !profile.title || !profile.company || !profile.signature}>
              Add Profile
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
