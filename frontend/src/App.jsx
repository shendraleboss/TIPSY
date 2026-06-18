import './i18n';
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';

// Pages
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import ProfileSetup from '@/pages/ProfileSetup';
import Dashboard from '@/pages/Dashboard';
import QRCodePage from '@/pages/QRCodePage';
import TipPage from '@/pages/TipPage';
import TipSuccess from '@/pages/TipSuccess';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import LegalNotice from '@/pages/LegalNotice';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/qr-code" element={<QRCodePage />} />
          <Route path="/t/:serverId" element={<TipPage />} />
          <Route path="/tip-success" element={<TipSuccess />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal" element={<LegalNotice />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;