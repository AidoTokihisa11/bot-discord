# 🚀 Guide de Déploiement Sécurisé

Ce guide vous explique comment déployer votre bot Discord de manière sécurisée sur différentes plateformes.

## 🔒 Sécurité - Points Critiques

### ✅ Données Sécurisées
- ✅ Token Discord masqué dans les logs
- ✅ Variables d'environnement protégées
- ✅ Base de données exclue du versioning
- ✅ Configuration sécurisée avec validation
- ✅ Gestion d'erreurs améliorée

### ⚠️ IMPORTANT - Avant le Déploiement
1. **JAMAIS** commiter le fichier `.env` 
2. **TOUJOURS** utiliser `.env.example` comme modèle
3. **VÉRIFIER** que `data/` est dans `.gitignore`
4. **RÉGÉNÉRER** le token Discord si compromis

## 🛠️ Préparation du Déploiement

### 1. Configuration des Variables d'Environnement

Créez un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Remplissez les valeurs dans `.env` :
```env
DISCORD_TOKEN=votre_token_discord_ici
CLIENT_ID=votre_client_id_ici
GUILD_ID=votre_guild_id_ici (optionnel)
DEPLOY_CHANNEL_ID=votre_channel_id_ici (optionnel)
DEV_USER_ID_2=votre_user_id_ici (optionnel)
NODE_ENV=production
```

### 2. Test Local

```bash
# Test de la configuration
node test-connection.js

# Test du déploiement sécurisé
npm run deploy

# Démarrage du bot
npm start
```

## 🌐 Plateformes de Déploiement

### 1. Railway (Recommandé)

#### Avantages
- ✅ Déploiement automatique depuis Git
- ✅ Variables d'environnement sécurisées
- ✅ Logs en temps réel
- ✅ Redémarrage automatique
- ✅ Plan gratuit disponible

#### Étapes de Déploiement

1. **Créer un compte sur Railway.app**

2. **Connecter votre repository Git**
   ```bash
   # Initialiser Git si pas fait
   git init
   git add .
   git commit -m "Initial commit - bot sécurisé"
   git remote add origin https://github.com/votre-username/bot-discord.git
   git push -u origin main
   ```

3. **Configurer les variables d'environnement sur Railway**
   - `DISCORD_TOKEN` : Votre token Discord
   - `CLIENT_ID` : ID de votre application Discord
   - `NODE_ENV` : `production`
   - `GUILD_ID` : (optionnel) ID de votre serveur
   - `DEPLOY_CHANNEL_ID` : (optionnel) ID du canal de notifications

4. **Configurer le démarrage**
   - Start Command: `npm start`
   - Build Command: `npm install`

### 2. Heroku

#### Configuration
```bash
# Installer Heroku CLI
# Créer une app
heroku create votre-bot-discord

# Configurer les variables
heroku config:set DISCORD_TOKEN=votre_token
heroku config:set CLIENT_ID=votre_client_id
heroku config:set NODE_ENV=production

# Déployer
git push heroku main
```

### 3. Render

#### Configuration
1. Connecter votre repository
2. Configurer les variables d'environnement
3. Start Command: `npm start`
4. Build Command: `npm install`

### 4. DigitalOcean App Platform

#### Configuration
```yaml
# app.yaml
name: discord-bot
services:
- name: bot
  source_dir: /
  github:
    repo: votre-username/bot-discord
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DISCORD_TOKEN
    value: ${DISCORD_TOKEN}
  - key: CLIENT_ID
    value: ${CLIENT_ID}
```

## 🔧 Scripts de Déploiement

### Déploiement Sécurisé
```bash
# Utilise la nouvelle configuration sécurisée
npm run deploy
```

### Déploiement Rapide (développement)
```bash
# Pour les tests rapides
npm run deploy:quick
```

## 📊 Monitoring et Logs

### Vérification du Statut
```bash
# Test de connexion
npm run test

# Logs en temps réel (sur la plateforme)
# Railway: Onglet "Logs"
# Heroku: heroku logs --tail
```

### Métriques Importantes
- ✅ Temps de réponse des commandes
- ✅ Utilisation mémoire
- ✅ Erreurs de connexion
- ✅ Rate limits Discord

## 🚨 Résolution des Problèmes

### Timeout lors du Déploiement
```bash
# Le nouveau script gère automatiquement :
# - Timeout étendu (60s)
# - Retry automatique (3 tentatives)
# - Gestion des rate limits
```

### Token Invalide
```bash
# Vérifier le token
echo $DISCORD_TOKEN

# Régénérer si nécessaire sur Discord Developer Portal
```

### Permissions Insuffisantes
```bash
# Vérifier les permissions du bot sur Discord Developer Portal
# Scopes requis : bot, applications.commands
# Permissions : Selon vos besoins
```

## 🔄 Mise à Jour

### Déploiement d'une Nouvelle Version
```bash
# 1. Tester localement
npm run deploy
npm start

# 2. Commiter les changements
git add .
git commit -m "Nouvelle fonctionnalité"
git push

# 3. La plateforme redéploie automatiquement
```

### Rollback en Cas de Problème
```bash
# Railway/Heroku : Interface web
# Ou revenir au commit précédent
git revert HEAD
git push
```

## 📋 Checklist de Déploiement

- [ ] ✅ Fichier `.env` configuré (mais pas commité)
- [ ] ✅ Variables d'environnement sur la plateforme
- [ ] ✅ Token Discord valide
- [ ] ✅ Permissions bot configurées
- [ ] ✅ Test local réussi
- [ ] ✅ Repository Git à jour
- [ ] ✅ Monitoring configuré
- [ ] ✅ Plan de rollback préparé

## 🆘 Support

En cas de problème :
1. Vérifiez les logs de la plateforme
2. Testez localement avec `npm run test`
3. Vérifiez la configuration Discord
4. Consultez la documentation de la plateforme

## 🔐 Sécurité Continue

### Bonnes Pratiques
- 🔄 Rotation régulière des tokens
- 📊 Monitoring des accès
- 🚫 Principe du moindre privilège
- 📝 Logs d'audit
- 🔒 Chiffrement des données sensibles

### Alertes à Configurer
- ❌ Échec de connexion Discord
- ⚠️ Rate limits atteints
- 💾 Utilisation mémoire élevée
- 🐛 Erreurs répétées
