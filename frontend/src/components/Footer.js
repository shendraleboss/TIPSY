import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Lock } from 'lucide-react';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="relative z-10 border-t border-white/10 bg-background/50 backdrop-blur-sm mt-20">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Security badges */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Stripe Secure</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 text-primary" />
            <span>SSL Encrypted</span>
          </div>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mb-4">
          <Link to="/terms" className="hover:text-primary transition-colors" data-testid="terms-link">
            {t('footer.terms')}
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-primary transition-colors" data-testid="privacy-link">
            {t('footer.privacy')}
          </Link>
          <span>•</span>
          <Link to="/legal" className="hover:text-primary transition-colors" data-testid="legal-link">
            {t('footer.legal')}
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-muted-foreground">
          © 2025 Tipsy. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};