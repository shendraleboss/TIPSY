import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Landing
      'landing.hero.title': 'Get Tipsy',
      'landing.hero.subtitle': 'Because you deserve it.',
      'landing.hero.description': '100% of tips go directly to you. No employer, no middleman. Just fair tips.',
      'landing.hero.cta': 'Start Earning',
      'landing.how.title': 'How it works',
      'landing.how.step1.title': 'Create your profile',
      'landing.how.step1.desc': 'Sign up in under 2 minutes',
      'landing.how.step2.title': 'Get your QR code',
      'landing.how.step2.desc': 'Print it or show it on your phone',
      'landing.how.step3.title': 'Receive tips',
      'landing.how.step3.desc': '100% of every tip goes to you',
      
      // Auth
      'auth.title': 'Welcome to Tipsy',
      'auth.subtitle': 'Enter your phone number to continue',
      'auth.phone.label': 'Phone Number',
      'auth.phone.placeholder': '+33 6 12 34 56 78',
      'auth.send.otp': 'Send Code',
      'auth.otp.title': 'Enter verification code',
      'auth.otp.subtitle': 'We sent a code to',
      'auth.otp.label': 'Verification Code',
      'auth.verify': 'Verify',
      'auth.resend': 'Resend code',
      
      // Profile Setup
      'profile.setup.title': 'Create Your Profile',
      'profile.setup.subtitle': 'Let customers know who they\'re tipping',
      'profile.first.name': 'First Name',
      'profile.photo.url': 'Photo URL (optional)',
      'profile.save': 'Save Profile',
      
      // Dashboard
      'dashboard.title': 'Your Dashboard',
      'dashboard.total.tips': 'Total Tips',
      'dashboard.tip.count': 'Tips Received',
      'dashboard.average.tip': 'Average Tip',
      'dashboard.recent.tips': 'Recent Tips',
      'dashboard.no.tips': 'No tips yet. Share your QR code to start earning!',
      'dashboard.my.qr': 'My QR Code',
      'dashboard.logout': 'Logout',
      
      // QR Code
      'qr.title': 'Your QR Code',
      'qr.subtitle': 'Share this with customers to receive tips',
      'qr.download': 'Download QR',
      'qr.share': 'Share Link',
      'qr.link.copied': 'Link copied!',
      
      // Tip Page (Customer)
      'tip.title': 'Tip',
      'tip.select.amount': 'Select tip amount',
      'tip.custom': 'Custom',
      'tip.or': 'or',
      'tip.continue': 'Continue',
      'tip.breakdown.title': 'Payment Breakdown',
      'tip.breakdown.tip': 'Tip',
      'tip.breakdown.tipsy': 'Tipsy (1%)',
      'tip.breakdown.bank': 'Bank fees',
      'tip.breakdown.total': 'Total paid',
      'tip.breakdown.server.receives': 'Server receives 100%',
      'tip.pay.now': 'Pay Now',
      'tip.transparency.note': 'Tipsy only takes 1%. Bank fees are set by payment networks, not by us.',
      
      // Success
      'success.title': 'Thank You!',
      'success.subtitle': 'Your tip has been sent',
      'success.slogan': 'Get Tipsy. Because you deserve it.',
      'success.processing': 'Processing payment...',
      
      // Common
      'common.back': 'Back',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.currency': '€',
      
      // Footer
      'footer.terms': 'Terms of Service',
      'footer.privacy': 'Privacy Policy',
      'footer.legal': 'Legal Notice',
      'footer.rights': 'All rights reserved.',
      
      // Landing - Trust
      'landing.trust.direct': 'to server',
      'landing.trust.fee': 'Tipsy fee',
      'landing.trust.secure': 'Secure',
      
      // Landing - Why
      'landing.why.title': 'Why Tipsy?',
      'landing.why.transparent': 'Total transparency on fees - no hidden costs',
      'landing.why.direct': 'Tips go directly to the server, not the employer',
      'landing.why.simple': 'Fast and simple - tip in under 15 seconds',
      'landing.why.secure': 'Secure payments powered by Stripe',
      
      // Error messages
      'error.payment.failed': 'Payment failed. Please check your card details or try another payment method.',
      'error.network': 'Connection error. Please check your internet connection and try again.',
      'error.server': 'Server error. Please try again in a moment.',
      'error.invalid.amount': 'Please enter a valid amount greater than 0',
    }
  },
  fr: {
    translation: {
      // Landing
      'landing.hero.title': 'Get Tipsy',
      'landing.hero.subtitle': 'Parce que tu le mérites.',
      'landing.hero.description': '100% des pourboires te reviennent directement. Aucun employeur, aucun intermédiaire. Juste des pourboires équitables.',
      'landing.hero.cta': 'Commencer à gagner',
      'landing.how.title': 'Comment ça marche',
      'landing.how.step1.title': 'Crée ton profil',
      'landing.how.step1.desc': 'Inscris-toi en moins de 2 minutes',
      'landing.how.step2.title': 'Obtiens ton QR code',
      'landing.how.step2.desc': 'Imprime-le ou affiche-le sur ton téléphone',
      'landing.how.step3.title': 'Reçois des pourboires',
      'landing.how.step3.desc': '100% de chaque pourboire te revient',
      
      // Auth
      'auth.title': 'Bienvenue sur Tipsy',
      'auth.subtitle': 'Entre ton numéro de téléphone pour continuer',
      'auth.phone.label': 'Numéro de téléphone',
      'auth.phone.placeholder': '+33 6 12 34 56 78',
      'auth.send.otp': 'Envoyer le code',
      'auth.otp.title': 'Entre le code de vérification',
      'auth.otp.subtitle': 'Nous avons envoyé un code à',
      'auth.otp.label': 'Code de vérification',
      'auth.verify': 'Vérifier',
      'auth.resend': 'Renvoyer le code',
      
      // Profile Setup
      'profile.setup.title': 'Crée ton profil',
      'profile.setup.subtitle': 'Fais savoir aux clients qui ils donnent un pourboire',
      'profile.first.name': 'Prénom',
      'profile.photo.url': 'URL de la photo (optionnel)',
      'profile.save': 'Enregistrer le profil',
      
      // Dashboard
      'dashboard.title': 'Ton tableau de bord',
      'dashboard.total.tips': 'Pourboires totaux',
      'dashboard.tip.count': 'Pourboires reçus',
      'dashboard.average.tip': 'Pourboire moyen',
      'dashboard.recent.tips': 'Pourboires récents',
      'dashboard.no.tips': 'Aucun pourboire pour le moment. Partage ton QR code pour commencer à gagner!',
      'dashboard.my.qr': 'Mon QR Code',
      'dashboard.logout': 'Déconnexion',
      
      // QR Code
      'qr.title': 'Ton QR Code',
      'qr.subtitle': 'Partage-le avec les clients pour recevoir des pourboires',
      'qr.download': 'Télécharger le QR',
      'qr.share': 'Partager le lien',
      'qr.link.copied': 'Lien copié!',
      
      // Tip Page (Customer)
      'tip.title': 'Pourboire pour',
      'tip.select.amount': 'Sélectionne le montant du pourboire',
      'tip.custom': 'Personnalisé',
      'tip.or': 'ou',
      'tip.continue': 'Continuer',
      'tip.breakdown.title': 'Détail du paiement',
      'tip.breakdown.tip': 'Pourboire',
      'tip.breakdown.tipsy': 'Tipsy (1%)',
      'tip.breakdown.bank': 'Frais bancaires',
      'tip.breakdown.total': 'Total payé',
      'tip.breakdown.server.receives': 'Le serveur reçoit 100%',
      'tip.pay.now': 'Payer maintenant',
      'tip.transparency.note': 'Tipsy ne prend que 1%. Les frais bancaires sont fixés par les réseaux de paiement, pas par nous.',
      
      // Success
      'success.title': 'Merci!',
      'success.subtitle': 'Ton pourboire a été envoyé',
      'success.slogan': 'Get Tipsy. Parce que tu le mérites.',
      'success.processing': 'Traitement du paiement...',
      
      // Common
      'common.back': 'Retour',
      'common.loading': 'Chargement...',
      'common.error': 'Une erreur s\'est produite',
      'common.currency': '€',
      
      // Footer
      'footer.terms': 'Conditions d\'utilisation',
      'footer.privacy': 'Politique de confidentialité',
      'footer.legal': 'Mentions légales',
      'footer.rights': 'Tous droits réservés.',
      
      // Landing - Trust
      'landing.trust.direct': 'au serveur',
      'landing.trust.fee': 'Frais Tipsy',
      'landing.trust.secure': 'Sécurisé',
      
      // Landing - Why
      'landing.why.title': 'Pourquoi Tipsy ?',
      'landing.why.transparent': 'Transparence totale sur les frais - aucun coût caché',
      'landing.why.direct': 'Les pourboires vont directement au serveur, pas à l\'employeur',
      'landing.why.simple': 'Rapide et simple - donnez un pourboire en moins de 15 secondes',
      'landing.why.secure': 'Paiements sécurisés par Stripe',
      
      // Error messages
      'error.payment.failed': 'Paiement échoué. Veuillez vérifier vos informations de carte ou essayer un autre moyen de paiement.',
      'error.network': 'Erreur de connexion. Veuillez vérifier votre connexion Internet et réessayer.',
      'error.server': 'Erreur serveur. Veuillez réessayer dans un instant.',
      'error.invalid.amount': 'Veuillez entrer un montant valide supérieur à 0',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;