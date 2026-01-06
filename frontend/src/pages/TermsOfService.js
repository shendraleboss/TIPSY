import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Footer } from '@/components/Footer';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const TermsOfService = () => {
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
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-muted-foreground">Dernière mise à jour : Janvier 2025</p>
          </div>

          <Card className="glass-card p-8 rounded-3xl space-y-6">
            <section className="space-y-3">
              <h2 className="font-unbounded font-bold text-xl text-white">1. Objet</h2>
              <p className="text-foreground/90 leading-relaxed">
                Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'utilisation de l'application Tipsy, permettant aux utilisateurs de recevoir et d'envoyer des pourboires numériques.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-unbounded font-bold text-xl text-white">2. Description du service</h2>
              <p className="text-foreground/90 leading-relaxed">Tipsy permet :</p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>aux serveurs / utilisateurs bénéficiaires de recevoir des pourboires numériques directement sur leur compte,</li>
                <li>aux clients / utilisateurs contributeurs d'envoyer un pourboire via un QR code ou un lien, sans création de compte obligatoire.</li>
              </ul>
              <p className="text-foreground/90 leading-relaxed mt-3">
                Tipsy agit uniquement comme intermédiaire technique et ne prend jamais possession des fonds destinés aux bénéficiaires.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-unbounded font-bold text-xl text-white">3. Accès au service</h2>
              <p className="text-foreground/90 leading-relaxed">L'accès à certaines fonctionnalités (réception de pourboires) nécessite :</p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>une inscription via numéro de téléphone,</li>
                <li>une vérification d'identité effectuée par le prestataire de paiement (Stripe).</li>
              </ul>
              <p className="text-foreground/90 leading-relaxed mt-3">
                L'envoi de pourboires ne nécessite pas de création de compte.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-unbounded font-bold text-xl text-white">4. Conditions financières</h2>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>Le bénéficiaire reçoit <strong className="text-primary">100 % du montant du pourboire</strong> choisi par le client.</li>
                <li>Tipsy prélève <strong className="text-primary">1 %</strong>, payé par le client.</li>
                <li>Des frais bancaires peuvent s'appliquer. Ils sont fixés par les réseaux de paiement et ne sont pas perçus par Tipsy.</li>
                <li>Le détail des montants est affiché avant validation du paiement.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-unbounded font-bold text-xl text-white">5. Responsabilité</h2>
              <p className="text-foreground/90 leading-relaxed">Tipsy ne saurait être tenu responsable :</p>
              <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                <li>des litiges entre utilisateurs,</li>
                <li>de l'utilisation faite des fonds reçus,</li>
                <li>des interruptions de service liées aux prestataires techniques (paiement, SMS, hébergement).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-unbounded font-bold text-xl text-white">6. Comportement des utilisateurs</h2>
              <p className="text-foreground/90 leading-relaxed">
                Tout usage frauduleux, abusif ou contraire à la loi entraînera la suspension ou la suppression du compte concerné.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-unbounded font-bold text-xl text-white">7. Modification du service</h2>
              <p className="text-foreground/90 leading-relaxed">
                Tipsy se réserve le droit de faire évoluer le service, ses fonctionnalités ou ses conditions à tout moment.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-unbounded font-bold text-xl text-white">8. Droit applicable</h2>
              <p className="text-foreground/90 leading-relaxed">
                Les présentes CGU sont soumises au droit suisse.
              </p>
            </section>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;