# MVP Condaura - Spécifications détaillées
## Version 1.0 - Plateforme de revue d'accès (Semaines 3-10)

---

## 1. Vue d'ensemble du MVP

### 1.1 Objectif du MVP
Créer une version minimale viable de Condaura permettant de démontrer la valeur de la plateforme pour automatiser les processus de revue d'accès. Cette version sera utilisée pour valider le concept auprès des premiers utilisateurs et servir de base pour les phases suivantes.

### 1.2 Principe de fonctionnement
1. **Import** : L'administrateur importe les données utilisateurs et leurs accès
2. **Configuration** : Création d'une campagne de revue avec périmètre défini
3. **Attribution** : Assignation des réviseurs aux différents accès
4. **Revue** : Les réviseurs valident, commentent ou révoquent les accès
5. **Export** : Génération de rapports de synthèse

---

## 2. Fonctionnalités détaillées

### 2.1 Authentification et gestion des utilisateurs

#### 2.1.1 Authentification
- **Connexion classique** : Email/mot de passe
- **SSO basique** : OAuth2 (Google, Microsoft)
- **Sécurité** : Hash des mots de passe (bcrypt), sessions sécurisées
- **Récupération** : Reset de mot de passe par email

#### 2.1.2 Gestion des profils
- **Rôles disponibles** :
  - `Admin` : Configuration complète, création de campagnes
  - `Reviewer` : Participation aux revues assignées
  - `Viewer` : Consultation des rapports uniquement

#### 2.1.3 Écrans d'authentification
```
/login          → Formulaire de connexion
/register       → Inscription (première utilisation)
/forgot-password → Récupération de mot de passe
/profile        → Gestion du profil utilisateur
```

### 2.2 Import et gestion des données

#### 2.2.1 Import des utilisateurs
**Format CSV requis :**
```csv
user_id,email,first_name,last_name,department,manager_email,status
U001,john.doe@company.com,John,Doe,IT,manager@company.com,active
```

**Champs obligatoires :**
- `user_id` : Identifiant unique
- `email` : Email de l'utilisateur
- `first_name`, `last_name` : Nom complet
- `department` : Service/département
- `status` : active/inactive

#### 2.2.2 Import des accès
**Format CSV requis :**
```csv
access_id,user_id,resource_name,resource_type,access_level,granted_date,last_used
A001,U001,SharePoint Site Marketing,Application,Read/Write,2024-01-15,2025-03-20
```

**Champs obligatoires :**
- `access_id` : Identifiant unique de l'accès
- `user_id` : Référence vers l'utilisateur
- `resource_name` : Nom de la ressource
- `resource_type` : Type (Application, Folder, Database, etc.)
- `access_level` : Niveau d'accès (Read, Write, Admin, etc.)

#### 2.2.3 Validation des données
- Vérification de l'intégrité référentielle
- Détection des doublons
- Rapport d'erreurs d'import détaillé
- Aperçu avant validation définitive

### 2.3 Création et gestion des campagnes

#### 2.3.1 Configuration d'une campagne
**Formulaire de création :**
```
Nom de la campagne     : [Revue Q1 2025]
Description            : [Revue trimestrielle des accès IT]
Date de début          : [01/06/2025]
Date de fin            : [15/06/2025]
Rappels automatiques   : [3 jours avant échéance]
```

**Sélection du périmètre :**
- Par département (IT, RH, Finance, etc.)
- Par type de ressource (Applications, Dossiers, Bases de données)
- Par niveau d'accès (Admin uniquement, Tous les accès)
- Par utilisateur spécifique

#### 2.3.2 Attribution des réviseurs
**Modes d'attribution :**
- **Manuel** : Sélection directe des réviseurs
- **Par hiérarchie** : Attribution automatique au manager
- **Par ressource** : Propriétaire de la ressource

#### 2.3.3 États d'une campagne
- `Draft` : En cours de configuration
- `Active` : En cours de revue
- `Completed` : Terminée
- `Archived` : Archivée

### 2.4 Interface de revue

#### 2.4.1 Tableau de bord réviseur
**Vue d'ensemble :**
- Nombre d'accès à réviser
- Progression (% terminé)
- Délai restant
- Accès urgents/critiques

#### 2.4.2 Liste des accès à réviser
**Colonnes du tableau :**
- Utilisateur (nom, email, département)
- Ressource (nom, type)
- Niveau d'accès
- Date d'attribution
- Dernière utilisation
- Actions (Valider/Révoquer/Commenter)

#### 2.4.3 Actions de revue
**Valider un accès :**
- Bouton "Valider" vert
- Commentaire optionnel
- Validation en lot possible

**Révoquer un accès :**
- Bouton "Révoquer" rouge
- Commentaire obligatoire (justification)
- Confirmation requise

**Reporter la décision :**
- Bouton "Reporter"
- Sélection d'une nouvelle date
- Commentaire de justification

#### 2.4.4 Filtres et recherche
- Recherche par nom d'utilisateur
- Filtre par type de ressource
- Filtre par niveau d'accès
- Filtre par statut (En attente, Validé, Révoqué)
- Tri par colonnes

### 2.5 Suivi et historique

#### 2.5.1 Historique des décisions
**Traçabilité complète :**
- Qui a pris la décision
- Quand (date/heure)
- Quelle action (Valider/Révoquer/Reporter)
- Commentaire associé
- IP et user-agent pour audit

#### 2.5.2 Tableau de bord administrateur
**Indicateurs clés :**
- Progression globale par campagne
- Nombre d'accès validés/révoqués
- Réviseurs en retard
- Temps moyen de traitement

### 2.6 Exports et rapports

#### 2.6.1 Export Excel
**Contenu du rapport :**
- Synthèse de la campagne
- Liste complète des décisions
- Statistiques par département
- Accès révoqués avec justifications

#### 2.6.2 Export PDF
**Rapport exécutif :**
- Résumé de la campagne
- Graphiques de synthèse
- Recommandations de sécurité
- Signatures numériques pour audit

---

## 3. Architecture technique du MVP

### 3.1 Stack technique
**Frontend :**
- React 18.2+ avec TypeScript
- Tailwind CSS pour le styling
- React Router pour la navigation
- Axios pour les appels API
- React Hook Form pour les formulaires

**Backend :**
- Python 3.11+ avec Django 4.2+
- Django REST Framework pour l'API
- Django Admin pour l'administration
- Celery pour les tâches asynchrones

**Base de données :**
- PostgreSQL 15+ pour les données principales
- Redis pour le cache et les sessions

### 3.2 Modèles de données

#### 3.2.1 Modèle utilisateur
```python
class User(AbstractUser):
    user_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100)
    manager = models.ForeignKey('self', null=True, blank=True)
    role = models.CharField(choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### 3.2.2 Modèle campagne
```python
class Campaign(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(choices=STATUS_CHOICES)
    created_by = models.ForeignKey(User)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### 3.2.3 Modèle accès
```python
class Access(models.Model):
    access_id = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(User)
    resource_name = models.CharField(max_length=200)
    resource_type = models.CharField(max_length=50)
    access_level = models.CharField(max_length=50)
    granted_date = models.DateField()
    last_used = models.DateField(null=True)
```

#### 3.2.4 Modèle revue
```python
class Review(models.Model):
    campaign = models.ForeignKey(Campaign)
    access = models.ForeignKey(Access)
    reviewer = models.ForeignKey(User)
    decision = models.CharField(choices=DECISION_CHOICES)
    comment = models.TextField()
    reviewed_at = models.DateTimeField()
```

### 3.3 API Endpoints

#### 3.3.1 Authentification
```
POST /api/auth/login/       → Connexion
POST /api/auth/logout/      → Déconnexion
POST /api/auth/register/    → Inscription
POST /api/auth/reset/       → Reset mot de passe
```

#### 3.3.2 Gestion des données
```
POST /api/users/import/     → Import utilisateurs CSV
POST /api/access/import/    → Import accès CSV
GET  /api/users/           → Liste des utilisateurs
GET  /api/access/          → Liste des accès
```

#### 3.3.3 Campagnes
```
GET    /api/campaigns/      → Liste des campagnes
POST   /api/campaigns/      → Créer une campagne
GET    /api/campaigns/{id}/ → Détail d'une campagne
PUT    /api/campaigns/{id}/ → Modifier une campagne
DELETE /api/campaigns/{id}/ → Supprimer une campagne
```

#### 3.3.4 Revues
```
GET  /api/reviews/          → Accès à réviser
POST /api/reviews/          → Soumettre une décision
GET  /api/reviews/stats/    → Statistiques de revue
```

---

## 4. Interface utilisateur (UI/UX)

### 4.1 Design System
**Palette de couleurs :**
- Primaire : Bleu profond (#3d1b3) - Actions principales et brand
- Secondaire : Bleu clair (#fcfdc) - Éléments d'accentuation
- Accent 1 : Turquoise (#31aef8) - Highlights et liens
- Accent 2 : Violet doux (#a6d0f4) - Éléments secondaires
- Accent 3 : Lavande (#7bd3f0) - Arrière-plans subtils
- Succès : Vert (#10B981) - Validations
- Danger : Rouge (#EF4444) - Révocations
- Neutre : Gris (#6B7280) - Texte et bordures

**Typographie :**
- Police principale : Inter
- Tailles : 12px, 14px, 16px, 18px, 24px, 32px

### 4.2 Wireframes des écrans principaux

#### 4.2.1 Dashboard administrateur
```
┌─────────────────────────────────────────────────────┐
│ [Logo] Condaura                    [Profil] [Logout] │
├─────────────────────────────────────────────────────┤
│ Tableau de bord                                     │
│                                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │Campagnes│ │Utilisat.│ │  Accès  │ │ Revues  │    │
│ │   12    │ │  1,240  │ │  8,450  │ │   340   │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                                     │
│ Campagnes actives                   [Nouvelle camp.]│
│ ┌─────────────────────────────────────────────────┐ │
│ │ Revue Q1 2025        | En cours  | 65% | 3j     │ │
│ │ Audit sécurité       | En cours  | 23% | 8j     │ │
│ │ Revue départementale | Terminée  | 100%| -      │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### 4.2.2 Interface de revue
```
┌─────────────────────────────────────────────────────┐
│ Campagne: Revue Q1 2025                 Progress: ▓▓▓▓▓▓▓░░░ 65% │
├─────────────────────────────────────────────────────┤
│ [Recherche...] [Filtres ▼] [Export]                │
│                                                     │
│ ┌─ Utilisateur ──┬─ Ressource ──┬─ Accès ─┬─Actions─┐ │
│ │ John Doe       │ SharePoint   │ R/W     │[✓][✗][?]│ │
│ │ IT Dept        │ Marketing    │         │         │ │
│ ├────────────────┼──────────────┼─────────┼─────────┤ │
│ │ Jane Smith     │ Database     │ Admin   │[✓][✗][?]│ │
│ │ Finance        │ HR_System    │         │         │ │
│ └────────────────┴──────────────┴─────────┴─────────┘ │
│                                                     │
│ [Actions en lot: ✓ Valider sélection] [Tout sélect.] │
└─────────────────────────────────────────────────────┘
```

### 4.3 Responsive Design
- **Desktop** : Mise en page complète avec sidebar
- **Tablet** : Navigation par onglets, colonnes adaptées
- **Mobile** : Interface empilée, actions simplifiées

---

## 5. Critères d'acceptation du MVP

### 5.1 Fonctionnalités critiques
✅ **Authentification sécurisée** : Connexion/déconnexion fonctionnelle  
✅ **Import des données** : CSV utilisateurs et accès traités correctement  
✅ **Création de campagne** : Configuration complète possible  
✅ **Interface de revue** : Actions de validation/révocation fonctionnelles  
✅ **Export des résultats** : Génération PDF et Excel  

### 5.2 Performance et qualité
- **Temps de réponse** : < 3 secondes pour toutes les pages
- **Capacité** : Support de 1000 utilisateurs et 10000 accès
- **Compatibilité** : Chrome, Firefox, Safari, Edge (dernières versions)
- **Tests** : Couverture de 70% minimum

### 5.3 Sécurité
- Authentification sécurisée (hash des mots de passe)
- Protection CSRF sur tous les formulaires
- Validation des entrées utilisateur
- Logs d'audit pour toutes les actions critiques

---

## 6. Plan de déploiement MVP

### 6.1 Environnements
**Développement :**
- Docker Compose local
- Base de données PostgreSQL locale
- Hot reload pour développement rapide

**Staging :**
- Déploiement sur Heroku/Railway
- Base de données cloud (PostgreSQL)
- Tests automatisés

**Production :**
- Infrastructure cloud (AWS/Azure)
- Base de données managée
- Monitoring et alertes

### 6.2 Configuration Docker
```dockerfile
# Dockerfile pour le backend Django
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### 6.3 Variables d'environnement
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/condaura
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=condaura.com,*.condaura.com
```

---

## 7. Tests et validation

### 7.1 Tests utilisateurs
**Scénarios de test :**
1. Import de 100 utilisateurs et 500 accès
2. Création d'une campagne avec 3 réviseurs
3. Processus de revue complet (validation/révocation)
4. Export des résultats

### 7.2 Tests techniques
**Tests unitaires :**
- Modèles Django (validation des données)
- Vues API (responses HTTP)
- Utilitaires (import CSV, export PDF)

**Tests d'intégration :**
- Workflow complet d'une campagne
- Authentification et autorisation
- Import/export de données

### 7.3 Métriques de succès
- **Utilisabilité** : 90% des testeurs complètent le workflow
- **Performance** : Toutes les pages < 3 secondes
- **Fiabilité** : 0 bug critique, < 5 bugs mineurs

---

## 8. Documentation

### 8.1 Documentation utilisateur
- Guide de démarrage rapide
- Tutoriel de première utilisation
- FAQ des fonctionnalités principales

### 8.2 Documentation technique
- Setup de l'environnement de développement
- Documentation de l'API (Swagger/OpenAPI)
- Guide de déploiement

### 8.3 Ressources de support
- Vidéos de démonstration (5-10 minutes)
- Templates CSV pour import
- Exemples de rapports générés

---

## 9. Prochaines étapes après MVP

### 9.1 Feedback et itération
- Collecte des retours utilisateurs
- Analyse des métriques d'usage
- Priorisation des améliorations

### 9.2 Préparation Phase 2
- Planification des notifications automatiques
- Architecture pour les campagnes récurrentes
- Conception de l'attribution automatique

### 9.3 Validation commerciale
- Pricing model préliminaire
- Stratégie de go-to-market
- Identification des early adopters

---

**Préparé par :** Aranche Elie Yatte  
**Date :** Mai 2025  
**Version :** 1.0  
**Statut :** Spécifications MVP prêtes pour développement