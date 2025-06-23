# 🔧 Résolution du Problème d'Authentification Git

## ❌ Problème Actuel
```
remote: Permission to Theo41/bot-discord.git denied to AidoTokihisaaa.
fatal: unable to access 'https://github.com/Theo41/bot-discord.git/': The requested URL returned error: 403
```

## 🔍 Cause
Vous êtes connecté avec le compte `AidoTokihisaaa` mais vous essayez d'accéder au repository de `Theo41`.

## ✅ Solutions (Choisissez une option)

### Option 1 : Utiliser votre compte actuel (AidoTokihisaaa)

#### 1.1 Créer un nouveau repository sur votre compte
1. Allez sur https://github.com/AidoTokihisaaa
2. Cliquez "New repository"
3. Nom : `bot-discord`
4. Cochez "Public" ou "Private"
5. Cliquez "Create repository"

#### 1.2 Changer l'URL du remote
```bash
# Supprimer l'ancien remote
git remote remove origin

# Ajouter le nouveau remote avec votre compte
git remote add origin https://github.com/AidoTokihisaaa/bot-discord.git

# Pousser vers votre repository
git push -u origin main
```

### Option 2 : Se connecter avec le compte Theo41

#### 2.1 Configurer Git avec le bon compte
```bash
# Configurer votre nom d'utilisateur
git config --global user.name "Theo41"
git config --global user.email "votre_email@example.com"
```

#### 2.2 Authentification avec token personnel
1. Allez sur https://github.com/settings/tokens
2. Cliquez "Generate new token (classic)"
3. Sélectionnez les permissions : `repo`, `workflow`
4. Copiez le token généré

#### 2.3 Utiliser le token pour l'authentification
```bash
# Méthode 1 : URL avec token
git remote set-url origin https://TOKEN@github.com/Theo41/bot-discord.git

# Méthode 2 : Utiliser Git Credential Manager
git push -u origin main
# Entrez votre nom d'utilisateur : Theo41
# Entrez votre mot de passe : VOTRE_TOKEN_PERSONNEL
```

### Option 3 : Utiliser SSH (Recommandé pour la sécurité)

#### 3.1 Générer une clé SSH
```bash
# Générer une nouvelle clé SSH
ssh-keygen -t ed25519 -C "votre_email@example.com"

# Démarrer l'agent SSH
eval "$(ssh-agent -s)"

# Ajouter la clé à l'agent
ssh-add ~/.ssh/id_ed25519
```

#### 3.2 Ajouter la clé SSH à GitHub
```bash
# Copier la clé publique
cat ~/.ssh/id_ed25519.pub
```
1. Allez sur https://github.com/settings/keys
2. Cliquez "New SSH key"
3. Collez votre clé publique
4. Cliquez "Add SSH key"

#### 3.3 Changer l'URL vers SSH
```bash
# Changer vers SSH
git remote set-url origin git@github.com:Theo41/bot-discord.git

# Tester la connexion
ssh -T git@github.com

# Pousser
git push -u origin main
```

## 🚀 Solution Rapide (Recommandée)

**Pour déployer rapidement, utilisez l'Option 1 :**

```bash
# 1. Supprimer l'ancien remote
git remote remove origin

# 2. Créer un repository sur github.com/AidoTokihisaaa
# 3. Ajouter le nouveau remote
git remote add origin https://github.com/AidoTokihisaaa/bot-discord.git

# 4. Pousser
git push -u origin main
```

## 🔄 Après avoir résolu le problème Git

Une fois que votre code est sur GitHub, vous pouvez :

### 1. Déployer sur Railway
1. Allez sur https://railway.app
2. Connectez-vous avec GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Sélectionnez votre repository `bot-discord`
5. Configurez les variables d'environnement

### 2. Déployer sur Render
1. Allez sur https://render.com
2. Connectez-vous avec GitHub
3. "New" → "Web Service"
4. Sélectionnez votre repository
5. Configurez les variables d'environnement

## 🆘 Si vous avez encore des problèmes

### Vérifier votre configuration Git
```bash
# Voir la configuration actuelle
git config --list

# Voir les remotes configurés
git remote -v

# Voir le statut
git status
```

### Nettoyer et recommencer
```bash
# Si tout est cassé, recommencer proprement
rm -rf .git
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/bot-discord.git
git push -u origin main
```

## 💡 Conseils

1. **Utilisez votre propre compte GitHub** (AidoTokihisaaa) pour éviter les problèmes de permissions
2. **Configurez un token personnel** pour l'authentification HTTPS
3. **Ou utilisez SSH** pour une sécurité maximale
4. **Vérifiez toujours** `git remote -v` avant de pousser

---

**🎯 Objectif :** Avoir votre code sur GitHub pour pouvoir le déployer gratuitement sur Railway ou Render !
