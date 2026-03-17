import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { authApi } from '../../api/client';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (token && !user) {
      authApi.me().then((res) => {
        setAuth(token, res.data);
      }).catch(() => {});
    }
  }, [token, user, setAuth]);

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
