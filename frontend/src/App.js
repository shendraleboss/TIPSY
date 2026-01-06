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
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;