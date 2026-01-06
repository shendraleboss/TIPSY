import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Footer } from '@/components/Footer';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const PrivacyPolicy = () => {
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
            <h1 className="font-quasimoda font-bold text-3xl md:text-4xl text-white">
              Politique de Confidentialité
            </h1>
            <p className="text-muted-foreground">Dernière mise à jour : Janvier 2025</p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Shield className="h-5 w-5" />
                <span>RGPD Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary">
                <Lock className="h-5 w-5" />
                <span>Données Sécurisées</span>
              </div>
            </div>
          </div>

          <Card className="glass-card p-8 rounded-3xl space-y-6">
            <section className="space-y-3">
              <h2 className="font-quasimoda font-bold text-xl text-white">1. Données collectées</h2>
              <p className="text-foreground/90 leading-relaxed">
                Tipsy collecte uniquement les données strictement nécessaires au fonctionnement du service :
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Numéro de téléphone (authentification)</li>
                <li>Données de paiement (traitées exclusivement par Stripe)</li>
                <li>Informations de profil (prénom, photo facultative)</li>
                <li>Historique des transactions (montants, dates)</li>
              </ul>
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mt-4">
                <p className="text-primary font-medium flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Tipsy ne stocke aucune donnée bancaire.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-quasimoda font-bold text-xl text-white">2. Finalité du traitement</h2>
              <p className="text-foreground/90 leading-relaxed">Les données sont utilisées pour :</p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>permettre l'accès au service,</li>
                <li>assurer la réception et l'envoi de pourboires,</li>
                <li>garantir la sécurité et la conformité légale,</li>
                <li>améliorer l'expérience utilisateur.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-quasimoda font-bold text-xl text-white">3. Base légale</h2>
              <p className="text-foreground/90 leading-relaxed">Le traitement repose sur :</p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>l'exécution du contrat (utilisation du service),</li>
                <li>le consentement de l'utilisateur,</li>
                <li>les obligations légales (KYC, lutte contre la fraude).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-quasimoda font-bold text-xl text-white">4. Partage des données</h2>
              <p className="text-foreground/90 leading-relaxed">Les données peuvent être partagées uniquement avec :</p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li><strong>Stripe</strong> (paiement et vérification d'identité),</li>
                <li><strong>Twilio</strong> (authentification SMS),</li>
                <li>les prestataires techniques nécessaires au fonctionnement de l'application.</li>
              </ul>
              <p className="text-primary font-medium mt-3">
                Aucune donnée n'est vendue à des tiers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-quasimoda font-bold text-xl text-white">5. Durée de conservation</h2>
              <p className="text-foreground/90 leading-relaxed">Les données sont conservées :</p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>tant que le compte est actif,</li>
                <li>puis supprimées ou anonymisées selon les obligations légales.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-quasimoda font-bold text-xl text-white">6. Droits des utilisateurs</h2>
              <p className="text-foreground/90 leading-relaxed">
                Conformément au RGPD, chaque utilisateur dispose des droits suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Accès à ses données</li>
                <li>Rectification</li>
                <li>Suppression</li>
                <li>Opposition</li>
                <li>Portabilité</li>
              </ul>
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mt-4">
                <p className="text-foreground/90">
                  Toute demande peut être adressée à : <strong className="text-primary">privacy@tipsy.app</strong>
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-quasimoda font-bold text-xl text-white">7. Sécurité</h2>
              <p className="text-foreground/90 leading-relaxed">
                Tipsy met en œuvre toutes les mesures techniques et organisationnelles nécessaires pour protéger les données personnelles.
              </p>
            </section>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;