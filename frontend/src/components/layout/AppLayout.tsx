import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const navItems = [
    { label: 'Projects', href: '/' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-sky-600 text-lg">Icebreaker</span>
          <span className="text-xs text-gray-400 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">Demo v2</span>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Logout
        </button>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {children}
      </main>
      <footer className="py-3 text-center text-xs text-gray-400 border-t border-gray-100">
        Icebreaker Demo — Batch AI Recruitment Emails
      </footer>
    </div>
  );
}
