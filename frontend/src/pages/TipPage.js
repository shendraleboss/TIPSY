import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TipPage = () => {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadServer();
  }, [serverId]);

  const loadServer = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/servers/${serverId}`);
      setServer(response.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [5, 10, 20, 50];

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  const getFinalAmount = () => {
    return customAmount ? parseFloat(customAmount) : selectedAmount;
  };

  const handleContinue = () => {
    const amount = getFinalAmount();
    if (!amount || amount <= 0) {
      toast.error('Please select or enter an amount');
      return;
    }

    // Calculate breakdown
    const tipAmount = amount;
    const tipsyFee = Math.round(tipAmount * 0.01 * 100) / 100;
    const stripeFee = Math.round((tipAmount * 0.029 + 0.30) * 100) / 100;
    const total = Math.round((tipAmount + tipsyFee + stripeFee) * 100) / 100;

    setBreakdown({
      tip: tipAmount,
      tipsyFee,
      stripeFee,
      total
    });
    setShowBreakdown(true);
  };

  const handlePayNow = async () => {
    setProcessingPayment(true);
    try {
      const response = await axios.post(`${API}/tips/create-checkout`, {
        server_id: serverId,
        amount: breakdown.tip,
        host_url: window.location.origin
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(t('common.error'));
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="glass-card p-8 rounded-3xl text-center">
          <p className="text-lg">{t('common.error')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md mx-auto px-6 py-12 relative z-10">
        {!showBreakdown ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Server Info */}
            <div className="text-center space-y-4">
              {server.photo_url && (
                <img
                  src={server.photo_url}
                  alt={server.first_name}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-primary"
                />
              )}
              <div>
                <h1 className="font-unbounded font-bold text-3xl">
                  {t('tip.title')} {server.first_name}
                </h1>
                <p className="text-muted-foreground mt-2">{t('tip.select.amount')}</p>
              </div>
            </div>

            {/* Preset Amounts */}
            <div className="grid grid-cols-2 gap-4" data-testid="preset-amounts">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountSelect(amount)}
                  className={`glass-card p-6 rounded-3xl transition-all hover:scale-105 active:scale-95 ${
                    selectedAmount === amount
                      ? 'border-2 border-primary bg-primary/10'
                      : 'border border-white/10 hover:border-primary/50'
                  }`}
                  data-testid={`preset-amount-${amount}`}
                >
                  <p className="font-unbounded font-bold text-3xl">
                    {amount}{t('common.currency')}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">{t('tip.or')}</p>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={`${t('tip.custom')} (${t('common.currency')})`}
                value={customAmount}
                onChange={handleCustomAmountChange}
                className="rounded-xl h-14 text-lg text-center"
                data-testid="custom-amount-input"
              />
            </div>

            {/* Continue Button */}
            <Button
              className="w-full rounded-full py-6 text-lg font-bold"
              onClick={handleContinue}
              disabled={!getFinalAmount()}
              data-testid="continue-to-payment-button"
            >
              {t('tip.continue')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Payment Breakdown */}
            <div className="text-center space-y-2">
              <h1 className="font-unbounded font-bold text-2xl">{t('tip.breakdown.title')}</h1>
            </div>

            <Card className="glass-card p-6 rounded-3xl space-y-4" data-testid="payment-breakdown">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('tip.breakdown.tip')}</span>
                <span className="font-unbounded font-bold text-lg">
                  {breakdown.tip.toFixed(2)}{t('common.currency')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('tip.breakdown.tipsy')}</span>
                <span className="text-primary">
                  +{breakdown.tipsyFee.toFixed(2)}{t('common.currency')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t('tip.breakdown.bank')}</span>
                <span className="text-muted-foreground">
                  +{breakdown.stripeFee.toFixed(2)}{t('common.currency')}
                </span>
              </div>

              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-unbounded font-bold text-lg">{t('tip.breakdown.total')}</span>
                  <span className="font-unbounded font-bold text-2xl text-primary">
                    {breakdown.total.toFixed(2)}{t('common.currency')}
                  </span>
                </div>
                <p className="text-sm text-secondary text-center">
                  <Sparkles className="inline h-4 w-4 mr-1" />
                  {t('tip.breakdown.server.receives')} ({breakdown.tip.toFixed(2)}{t('common.currency')})
                </p>
              </div>
            </Card>

            <p className="text-xs text-muted-foreground text-center px-4">
              {t('tip.transparency.note')}
            </p>

            <div className="space-y-3">
              <Button
                className="w-full rounded-full py-6 text-lg font-bold"
                onClick={handlePayNow}
                disabled={processingPayment}
                data-testid="pay-now-button"
              >
                {processingPayment ? t('common.loading') : t('tip.pay.now')}
              </Button>

              <Button
                variant="outline"
                className="w-full rounded-full py-6"
                onClick={() => setShowBreakdown(false)}
                data-testid="back-to-amount-button"
              >
                {t('common.back')}
              </Button>
            </div>
          </div>
        )}

        {/* Branding */}
        <div className="mt-12 text-center">
          <p className="font-unbounded font-medium text-sm text-muted-foreground">
            Powered by <span className="text-primary">Tipsy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TipPage;