# Security Check — Projet Tipsy (audit du code actuel)

Date: 2026-06-18  
Périmètre audité: backend FastAPI (`backend/main.py`, `backend/routes/*`, `backend/models/*`, `backend/config/db.py`), frontend React (`frontend/src/pages/*`), dépendances (`backend/requirements*.txt`, `frontend/package.json`), configuration (`.gitignore`, `backend/.env`).

---

## Résumé exécutif

Le projet présente plusieurs **risques de cybersécurité importants** au niveau authentification, exposition d’informations, configuration et anti-abus.

### Risques critiques
1. **Bypass OTP en mode développement (`DEV_MODE`)** avec code OTP statique (`123456`) et divulgation du code dans la réponse API.
2. **Absence d’authentification serveur persistante** (pas de JWT/session signée), avec confiance excessive dans `sessionStorage` côté client.
3. **CORS permissif par défaut** (`allow_origins='*'`) avec `allow_credentials=True`.
4. **Fuite potentielle d’informations internes** via messages d’erreur renvoyés au client (`detail=str(e)`).

### Risques élevés
5. **Pas de rate limiting / anti-bruteforce** sur endpoints OTP et paiements.
6. **Validation d’entrée insuffisante** (`host_url`, `photo_url`, montants) pouvant permettre abus/logique de redirection mal maîtrisée.
7. **Fichier `backend/.env` présent dans le workspace** avec clés sensibles d’exemple (même placeholders): surface d’erreur opérationnelle.

---

## Constats techniques détaillés

## 1) Authentification & autorisation

### 1.1 `DEV_MODE` + OTP statique (Critique)
- Fichier: `backend/routes/auth.py`
- Constat:
  - `dev_mode = os.environ.get('DEV_MODE', 'false').lower() == 'true'`
  - `dev_otp_code = os.environ.get('DEV_OTP_CODE', '123456')`
  - En mode dev, l’API retourne le code OTP dans la réponse (`"Code envoyé (DEV: ... )"`) et dans les logs.
- Risque:
  - Si `DEV_MODE` est activé par erreur en prod, authentification triviale à compromettre.

### 1.2 Pas de token de session (Critique)
- Fichiers: `backend/routes/auth.py`, `backend/routes/servers.py`, `backend/routes/tips.py`, `frontend/src/pages/Auth.js`, `frontend/src/pages/Dashboard.js`, `frontend/src/pages/ProfileSetup.js`, `frontend/src/pages/QRCodePage.js`
- Constat:
  - Après vérification OTP, le backend ne fournit pas de JWT/session signée.
  - Le frontend stocke des objets serveur dans `sessionStorage` et continue les flux sans preuve cryptographique d’identité.
  - Les endpoints sensibles ne vérifient pas d’`Authorization`.
- Risque:
  - Usurpation d’identité logique via modification des identifiants côté client / appels API directs.

### 1.3 Endpoints d’admin logique non protégés (Élevé)
- Fichiers: `backend/routes/servers.py`, `backend/routes/tips.py`
- Constat:
  - Création/édition profil, onboarding Stripe Connect, statut Stripe, création checkout ne requièrent pas de token d’utilisateur authentifié.
- Risque:
  - Abus fonctionnels (modification ou déclenchement d’actions liées à des `server_id` connus).

---

## 2) Paiements & webhooks Stripe

### 2.1 Signature webhook Stripe validée (Point positif)
- Fichier: `backend/routes/tips.py`
- Constat:
  - `stripe.Webhook.construct_event(...)` est utilisé avec `STRIPE_WEBHOOK_SECRET`.
- Reste à améliorer:
  - Pas de protection anti-rejeu explicite (idempotence stricte et suivi d’`event.id` à renforcer).

### 2.2 URL de retour construites depuis `host_url` fourni par le client (Élevé)
- Fichier: `backend/routes/tips.py`
- Constat:
  - `success_url` et `cancel_url` sont dérivées de `tip_request.host_url` (entrée client).
- Risque:
  - Redirections vers des domaines non attendus / abus de parcours de paiement.

### 2.3 Mode dev checkout fake (Moyen)
- Fichier: `backend/routes/tips.py`
- Constat:
  - En dev, un faux checkout est retourné selon condition sur clé Stripe.
- Risque:
  - Confusion opérationnelle si activé hors contexte de test.

---

## 3) CORS, config, erreurs

### 3.1 CORS trop permissif par défaut (Critique)
- Fichier: `backend/main.py`
- Constat:
  - `allow_origins=os.environ.get('CORS_ORIGINS', '*').split(',')`
  - `allow_credentials=True`
- Risque:
  - Ouverture excessive de l’API à des origines non prévues.

### 3.2 Erreurs internes exposées au client (Élevé)
- Fichiers: `backend/routes/auth.py`, `backend/routes/servers.py`, `backend/routes/tips.py`
- Constat:
  - Plusieurs `HTTPException(... detail=str(e))` ou messages détaillés.
- Risque:
  - Divulgation d’informations internes (stack, provider failures, détails infrastructure).

### 3.3 Gestion des secrets et `.env` (Élevé)
- Fichier: `backend/.env` visible dans workspace
- Constat:
  - Présence d’un `.env` contenant des exemples de secrets/variables sensibles.
- Risque:
  - Erreur humaine (commit accidentel, partage non maîtrisé).
- Note:
  - Le `.gitignore` racine ignore bien les `.env*`, c’est positif.

---

## 4) Validation des entrées

### 4.1 Schémas Pydantic trop permissifs (Moyen/Élevé)
- Fichiers: `backend/models/server.py`, `backend/models/tip.py`
- Constat:
  - Pas de contraintes fortes sur format téléphone, plage montants, URL, etc.
- Risque:
  - Données incohérentes, abus métier, erreurs downstream.

### 4.2 `photo_url` et rendu frontend (Moyen)
- Fichiers: `backend/models/server.py`, `frontend/src/pages/*`
- Constat:
  - URL image non filtrée et rendue côté client.
- Risque:
  - Contenu externe non maîtrisé / tracking / comportement inattendu navigateur.

---

## 5) Anti-abus & monitoring

### 5.1 Aucun rate-limit OTP / checkout (Élevé)
- Fichiers: `backend/routes/auth.py`, `backend/routes/tips.py`
- Constat:
  - Pas de limitation par IP, téléphone, device.
- Risque:
  - Spam SMS, brute force OTP, abus API.

### 5.2 Journalisation sensible en dev (Moyen)
- Fichier: `backend/routes/auth.py`
- Constat:
  - OTP affiché en log en mode dev.
- Risque:
  - Exposition en cas de logs partagés.

---

## 6) Dépendances

### 6.1 `requirements.txt` très large (Moyen)
- Fichier: `backend/requirements.txt`
- Constat:
  - Beaucoup de dépendances non nécessaires à l’exécution backend.
- Risque:
  - Surface d’attaque élargie inutilement.

### 6.2 `requirements-server.txt` plus propre (Point positif)
- Fichier: `backend/requirements-server.txt`
- Constat:
  - Liste réduite plus adaptée au runtime backend.
- Action:
  - Conserver ce découpage et n’installer en prod que ce fichier.

### 6.3 Audit dépendances incomplet (À faire)
- Constat:
  - `pip_audit` lancé mais sortie non exploitée (exit code 1 sans rapport lisible conservé).
- Action:
  - Relancer audit avec sortie fichier pour suivi CI.

---

## Plan de remédiation priorisé

## Priorité P0 (immédiat)
- [ ] Forcer `DEV_MODE=false` hors local et supprimer tout OTP en réponse API.
- [ ] Implémenter authentification robuste post-OTP (JWT signé + expiration + refresh policy) et protéger endpoints sensibles.
- [ ] Corriger CORS: supprimer `*`, définir whitelist stricte via `CORS_ORIGINS`.
- [ ] Remplacer `detail=str(e)` par messages génériques côté client; garder détail uniquement en logs internes.

## Priorité P1 (court terme)
- [ ] Ajouter rate limiting (IP + phone) sur `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/tips/create-checkout`.
- [ ] Valider strictement `host_url` sur liste d’origines autorisées.
- [ ] Ajouter contraintes Pydantic (`constr`, `HttpUrl`, bornes montants, longueur OTP).
- [ ] Implémenter idempotence/replay protection webhook via stockage `event.id`.

## Priorité P2 (moyen terme)
- [ ] Ajouter observabilité sécurité: alerting OTP, échecs Stripe, pics anormaux.
- [ ] Durcir politique secrets (secret manager, rotation, permissions minimales DB).
- [ ] Intégrer `pip-audit` + `npm/yarn audit` en CI avec rapport versionné.

---

## Checklist de vérification après correctifs
- [ ] Impossible de s’authentifier avec OTP statique quand `DEV_MODE=false`.
- [ ] Tous les endpoints sensibles rejettent requêtes sans JWT valide.
- [ ] CORS ne permet que les origines prévues.
- [ ] Webhooks Stripe invalides/rejoués sont rejetés.
- [ ] Tentatives OTP excessives bloquées.
- [ ] Erreurs API ne révèlent plus d’informations internes.

---

## Notes utiles
- Le backend est désormais structuré en `main.py` + `routes/*` (l’ancien `backend/server.py` n’est plus la source principale d’exécution).
- Le rapport précédent doit être considéré obsolète s’il référence uniquement `backend/server.py`.

---

## Conclusion

Le projet est fonctionnel mais **pas encore prêt sécurité pour un usage production exposé internet** sans correctifs P0/P1.  
La priorité absolue est de sécuriser l’authentification, réduire l’exposition CORS, bloquer les abus OTP et standardiser la gestion d’erreurs/secrets.
