import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, QrCode, Wallet } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Language switcher */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <div className="max-w-md mx-auto px-6 py-12 relative z-10">
        <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <h1 className="font-unbounded font-black text-5xl md:text-6xl tracking-tight text-white">
              {t('landing.hero.title')}
            </h1>
            <p className="font-unbounded font-medium text-xl text-primary tracking-wide">
              {t('landing.hero.subtitle')}
            </p>
          </div>

          {/* Hero Image */}
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/10">
            <img
              src="https://customer-assets.emergentagent.com/job_tipsy-pay/artifacts/2fnej1fb_IMAGE1.png"
              alt="Tipsy Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>

          {/* Value Prop */}
          <p className="text-lg text-foreground/90 font-outfit leading-relaxed">
            {t('landing.hero.description')}
          </p>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full rounded-full py-7 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 active:scale-95"
            onClick={() => navigate('/auth')}
            data-testid="landing-cta-button"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {t('landing.hero.cta')}
          </Button>
        </div>

        {/* How it Works */}
        <div className="mt-20 space-y-8">
          <h2 className="font-unbounded font-bold text-3xl text-center text-white">
            {t('landing.how.title')}
          </h2>

          <div className="space-y-4">
            <Card className="glass-card p-6 rounded-3xl hover:border-primary/30 transition-all" data-testid="how-it-works-step-1">
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-2xl">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-unbounded font-medium text-lg mb-2 text-white">
                    {t('landing.how.step1.title')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('landing.how.step1.desc')}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 rounded-3xl hover:border-primary/30 transition-all" data-testid="how-it-works-step-2">
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-2xl">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-unbounded font-medium text-lg mb-2 text-white">
                    {t('landing.how.step2.title')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('landing.how.step2.desc')}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 rounded-3xl hover:border-primary/30 transition-all" data-testid="how-it-works-step-3">
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-2xl">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-unbounded font-medium text-lg mb-2 text-white">
                    {t('landing.how.step3.title')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('landing.how.step3.desc')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;