import React, { useState } from 'react';
import api from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    try {
      await api.post(`/auth/send-otp`, { phone });
      toast.success(t('auth.otp.sent'));
      setStep('otp');
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    try {
      const response = await api.post(`/auth/verify-otp`, { phone, otp });
      const data = response.data;

      // On sauvegarde le token de sécurité ici
      if (data.access_token) {
        localStorage.setItem('tipsy_token', data.access_token);
      }

      if (data.is_new_user) {
        // New user - go to profile setup
        sessionStorage.setItem('phone', phone);
        navigate('/profile-setup');
      } else {
        // Existing user - go to dashboard
        sessionStorage.setItem('server', JSON.stringify(data.server));
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-6">
      {/* Language switcher */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Back button */}
      <Button
        variant="ghost"
        className="absolute top-6 left-6 rounded-full"
        onClick={() => step === 'otp' ? setStep('phone') : navigate('/')}
        data-testid="auth-back-button"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="max-w-md w-full relative z-10">
        <Card className="glass-card p-8 rounded-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-quasimoda font-bold text-3xl">
              {step === 'phone' ? t('auth.title') : t('auth.otp.title')}
            </h1>
            <p className="text-muted-foreground">
              {step === 'phone' ? t('auth.subtitle') : `${t('auth.otp.subtitle')} ${phone}`}
            </p>
          </div>

          {/* Phone Form */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-6" data-testid="phone-form">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone.label')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('auth.phone.placeholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl h-14 text-lg"
                  data-testid="phone-input"
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t('auth.phone.help')}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full py-6 text-lg font-bold"
                disabled={loading || !phone}
                data-testid="send-otp-button"
              >
                {loading ? t('common.loading') : t('auth.send.otp')}
              </Button>
            </form>
          )}

          {/* OTP Form */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6" data-testid="otp-form">
              <div className="space-y-2">
                <Label htmlFor="otp">{t('auth.otp.label')}</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="rounded-xl h-14 text-lg text-center tracking-widest"
                  maxLength={6}
                  data-testid="otp-input"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-full py-6 text-lg font-bold"
                disabled={loading || otp.length !== 6}
                data-testid="verify-otp-button"
              >
                {loading ? t('common.loading') : t('auth.verify')}
              </Button>

              <button
                type="button"
                onClick={handleSendOTP}
                className="w-full text-sm text-primary hover:text-primary/80 transition-colors"
                data-testid="resend-otp-button"
              >
                {t('auth.resend')}
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;