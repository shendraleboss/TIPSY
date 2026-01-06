import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Sparkles, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TipSuccess = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [status, setStatus] = useState('checking');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    pollPaymentStatus();
  }, [sessionId]);

  const pollPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/tips/checkout-status/${sessionId}`);
      const data = response.data;

      if (data.payment_status === 'paid') {
        setStatus('success');
        return;
      } else if (data.status === 'expired') {
        setStatus('expired');
        return;
      }

      setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-6">
      <div className="max-w-md w-full relative z-10">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
          {status === 'checking' && (
            <Card className="glass-card p-12 rounded-3xl" data-testid="processing-status">
              <div className="animate-pulse">
                <Sparkles className="h-16 w-16 text-primary mx-auto mb-6" />
                <p className="text-lg text-muted-foreground">{t('success.processing')}</p>
              </div>
            </Card>
          )}

          {status === 'success' && (
            <Card className="glass-card p-12 rounded-3xl space-y-6" data-testid="success-status">
              <div className="bg-primary/20 p-6 rounded-full w-fit mx-auto">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="font-quasimoda font-bold text-4xl">{t('success.title')}</h1>
                <p className="text-xl text-muted-foreground">{t('success.subtitle')}</p>
              </div>
              <div className="pt-6 border-t border-white/10">
                <p className="font-quasimoda font-medium text-lg text-secondary">
                  {t('success.slogan')}
                </p>
              </div>
            </Card>
          )}

          {(status === 'error' || status === 'timeout' || status === 'expired') && (
            <Card className="glass-card p-12 rounded-3xl" data-testid="error-status">
              <p className="text-lg text-destructive">{t('common.error')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TipSuccess;