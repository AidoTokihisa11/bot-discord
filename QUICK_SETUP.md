# 🚀 Configuration Rapide - URGENT

## ❌ Problème Actuel
Erreur 401 Unauthorized - Vos variables d'environnement ne sont pas configurées.

## ✅ Solution Immédiate

### 1. Régénérer le Token Discord
1. Allez sur https://discord.com/developers/applications
2. Sélectionnez votre application bot
3. Onglet "Bot" → Cliquez "Reset Token"
4. Copiez le nouveau token (commence par MTM...)

### 2. Configurer le fichier .env
Remplacez les valeurs dans votre fichier `.env` :

```env
# Remplacez par vos VRAIES valeurs
DISCORD_TOKEN=MTM2OTcyMTM1NjM4NzYxODgzNg.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXX
CLIENT_ID=1369721356387618836
DEPLOY_CHANNEL_ID=1368933588976013392
DEV_USER_ID_2=421245210220298240
NODE_ENV=development
```

### 3. Tester le Nouveau Script
```bash
# Maintenant npm run deploy utilise le script sécurisé
npm run deploy
```

## 🔍 Vérification
Le nouveau script vous dira exactement quel est le problème :
- ✅ Token valide → Déploiement réussi
- ❌ Token invalide → Message d'erreur clair
- ❌ Variables manquantes → Liste des variables requises

## 🆘 Si ça ne marche toujours pas
```bash
# Test direct du script sécurisé
node src/deploy-secure.js

# Vérification de la configuration
node test-connection.js
```

---
**⚠️ IMPORTANT :** Le script `npm run deploy` utilise maintenant le nouveau script sécurisé qui résout les timeouts !
