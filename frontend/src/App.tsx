import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { LandingPage } from './pages/LandingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/campaigns/:id" element={<RequireAuth><CampaignDetailPage /></RequireAuth>} />
      <Route path="/" element={<RequireAuth><CampaignsPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
