import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Footer } from '@/components/Footer';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const LegalNotice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      <Button
        variant="ghost"
        className="absolute top-6 left-6 rounded-full z-50"
        onClick={() => navigate('/')}
        data-testid="back-button"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="flex-1 max-w-3xl mx-auto px-6 py-20 relative z-10">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="font-unbounded font-bold text-3xl md:text-4xl text-white">
              Mentions Légales
            </h1>
            <p className="text-muted-foreground">Informations légales et contacts</p>
          </div>

          <Card className="glass-card p-8 rounded-3xl space-y-8">
            <section className="space-y-4">
              <div className="space-y-2">
                <h2 className="font-unbounded font-bold text-xl text-white">Nom du service</h2>
                <p className="text-foreground/90 text-lg">Tipsy</p>
              </div>

              <div className="space-y-2">
                <h2 className="font-unbounded font-bold text-xl text-white">Éditeur</h2>
                <p className="text-foreground/90">Tipsy</p>
              </div>

              <div className="space-y-2">
                <h2 className="font-unbounded font-bold text-xl text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Adresse
                </h2>
                <p className="text-foreground/90">Genève, Suisse</p>
              </div>

              <div className="space-y-2">
                <h2 className="font-unbounded font-bold text-xl text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact
                </h2>
                <a href="mailto:contact@tipsy.app" className="text-primary hover:text-primary/80 transition-colors">
                  contact@tipsy.app
                </a>
              </div>
            </section>

            <div className="border-t border-white/10 pt-6">
              <section className="space-y-3">
                <h2 className="font-unbounded font-bold text-xl text-white">Hébergement</h2>
                <p className="text-foreground/90 leading-relaxed">
                  L'application est hébergée sur l'infrastructure Emergent Agent.
                </p>
              </section>
            </div>

            <div className="border-t border-white/10 pt-6">
              <section className="space-y-3">
                <h2 className="font-unbounded font-bold text-xl text-white">Paiements</h2>
                <p className="text-foreground/90 leading-relaxed">
                  Les paiements sont opérés par <strong className="text-primary">Stripe</strong>, prestataire de paiement certifié PCI-DSS.
                </p>
                <a 
                  href="https://stripe.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-primary hover:text-primary/80 transition-colors text-sm"
                >
                  En savoir plus sur Stripe →
                </a>
              </section>
            </div>

            <div className="border-t border-white/10 pt-6">
              <section className="space-y-3">
                <h2 className="font-unbounded font-bold text-xl text-white">Propriété intellectuelle</h2>
                <p className="text-foreground/90 leading-relaxed">
                  L'ensemble des éléments de l'application Tipsy (design, contenu, code) est protégé par le droit d'auteur. Toute reproduction non autorisée est interdite.
                </p>
              </section>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LegalNotice;