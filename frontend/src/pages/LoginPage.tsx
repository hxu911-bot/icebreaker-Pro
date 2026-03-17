import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/auth';
import { useT, LangToggle } from '../lib/i18n';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="absolute top-4 left-6">
        <Link to="/landing" className="text-sm text-gray-500 hover:text-sky-600 flex items-center gap-1">
          {t.auth.backToLanding}
        </Link>
      </div>
      <div className="absolute top-4 right-6">
        <LangToggle />
      </div>
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-sky-600">Icebreaker</h1>
          <p className="text-sm text-gray-500 mt-1">Demo v2 — Batch Recruitment Emails</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t.auth.email}</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t.auth.password}</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t.auth.loggingIn : t.auth.loginBtn}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {t.auth.noAccount} <Link to="/register" className="text-sky-600 hover:underline">{t.common.register}</Link>
        </p>
      </div>
    </div>
  );
}
