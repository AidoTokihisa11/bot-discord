# 🤖 Bot Discord - Système de Tickets Avancé

Bot Discord moderne avec système de tickets complet, prêt pour l'hébergement gratuit 24h/24.

## 🚀 Déploiement Rapide

### 1. Configuration
```bash
# 1. Cloner le projet
git clone https://github.com/AidoTokihisa11/bot-discord.git
cd bot-discord

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos vraies valeurs

# 4. Déployer les commandes
npm run deploy

# 5. Démarrer le bot
npm start
```

### 2. Variables d'Environnement Requises
```env
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
NODE_ENV=production
```

## 🆓 Hébergement Gratuit 24h/24

### Railway (Recommandé)
1. Créez un compte sur [Railway.app](https://railway.app)
2. Connectez votre repository GitHub
3. Configurez les variables d'environnement
4. Déploiement automatique !

### Render
1. Créez un compte sur [Render.com](https://render.com)
2. Créez un nouveau "Web Service"
3. Connectez votre repository
4. Configurez les variables d'environnement

### Koyeb
1. Créez un compte sur [Koyeb.com](https://koyeb.com)
2. Déployez depuis GitHub
3. Configurez les variables d'environnement

## 🎫 Fonctionnalités

### Système de Tickets Complet
- **6 catégories de support** avec SLA définis
- **Interface moderne** avec menus déroulants et boutons
- **Notifications automatiques** aux modérateurs
- **Gestion des permissions** automatique
- **Statistiques détaillées** en temps réel

### Catégories Disponibles
- 🔧 **Support Technique** (< 2h)
- ❓ **Questions Générales** (< 4h)  
- 🚨 **Signalement Urgent** (< 1h)
- 🤝 **Partenariat** (< 24h)
- 💡 **Suggestions** (< 12h)
- ⚖️ **Appel de Sanction** (< 6h)

### Commandes Principales
- `/setup-tickets` - Configuration initiale
- `/ticket-stats` - Statistiques détaillées
- `/help` - Aide générale
- `/ping` - Vérification du bot

## 🛡️ Sécurité

- ✅ **Token Discord protégé** - Jamais exposé dans les logs
- ✅ **Variables d'environnement sécurisées** - Exclusion complète du versioning
- ✅ **Base de données locale** - Données sensibles protégées
- ✅ **Gestion d'erreurs robuste** - Logs sécurisés
- ✅ **Permissions granulaires** - Principe du moindre privilège

## 📦 Scripts Disponibles

```bash
npm start          # Démarrer le bot
npm run deploy     # Déployer les commandes (sécurisé)
npm run dev        # Mode développement
npm test           # Tester la connexion
```

## 🔧 Configuration Discord

### Permissions Requises
- `bot` - Permissions de base
- `applications.commands` - Commandes slash
- `Send Messages` - Envoi de messages
- `Manage Channels` - Gestion des tickets
- `Manage Roles` - Gestion des permissions

### URL d'Invitation
```
https://discord.com/api/oauth2/authorize?client_id=VOTRE_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

## 📊 Monitoring

Le bot inclut un système de monitoring intégré :
- Métriques de performance
- Logs sécurisés (sans données sensibles)
- Statistiques d'utilisation
- Gestion automatique des erreurs

## 🚨 Résolution des Problèmes

### Token Invalide
1. Régénérez le token sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Mettez à jour la variable `DISCORD_TOKEN`
3. Redéployez le bot

### Permissions Insuffisantes
1. Utilisez `/check-permissions` pour diagnostiquer
2. Réinvitez le bot avec les bonnes permissions
3. Utilisez `/setup-permissions` pour la configuration automatique

### Timeout lors du Déploiement
Le script de déploiement gère automatiquement :
- Timeout étendu (60 secondes)
- Retry automatique (3 tentatives)
- Gestion des rate limits Discord

## 📁 Structure du Projet

```
bot-discord/
├── src/
│   ├── commands/          # Commandes slash
│   ├── events/            # Gestionnaires d'événements
│   ├── managers/          # Gestionnaires métier
│   ├── utils/             # Utilitaires
│   └── index.js           # Point d'entrée
├── .env.example           # Template de configuration
├── package.json           # Dépendances
└── README.md             # Ce fichier
```

## 🔄 Mise à Jour

Pour mettre à jour le bot :
1. Tirez les dernières modifications
2. Installez les nouvelles dépendances : `npm install`
3. Redéployez les commandes : `npm run deploy`
4. Redémarrez le bot

## 📞 Support

En cas de problème :
1. Vérifiez les logs du bot
2. Consultez la section "Résolution des Problèmes"
3. Créez un ticket dans la catégorie "Support Technique"

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

**🎉 Bot prêt pour l'hébergement gratuit 24h/24 !**

⚠️ **Important :** Assurez-vous de configurer correctement vos variables d'environnement avant le déploiement.
