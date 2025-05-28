# Condaura 🔐
## Plateforme de revue d'accès intelligente

[![Version](https://img.shields.io/badge/version-1.0.0--mvp-blue)](#)
[![License](https://img.shields.io/badge/license-Proprietary-red)](#)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)

---

## 📋 Description

Condaura est une plateforme SaaS moderne qui automatise et simplifie les processus de revue d'accès pour améliorer la sécurité et la conformité des entreprises. Cette version MVP permet de gérer efficacement les campagnes de révision des droits utilisateurs avec une interface intuitive et des exports détaillés.

### ✨ Fonctionnalités principales

- 🔐 **Authentification sécurisée** avec support SSO
- 📊 **Import/Export CSV** pour les utilisateurs et accès
- 🎯 **Campagnes de revue** configurables et programmables
- ✅ **Interface de validation** intuitive pour les réviseurs
- 📈 **Rapports détaillés** en PDF et Excel
- 🔍 **Traçabilité complète** des décisions d'audit

---

## 🚀 Installation rapide

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 6+
- Docker & Docker Compose (recommandé)

### Installation avec Docker (recommandée)

```bash
# Cloner le repository
git clone https://github.com/your-username/condaura.git
cd condaura

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Lancer l'application
docker-compose up -d

# Créer un superutilisateur
docker-compose exec backend python manage.py createsuperuser

# L'application est accessible sur http://localhost:3000
```

### Installation manuelle

#### Backend (Django)
```bash
cd backend/
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configuration de la base de données
python manage.py migrate
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

#### Frontend (React)
```bash
cd frontend/
npm install
npm start
```

---

## 🏗️ Architecture

### Stack technique
- **Frontend :** React 18 + TypeScript + Tailwind CSS
- **Backend :** Django 4.2 + Django REST Framework
- **Base de données :** PostgreSQL 15
- **Cache :** Redis 6
- **Authentification :** JWT + OAuth2

### Structure du projet
```
condaura/
├── backend/                 # API Django
│   ├── condaura/           # Configuration principale
│   ├── apps/               # Applications Django
│   │   ├── authentication/ # Gestion des utilisateurs
│   │   ├── campaigns/      # Campagnes de revue
│   │   ├── access/         # Gestion des accès
│   │   └── reports/        # Exports et rapports
│   └── requirements.txt
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages principales
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilitaires
│   └── package.json
├── docker-compose.yml      # Configuration Docker
└── README.md
```

---

## 🎨 Design System

### Palette de couleurs
- **Primaire :** `#3d1b3` - Bleu profond (brand principal)
- **Secondaire :** `#fcfdc` - Bleu clair (accents)
- **Highlights :** `#31aef8` - Turquoise (liens, actions)
- **Doux :** `#a6d0f4` - Violet doux (éléments secondaires)
- **Subtil :** `#7bd3f0` - Lavande (arrière-plans)

### Composants UI
- **Boutons :** Coins arrondis, états hover/focus
- **Cards :** Ombres subtiles, bordures douces
- **Formulaires :** Validation en temps réel
- **Tables :** Tri, filtres, pagination intégrés

---

## 📚 Guide d'utilisation

### 1. Première configuration

```bash
# Accéder à l'interface d'administration
http://localhost:8000/admin/

# Ou utiliser l'interface principale
http://localhost:3000/
```

### 2. Import des données

#### Format CSV Utilisateurs
```csv
user_id,email,first_name,last_name,department,manager_email,status
U001,john.doe@company.com,John,Doe,IT,manager@company.com,active
U002,jane.smith@company.com,Jane,Smith,Finance,manager@company.com,active
```

#### Format CSV Accès
```csv
access_id,user_id,resource_name,resource_type,access_level,granted_date,last_used
A001,U001,SharePoint Marketing,Application,Read/Write,2024-01-15,2025-03-20
A002,U001,Database HR,Database,Read Only,2024-02-01,2025-05-15
```

### 3. Création d'une campagne

1. **Naviguer** vers "Campagnes" → "Nouvelle campagne"
2. **Configurer** les paramètres (nom, dates, périmètre)
3. **Attribuer** les réviseurs automatiquement ou manuellement
4. **Lancer** la campagne

### 4. Processus de revue

1. **Connexion** en tant que réviseur
2. **Consultation** de la liste des accès assignés
3. **Actions** : Valider ✅ / Révoquer ❌ / Reporter 📅
4. **Commentaires** obligatoires pour les révocations

---

## 🧪 Tests

### Lancer les tests backend
```bash
cd backend/
python manage.py test
```

### Lancer les tests frontend
```bash
cd frontend/
npm test
```

### Tests d'intégration
```bash
# Avec Docker Compose
docker-compose run --rm backend python manage.py test
docker-compose run --rm frontend npm test
```

---

## 📊 API Documentation

### Endpoints principaux

#### Authentification
```http
POST /api/auth/login/           # Connexion
POST /api/auth/logout/          # Déconnexion  
POST /api/auth/register/        # Inscription
POST /api/auth/refresh/         # Refresh token
```

#### Gestion des données
```http
GET  /api/users/               # Liste utilisateurs
POST /api/users/import/        # Import CSV utilisateurs
GET  /api/access/              # Liste des accès
POST /api/access/import/       # Import CSV accès
```

#### Campagnes
```http
GET    /api/campaigns/         # Liste des campagnes
POST   /api/campaigns/         # Créer campagne
GET    /api/campaigns/{id}/    # Détail campagne
PUT    /api/campaigns/{id}/    # Modifier campagne
DELETE /api/campaigns/{id}/    # Supprimer campagne
```

#### Revues
```http
GET  /api/reviews/             # Accès à réviser
POST /api/reviews/             # Soumettre décision
GET  /api/reviews/stats/       # Statistiques
```

### Documentation interactive
Une fois l'application lancée, accédez à :
- **Swagger UI :** `http://localhost:8000/api/docs/`
- **ReDoc :** `http://localhost:8000/api/redoc/`

---

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# Base de données
DATABASE_URL=postgresql://condaura:password@localhost:5432/condaura_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Django
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Email (pour les notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_EXPIRATION_HOURS=24

# Frontend
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_VERSION=1.0.0-mvp
```

### Configuration Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: condaura_db
      POSTGRES_USER: condaura
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://condaura:password@db:5432/condaura_db
      - REDIS_URL=redis://redis:6379/0

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_BASE_URL=http://localhost:8000/api

volumes:
  postgres_data:
```

---

## 🚀 Déploiement

### Déploiement local (développement)
```bash
docker-compose up -d
```

### Déploiement staging
```bash
# Utiliser le docker-compose.staging.yml
docker-compose -f docker-compose.staging.yml up -d
```

### Déploiement production

#### Avec Docker Swarm
```bash
docker stack deploy -c docker-compose.prod.yml condaura
```

#### Avec Kubernetes
```bash
kubectl apply -f k8s/
```

#### Variables d'environnement production
- Désactiver `DEBUG=False`
- Configurer `ALLOWED_HOSTS` correctement
- Utiliser des bases de données managées
- Configurer le HTTPS
- Activer les logs de production

---

## 📈 Monitoring et logs

### Logs de l'application
```bash
# Logs en temps réel
docker-compose logs -f backend
docker-compose logs -f frontend

# Logs d'une période spécifique
docker-compose logs --since="2025-05-28T10:00:00" backend
```

### Métriques importantes
- Temps de réponse API (< 2 secondes)
- Taux d'erreur (< 1%)
- Utilisation CPU/RAM
- Connexions base de données

---

## 🤝 Contribution

### Workflow de développement

1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commiter** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** sur la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Standards de code

#### Backend (Python)
```bash
# Formatter le code
black .
isort .

# Linter
flake8 .
pylint apps/
```

#### Frontend (TypeScript/React)
```bash
# Formatter le code  
npm run format

# Linter
npm run lint

# Type checking
npm run type-check
```

### Commit messages
Utiliser la convention [Conventional Commits](https://www.conventionalcommits.org/) :
```
feat: add campaign recurring functionality
fix: resolve CSV import encoding issue
docs: update API documentation
style: format code with prettier
refactor: reorganize components structure
test: add integration tests for campaigns
```

---

## 🐛 Résolution des problèmes

### Problèmes courants

#### Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps

# Recréer la base de données
docker-compose down -v
docker-compose up -d db
docker-compose exec backend python manage.py migrate
```

#### Erreur de build frontend
```bash
# Nettoyer le cache npm
npm clean-install

# Reconstruire l'image Docker
docker-compose build --no-cache frontend
```

#### Problème de permissions
```bash
# Ajuster les permissions des fichiers
sudo chown -R $USER:$USER .

# Permissions pour les volumes Docker
sudo chmod -R 755 ./data/
```

### Debug mode

#### Backend Django
```python
# settings.py
DEBUG = True
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

#### Frontend React
```javascript
// Activer les React DevTools
if (process.env.NODE_ENV === 'development') {
  console.log('Debug mode enabled');
}
```

---

## 📝 Roadmap

### Version 1.1 (Phase 2 - Semaines 11-16)
- [ ] Notifications automatiques par email
- [ ] Campagnes récurrentes programmables  
- [ ] Attribution automatique des réviseurs
- [ ] Filtres et recherche avancée
- [ ] Tableau de bord avec métriques temps réel

### Version 1.2 (Phase 3 - Semaines 17-22)
- [ ] Audit trail complet
- [ ] Exports certifiés pour compliance
- [ ] Alertes sur accès privilégiés
- [ ] Contrôle d'accès granulaire (RBAC)

### Version 2.0 (Phase 4 - Semaines 23-30)
- [ ] Connecteurs Azure AD / Google Workspace
- [ ] API publique REST/GraphQL
- [ ] Webhooks pour intégrations SIEM
- [ ] SSO enterprise (SAML)

---

## 📄 License

Ce projet est sous licence propriétaire. Tous droits réservés.

**© 2025 Archange Elie Yatte - Condaura**

---

## 👤 Auteur

**Archange Elie Yatte**
- GitHub: [@your-github](https://github.com/your-github)
- LinkedIn: [Votre LinkedIn](https://linkedin.com/in/your-profile)
- Email: your.email@condaura.com

---

## 🙏 Remerciements

- Merci à la communauté open source pour les outils utilisés
- Inspiration design basée sur les meilleures pratiques UX/UI modernes
- Tests utilisateurs réalisés avec des professionnels de la sécurité IT

---

## 📞 Support

Pour toute question ou problème :

- 📧 **Email :** support@condaura.com
- 📖 **Documentation :** [docs.condaura.com](https://docs.condaura.com)
- 🐛 **Bug reports :** [GitHub Issues](https://github.com/your-username/condaura/issues)
- 💬 **Discord :** [Communauté Condaura](https://discord.gg/condaura)

---

<div align="center">

**⭐ Si ce projet vous plaît, n'hésitez pas à lui donner une étoile !**

[🚀 Démo en ligne](https://demo.condaura.com) | [📖 Documentation](https://docs.condaura.com) | [🎯 Roadmap](https://github.com/your-username/condaura/projects)

</div>