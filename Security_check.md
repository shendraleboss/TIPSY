# Security Check — Projet Tipsy

Date: 2026-06-18  
Périmètre: backend FastAPI (`backend/main.py`, `backend/routes/*`, `backend/models/*`, `backend/config/*`), frontend React (`frontend/src/pages/*`), dépendances (`backend/requirements*.txt`, `frontend/package.json`), configuration (`.gitignore`, `.env`).

## Conclusion rapide

Le projet a déjà reçu plusieurs améliorations sécurité, mais **il reste encore des correctifs importants à faire** avant d’être considéré comme propre pour une mise en production exposée sur Internet.

Les points les plus sensibles sont:
- la **clé JWT par défaut codée en dur** dans `backend/config/security.py`,
- la **durée de vie du token trop longue**,
- la **protection incomplète de certains endpoints**,
- la **validation trop souple de certaines entrées**,
- la **présence d’un `requirements-server.txt` redevenu trop large**,
- et quelques **points de durcissement Stripe / CORS / rate limiting**.

---

## Ce qui est déjà bien

- `DEV_MODE` n’expose plus explicitement le code OTP au client en réponse.
- Les erreurs backend sont plus génériques qu’avant sur plusieurs routes.
- Une logique JWT a été introduite.
- Un rate limiting a été ajouté au moins sur le flux OTP.
- La signature du webhook Stripe est validée.

Ces points sont positifs, mais ils ne suffisent pas encore pour un niveau de sécurité production correct.

---

## Correctifs encore nécessaires

### 1) `JWT_SECRET_KEY` par défaut codée en dur — critique

**Fichier:** `backend/config/security.py`

Constat:
- La clé JWT est lue avec une valeur de secours par défaut:
	- `SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "tipsy-secret-key-super-robuste-pour-le-dev")`

Pourquoi c’est dangereux:
- Si la variable d’environnement n’est pas définie en prod, tout le monde partage potentiellement le même secret connu.
- Un token forgé deviendrait possible.

À corriger:
- Supprimer toute valeur par défaut en production.
- Faire échouer le démarrage si `JWT_SECRET_KEY` est absente hors dev.
- Utiliser une clé forte, longue, aléatoire, stockée dans un secret manager.

---

### 2) Durée de vie du JWT trop longue — élevée

**Fichier:** `backend/config/security.py`

Constat:
- Le token d’accès expire après 7 jours:
	- `ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7`

Pourquoi c’est dangereux:
- Si un token est volé, il reste valable longtemps.

À corriger:
- Réduire la durée à une valeur plus courte.
- Idéalement 15 min à 1 h pour l’accès, avec refresh token si nécessaire.
- Ajouter une stratégie d’expiration et de renouvellement claire.

---

### 3) Protection incomplète de certains endpoints — élevée

**Fichier:** `backend/routes/servers.py`

Constat:
- Certaines routes utilisent `current_phone: str = Depends(get_current_phone)` mais ne vérifient pas systématiquement que le téléphone authentifié correspond à la ressource demandée.
- Il faut vérifier, pour chaque route sensible, que le serveur demandé appartient bien à l’utilisateur authentifié.

À corriger:
- Sur `/servers/{server_id}/tips`, `/servers/{server_id}/stats`, `/servers/{server_id}/stripe-connect/onboard`, `/servers/{server_id}/stripe-connect/status`:
	- charger le serveur,
	- vérifier que `server_doc["phone"] == current_phone`,
	- refuser sinon avec `403`.
- Sur `/servers/{server_id}`:
	- décider si c’est une route publique ou privée.
	- si elle doit rester publique pour le QR code, limiter strictement les champs renvoyés.

---

### 4) `sessionStorage` côté frontend reste une confiance trop forte — élevée

**Fichiers:** `frontend/src/pages/Auth.js`, `frontend/src/pages/Dashboard.js`, `frontend/src/pages/ProfileSetup.js`, `frontend/src/pages/QRCodePage.js`

Constat:
- Le frontend continue d’utiliser `sessionStorage` pour stocker des infos serveur.
- Le backend doit être la source d’autorité, pas le navigateur.

À corriger:
- S’assurer que toutes les décisions sensibles sont validées côté backend avec le JWT.
- Ne pas dépendre de `sessionStorage` pour autoriser un accès.
- Si besoin, ne garder côté client que des données d’affichage non sensibles.

---

### 5) `requirements-server.txt` a été re-rempli avec trop de paquets — élevée

**Fichier:** `backend/requirements-server.txt`

Constat:
- Le fichier contient maintenant beaucoup de dépendances qui ressemblent à un `pip freeze` complet.
- On y voit des paquets de test, d’outils et de dépendances transitive/extra qui ne devraient pas forcément être dans le runtime.

Pourquoi c’est dangereux:
- Surface d’attaque plus large.
- Environnement de prod plus lourd.
- Plus de vulnérabilités potentielles.

À corriger:
- Revenir à une liste minimale d’exécution backend.
- Garder les dépendances de test et dev dans un fichier séparé.
- Installer en production uniquement ce qui est nécessaire au runtime.

---

### 6) `host_url` fourni par le client pour Stripe Checkout — élevée

**Fichier:** `backend/routes/tips.py`

Constat:
- `success_url` et `cancel_url` sont construites à partir de `tip_request.host_url`.

Pourquoi c’est dangereux:
- Un client peut fournir une URL de redirection non attendue.
- Cela peut créer des redirections abusives ou au moins un comportement non maîtrisé.

À corriger:
- Valider `host_url` contre une whitelist d’origines autorisées.
- Idéalement, dériver les URLs de redirection uniquement depuis une config serveur.

---

### 7) Stripe idempotency / anti-replay à vérifier — élevée

**Fichier:** `backend/routes/tips.py`

Constat:
- Le webhook Stripe est signé, ce qui est bien.
- Mais la protection anti-rejeu n’est pas encore explicitement complète.

À corriger:
- Stocker les `event.id` déjà traités.
- Ignorer les événements dupliqués.
- Si une clé d’idempotence est utilisée sur la création du checkout, vérifier qu’elle existe vraiment dans le modèle de requête.

Remarque importante:
- Le code appelle `tip_request.idempotency_key`, mais il faut vérifier que ce champ existe bien dans `TipCheckoutRequest`. Sinon, il faut soit l’ajouter, soit retirer cette référence.

---

### 8) Validation des schémas Pydantic trop permissive — moyenne à élevée

**Fichiers:** `backend/models/server.py`, `backend/models/tip.py`

Constat:
- Les champs critiques ne sont pas fortement contraints.
- Exemples: téléphone, `first_name`, `photo_url`, `host_url`, montants.

À corriger:
- Utiliser des contraintes sur les champs:
	- `HttpUrl` pour les URLs,
	- bornes min/max pour les montants,
	- contraintes de longueur/format pour le téléphone et le prénom.
- Rejeter les données incohérentes le plus tôt possible.

---

### 9) CORS doit rester strict — élevée

**Fichier:** `backend/main.py`

Constat:
- La config a été améliorée, mais il faut vérifier qu’en prod `CORS_ORIGINS` ne contient pas de joker.

À corriger:
- Interdire `*` en production.
- Garder une liste d’origines explicite et contrôlée.
- Si `allow_credentials=True`, la whitelist doit être stricte.

---

### 10) Messages d’erreur et logs — élevée

**Fichiers:** `backend/routes/auth.py`, `backend/routes/servers.py`, `backend/routes/tips.py`

Constat:
- Les erreurs sont mieux masquées qu’avant, mais il faut vérifier partout.
- Les logs doivent rester internes et ne pas exposer les secrets, OTP ou tokens.

À corriger:
- Remplacer les `detail=str(e)` restants par des messages génériques côté client.
- Journaliser les détails uniquement côté serveur.
- Ne jamais logger d’OTP complet, de JWT, de clés Stripe ou Twilio.

---

### 11) Rate limiting incomplet — moyenne

**Fichiers:** `backend/routes/auth.py`, `backend/routes/tips.py`

Constat:
- Le rate limit est en place sur OTP, mais il faut vérifier le reste du flux.

À corriger:
- Ajouter un throttling sur:
	- création de checkout,
	- vérification de statut de paiement,
	- webhook si exposé à du bruit anormal.
- Si possible, limiter par IP + par téléphone + par session.

---

### 12) `.env` et gestion des secrets — élevée

**Fichier:** `backend/.env`

Constat:
- Un fichier `.env` existe dans le workspace.
- Même avec des placeholders, il faut considérer ça comme sensible.

À corriger:
- S’assurer qu’aucun secret réel n’est committé.
- Utiliser un gestionnaire de secrets en prod.
- Vérifier aussi l’historique git pour éviter les secrets déjà exposés.

---

## Correctifs de durcissement recommandés

### Priorité immédiate
- [ ] Supprimer toute valeur de secours pour `JWT_SECRET_KEY` hors dev.
- [ ] Réduire la durée du JWT.
- [ ] Ajouter la vérification d’appartenance sur toutes les routes `server_id` privées.
- [ ] Valider `host_url` contre une whitelist.
- [ ] Revenir à un `requirements-server.txt` minimal.

### Priorité courte
- [ ] Ajouter un anti-replay webhook par `event.id`.
- [ ] Ajouter des contraintes Pydantic plus strictes.
- [ ] Vérifier qu’aucun `detail=str(e)` ne subsiste.
- [ ] Ajouter un rate limit sur les endpoints de paiement.

### Priorité moyen terme
- [ ] Durcir le monitoring sécurité.
- [ ] Ajouter des tests de sécurité pour auth, checkout et webhook.
- [ ] Lancer régulièrement `pip-audit` et `npm audit` en CI.

---

## Ce qu’il faut vérifier manuellement après corrections

- [ ] Un token JWT forgé ou expiré est refusé.
- [ ] Un utilisateur ne peut pas lire/modifier un autre `server_id`.
- [ ] Le checkout Stripe refuse une URL de redirection non autorisée.
- [ ] Les webhooks Stripe rejettent les duplicats.
- [ ] Les erreurs API ne renvoient plus d’informations internes.
- [ ] Le runtime backend n’installe que le strict nécessaire.

---

## Verdict

Le projet est **beaucoup mieux qu’au départ**, mais il reste encore des points importants à corriger pour la cybersécurité:
- secret JWT par défaut,
- durée de session trop longue,
- contrôle d’accès incomplet,
- surcharge de dépendances runtime,
- validation d’entrées à renforcer,
- durcissement Stripe et CORS.

En l’état, je le classerais comme **acceptable pour du test / dev**, mais **pas encore idéal pour une prod exposée publiquement** sans les correctifs listés ci-dessus.
