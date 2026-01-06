import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QrCode, LogOut, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [server, setServer] = useState(null);
  const [stats, setStats] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const serverData = sessionStorage.getItem('server');
    if (!serverData) {
      navigate('/auth');
      return;
    }

    const parsedServer = JSON.parse(serverData);
    setServer(parsedServer);
    loadData(parsedServer.id);
  }, [navigate]);

  const loadData = async (serverId) => {
    setLoading(true);
    try {
      const [statsRes, tipsRes] = await Promise.all([
        axios.get(`${API}/servers/${serverId}/stats`),
        axios.get(`${API}/servers/${serverId}/tips`)
      ]);

      setStats(statsRes.data);
      setTips(tipsRes.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  if (!server) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-unbounded font-bold text-2xl">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">Hey, {server.first_name}!</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="rounded-full"
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="text-center py-12">{t('common.loading')}</div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-card p-6 rounded-3xl" data-testid="total-tips-card">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t('dashboard.total.tips')}</p>
                  <p className="font-unbounded font-bold text-3xl text-primary">
                    {stats?.total_tips || 0}{t('common.currency')}
                  </p>
                </div>
              </Card>

              <Card className="glass-card p-6 rounded-3xl" data-testid="tip-count-card">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t('dashboard.tip.count')}</p>
                  <p className="font-unbounded font-bold text-3xl text-secondary">
                    {stats?.tip_count || 0}
                  </p>
                </div>
              </Card>
            </div>

            <Card className="glass-card p-6 rounded-3xl" data-testid="average-tip-card">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('dashboard.average.tip')}</p>
                <p className="font-unbounded font-bold text-2xl">
                  {stats?.average_tip || 0}{t('common.currency')}
                </p>
              </div>
            </Card>

            {/* QR Code Button */}
            <Button
              className="w-full rounded-full py-6 text-lg font-bold"
              onClick={() => navigate('/qr-code')}
              data-testid="my-qr-button"
            >
              <QrCode className="mr-2 h-5 w-5" />
              {t('dashboard.my.qr')}
            </Button>

            {/* Recent Tips */}
            <div className="space-y-4">
              <h2 className="font-unbounded font-bold text-xl">{t('dashboard.recent.tips')}</h2>

              {tips.length === 0 ? (
                <Card className="glass-card p-6 rounded-3xl text-center" data-testid="no-tips-message">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('dashboard.no.tips')}</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {tips.map((tip, index) => (
                    <Card key={tip.id || index} className="glass-card p-4 rounded-2xl" data-testid={`tip-item-${index}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-unbounded font-bold text-lg">
                            {tip.amount}{t('common.currency')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tip.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-primary/20 p-3 rounded-xl">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;