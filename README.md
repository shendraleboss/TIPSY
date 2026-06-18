# Tipsy — Installation et lancement local

Ce document explique comment installer les dépendances et lancer le projet Tipsy en local (backend FastAPI + frontend React).

**Fichiers utiles**
- Backend requirements minimal : [backend/requirements-server.txt](backend/requirements-server.txt)
- Code backend principal : [backend/server.py](backend/server.py)
- Frontend : [frontend/package.json](frontend/package.json)
- Recommandations sécurité : [SECURITY_RECOMMENDATIONS.md](SECURITY_RECOMMENDATIONS.md)

---

## Prérequis
- Python 3.10+ (pour le backend)
- Node 18+ et Yarn (ou npm) (pour le frontend)
- MongoDB accessible (URI), compte Stripe et Twilio pour l'envoi d'OTP en production

---

## Backend — Installation et lancement

1. Créer et activer un environnement virtuel (recommandé)

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Installer les dépendances minimales (backend)

```bash
pip install -r backend/requirements-server.txt
```

3. Créer un fichier `.env` dans le dossier `backend/` avec les variables suivantes (exemple) :

```
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net
DB_NAME=tipsy
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=yyyyy
TWILIO_VERIFY_SERVICE=VAXXXXX
DEV_MODE=true  # uniquement pour dev local, ne jamais activer en production
DEV_OTP_CODE=123456  # facultatif (dev only)
CORS_ORIGINS=http://localhost:3000
```

Remarques :
- Ne commitez jamais `.env` ni de clés dans le dépôt.
- En production, utilisez un gestionnaire de secrets et désactivez `DEV_MODE`.

4. Lancer le serveur FastAPI (développement)

```bash
uvicorn backend.server:app --reload --host 0.0.0.0 --port 8000
```

5. Vérifier l'API

- Page racine API : `http://localhost:8000/api/`
- Docs OpenAPI (si activés) : `http://localhost:8000/docs`

6. Tests rapides

Le script `backend_test.py` effectue quelques appels d'intégration contre `https://tipsy-pay.preview.emergentagent.com` par défaut. Pour le tester localement, modifiez la variable `base_url` en haut du fichier, ou exécutez :

```bash
python3 backend_test.py
```

---

## Frontend — Installation et lancement

1. Aller dans le dossier frontend et installer les dépendances

```bash
cd frontend
yarn install
# ou avec npm: npm install
```

2. Configurer l'URL du backend pour le développement

Créer un fichier `.env.local` dans `frontend/` ou exporter la variable d'environnement :

```
REACT_APP_BACKEND_URL=http://localhost:8000
```

3. Lancer l'interface

```bash
yarn start
# ou npm run start
```

Le frontend écoutera (par défaut) sur `http://localhost:3000`.

---

## Audit de dépendances (optionnel)

Installer `pip-audit` et lancer un audit sur les dépendances serveur :

```bash
# installer pip-audit
python3 -m pip install --user pip-audit

# lancer l'audit
python3 -m pip_audit -r backend/requirements-server.txt
```

Pour le frontend :

```bash
# depuis frontend/
# yarn audit ou npm audit
yarn audit
```

---

## Notes de sécurité importantes
- Désactivez `DEV_MODE` en production.
- Implémentez un mécanisme d'authentification (JWT) après l'OTP.
- Validez la signature des webhooks Stripe (`STRIPE_WEBHOOK_SECRET`).
- Restreignez `CORS_ORIGINS` en production et ne laissez pas `*` si `allow_credentials=True`.
- Séparez `requirements-server.txt` et `requirements-dev.txt` (déjà présents).

Voir le fichier [SECURITY_RECOMMENDATIONS.md](SECURITY_RECOMMENDATIONS.md) pour la checklist complète.

---

Si tu veux, je peux :
- automatiser la génération d'un environnement Docker,
- implémenter l'authentification JWT après OTP,
- ou remplacer `emergentintegrations` par un wrapper local utilisant directement le SDK Stripe.

Indique quelle action tu veux que j'exécute en premier.

