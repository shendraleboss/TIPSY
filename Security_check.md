# Recommandations de sécurité — Projet Tipsy

> Liste actionable des changements à appliquer pour sécuriser l'application (backend FastAPI + frontend React).

## Résumé rapide
- Type d'application : backend FastAPI (MongoDB, Stripe, Twilio) + frontend React.
- Risques majeurs identifiés : contournement OTP (dev mode), absence d'authentification server-side, CORS trop permissif, webhooks non vérifiés, absence de rate-limiting, secrets en clair, validation d'entrées insuffisante.

---

## Priorités — Actions immédiates (Critique / à faire en priorité)

- **Désactiver DEV_MODE en production** :
  - Retirer la valeur par défaut de `DEV_OTP_CODE` et empêcher `DEV_MODE` d'être vrai en production.
  - Failsafe : refuser le démarrage si `DEV_MODE=false` mais `TWILIO_*` requises sont absentes.
  - Fichier concerné : [backend/server.py](backend/server.py)

- **Ajouter authentification server-side après OTP** :
  - Après vérification OTP, émettre un token signé (JWT) lié au `server.id` et au téléphone.
  - Exiger ce token (via header `Authorization: Bearer <token>`) pour tous les endpoints sensibles (`/servers/profile`, `/tips/create-checkout`, `/servers/*/stripe-connect/*`).
  - Ne pas se fier aux données `sessionStorage` côté client pour autoriser les actions.
  - Fichier concerné : [backend/server.py](backend/server.py)

- **Valider la signature des webhooks Stripe et protéger contre le replay** :
  - Utiliser `stripe.Webhook.construct_event` et la `endpoint_secret` pour valider `stripe_signature`.
  - Refuser et logger les événements non valides. Implémenter un mécanisme anti-replay (ex. vérifier `id` et timestamp, stocker derniers ids traités).
  - Fichier concerné : [backend/server.py](backend/server.py) et la lib `emergentintegrations.payments.stripe.checkout` (à auditer).

- **Restreindre CORS et disable allow_credentials si non nécessaire** :
  - Ne pas utiliser `'*'` en `allow_origins` en production surtout avec `allow_credentials=True`.
  - Déployer une variable `CORS_ORIGINS` explicite contenant la liste d'origines autorisées.
  - Fichier concerné : [backend/server.py](backend/server.py)

- **Rate-limiting pour endpoints publics** :
  - Ajouter rate-limit sur `/auth/send-otp`, `/auth/verify-otp`, `/tips/create-checkout` et endpoints sensibles.
  - Implémentation simple : `fastapi-limiter` (Redis) ou middleware nginx/Cloud WAF.

---

## Hautes priorités (Important)

- **Protéger et gérer les secrets** :
  - S'assurer que `.env` n'est pas commité, utiliser un secret manager (Vault, AWS Secrets Manager, GCP Secret Manager).
  - Ne pas logger des secrets ou OTPs en clair (audit des `logger.info/error`).
  - Rotation régulière des clés (`STRIPE_API_KEY`, `TWILIO_*`, `MONGO_URL`).

- **Validation stricte des URLs de redirection** :
  - Les `refresh_url`/`return_url` envoyées pour Stripe onboarding doivent être validées contre une whitelist.
  - Eviter tout open-redirect/vecteur d'hameçonnage.
  - Fichier concerné : [backend/server.py](backend/server.py)

- **Validation & sanitation des entrées** :
  - Valider `photo_url` (scheme `https?`, host autorisé ou passer par un proxy d'images), `amount` côté serveur (borne min/max), `host_url` (origines autorisées).
  - Rejeter ou normaliser les inputs malformés.

- **Limiter les permissions DB** :
  - Le compte Mongo utilisé par l'appli doit avoir des permissions minimales (ne pas être admin).
  - Forcer TLS (mongodb+srv:// or mongodb:// with TLS) et restreindre l'accès par IP.

- **Masquer les erreurs internes côté client** :
  - Ne pas renvoyer `str(e)` directement dans les réponses client. Utiliser messages génériques et logger les détails en interne.

---

## Moyennes priorités (Améliorations recommandées)

- **Sécuriser le stockage côté client** :
  - Remplacer la logique actuelle qui stocke `server` en `sessionStorage` par un token JWT côté serveur. Toute action server-side doit être validée par ce token.

- **Audit des dépendances** :
  - Lancer `pip-audit` et `safety` pour Python ; `npm audit` / `yarn audit` pour le frontend.
  - Mettre en place Dependabot / Snyk pour mises à jour automatiques.
  - Fichier concerné : [backend/requirements.txt](backend/requirements.txt), [frontend/package.json](frontend/package.json)

- **Content Security Policy (CSP)** :
  - Ajouter des en-têtes CSP si l'app sert des pages HTML ou via reverse proxy.

- **Logging & Monitoring** :
  - Centraliser logs, surveiller anomalies (ex. trop d'OTP envoyés pour un numéro), alertes pour webhooks échoués.

---

## Faibles priorités (Nice-to-have)

- **HSTS & HTTPS strict** : s'assurer que la configuration de déploiement impose HTTPS et HSTS.
- **Scanner le dépôt pour secrets** : utiliser `git-secrets` ou `truffleHog` pour s'assurer qu'aucune clé API n'est committée.
- **Tests de sécurité automatisés** : ajouter des tests d'intégration pour webhooks, retry, et mauvais payloads.

---

## Checklist actionable (tâches concrètes)

- [ ] Retirer `DEV_OTP_CODE` par défaut et sécuriser `DEV_MODE`.
- [ ] Implémenter JWT après OTP ; exiger `Authorization` sur endpoints sensibles.
- [ ] Valider la signature Stripe dans `/webhook/stripe` (endpoint secret + anti-replay).
- [ ] Restreindre `CORS_ORIGINS` en prod ; refuser `'*'` avec `allow_credentials=True`.
- [ ] Ajouter rate-limiting (Redis-backed) pour endpoints publics.
- [ ] Valider `return_url`/`refresh_url` contre whitelist.
- [ ] Mettre en place un secret manager; retirer secrets du repo.
- [ ] Lancer `pip-audit` et `yarn audit` puis corriger vulnérabilités critiques.
- [ ] Forcer TLS et rôles minimaux pour MongoDB.
- [ ] Remplacer confiance sur `sessionStorage` par vérifications server-side.

---

## Emplacement des modifications recommandées
- Back-end principal : [backend/server.py](backend/server.py)
- Dépendances Python : [backend/requirements.txt](backend/requirements.txt)
- Front-end : [frontend/src/pages/*](frontend/src/pages/)
- Manifeste front-end : [frontend/package.json](frontend/package.json)

---

## Propositions d'implémentation rapides

- JWT minimal : émettre un JWT avec `server_id`, expiration courte (ex. 1h), signer avec `JWT_SECRET`. Ajouter un `Depends` dans FastAPI pour valider et injecter `current_server`.

- Vérification webhook Stripe (exemple simplifié) :

```py
import stripe
from fastapi import HTTPException

stripe.api_key = STRIPE_API_KEY
endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

try:
    event = stripe.Webhook.construct_event(body, stripe_signature, endpoint_secret)
except Exception:
    raise HTTPException(status_code=400, detail='Invalid webhook signature')
```

- Rate limit : `fastapi-limiter` + Redis ; limiter sur `phone` et IP pour `/auth/send-otp`.

---

## Questions pour vous (rapide)
1. Voulez-vous que j'implémente automatiquement : (A) JWT auth après OTP, (B) validation Stripe webhook, (C) restreindre CORS, (D) un audit des dépendances ?
2. Les secrets sont-ils gérés via un secret manager en production ou via `.env` sur le serveur ?
3. L'application est-elle déjà en production ; si oui, quelle est l'URL/déploiement (pour config CORS/redirects) ?

---

Si vous voulez, je peux commencer par appliquer les correctifs critiques (JWT + webhook validation + empêcher `DEV_MODE` en prod). Dites-moi quelles actions vous autorisez et je m'en occupe.
