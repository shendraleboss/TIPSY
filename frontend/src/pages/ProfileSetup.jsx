import React, { useState } from 'react';
import api from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';


const ProfileSetup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const phone = sessionStorage.getItem('phone');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !phone) return;

    setLoading(true);
    try {
      const response = await api.post(`/servers/profile`, {
        phone,
        first_name: firstName,
        photo_url: photoUrl || null
      });

      sessionStorage.setItem('server', JSON.stringify(response.data));
      sessionStorage.removeItem('phone');
      toast.success('Profile created!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full relative z-10">
        <Card className="glass-card p-8 rounded-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h1 className="font-quasimoda font-bold text-3xl">{t('profile.setup.title')}</h1>
            <p className="text-muted-foreground">{t('profile.setup.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="profile-setup-form">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('profile.first.name')}</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-xl h-14 text-lg"
                data-testid="first-name-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl">{t('profile.photo.url')}</Label>
              <Input
                id="photoUrl"
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="rounded-xl h-14 text-lg"
                data-testid="photo-url-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full py-6 text-lg font-bold"
              disabled={loading || !firstName}
              data-testid="save-profile-button"
            >
              {loading ? t('common.loading') : t('profile.save')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;