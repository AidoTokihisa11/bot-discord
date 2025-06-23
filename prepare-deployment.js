import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import chalk from 'chalk';

console.log(chalk.blue('🚀 Préparation pour l\'hébergement gratuit'));
console.log(chalk.yellow('=' .repeat(50)));

// Fonction pour exécuter des commandes
function runCommand(command, description) {
    try {
        console.log(chalk.blue(`⏳ ${description}...`));
        execSync(command, { stdio: 'inherit' });
        console.log(chalk.green(`✅ ${description} terminé`));
        return true;
    } catch (error) {
        console.log(chalk.red(`❌ Erreur lors de ${description}`));
        console.log(chalk.yellow(`💡 Commande manuelle: ${command}`));
        return false;
    }
}

// Vérifications préliminaires
console.log(chalk.blue('\n🔍 Vérifications préliminaires...'));

// 1. Vérifier si Git est initialisé
if (!existsSync('.git')) {
    console.log(chalk.yellow('📁 Initialisation de Git...'));
    runCommand('git init', 'Initialisation Git');
}

// 2. Vérifier le fichier .env
if (!existsSync('.env')) {
    console.log(chalk.red('❌ Fichier .env manquant !'));
    console.log(chalk.yellow('💡 Copiez .env.example vers .env et configurez vos valeurs'));
    process.exit(1);
}

// 3. Créer un fichier package.json optimisé pour le déploiement
console.log(chalk.blue('\n📦 Optimisation du package.json...'));
const packageJson = {
    "name": "discord-bot-secure",
    "version": "1.0.0",
    "description": "Bot Discord sécurisé avec système de tickets",
    "main": "src/index.js",
    "type": "module",
    "engines": {
        "node": ">=18.0.0"
    },
    "scripts": {
        "start": "node src/index.js",
        "deploy": "node src/deploy-secure.js",
        "dev": "node --watch src/index.js",
        "test": "node test-connection.js"
    },
    "dependencies": {
        "discord.js": "^14.14.1",
        "dotenv": "^16.3.1",
        "chalk": "^5.3.0"
    },
    "keywords": [
        "discord",
        "bot",
        "tickets",
        "secure"
    ],
    "author": "theog",
    "license": "MIT"
};

writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log(chalk.green('✅ package.json optimisé pour le déploiement'));

// 4. Créer un fichier README pour GitHub
console.log(chalk.blue('\n📝 Création du README pour GitHub...'));
const readmeContent = `# 🤖 Bot Discord Sécurisé

Bot Discord moderne avec système de tickets avancé.

## 🚀 Fonctionnalités

- 🎫 Système de tickets complet
- 🛡️ Sécurité renforcée
- 📊 Statistiques détaillées
- ⚙️ Configuration automatique

## 🔧 Installation

1. Clonez le repository
2. Installez les dépendances: \`npm install\`
3. Configurez le fichier \`.env\`
4. Déployez les commandes: \`npm run deploy\`
5. Démarrez le bot: \`npm start\`

## 📋 Variables d'Environnement

\`\`\`env
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id
NODE_ENV=production
\`\`\`

## 🆓 Hébergement Gratuit

Consultez \`HEBERGEMENT_GRATUIT.md\` pour déployer gratuitement sur Railway, Render, ou Koyeb.

## 📚 Documentation

- \`SECURITY.md\` - Guide de sécurité
- \`DEPLOYMENT_GUIDE.md\` - Guide de déploiement
- \`HEBERGEMENT_GRATUIT.md\` - Hébergement gratuit

## 🔒 Sécurité

Ce bot implémente les meilleures pratiques de sécurité :
- Token Discord protégé
- Variables d'environnement sécurisées
- Logs sanitisés
- Configuration validée
`;

writeFileSync('README.md', readmeContent);
console.log(chalk.green('✅ README.md créé'));

// 5. Préparer les fichiers pour Git
console.log(chalk.blue('\n📁 Préparation des fichiers Git...'));

// Ajouter tous les fichiers sauf ceux dans .gitignore
runCommand('git add .', 'Ajout des fichiers');

// Vérifier s'il y a des changements à commiter
try {
    execSync('git diff --cached --quiet');
    console.log(chalk.yellow('ℹ️ Aucun changement à commiter'));
} catch {
    // Il y a des changements, on peut commiter
    runCommand('git commit -m "🚀 Bot Discord sécurisé - prêt pour déploiement gratuit"', 'Commit initial');
}

// 6. Instructions finales
console.log(chalk.green('\n🎉 Préparation terminée !'));
console.log(chalk.blue('\n📋 Prochaines étapes pour l\'hébergement gratuit :'));
console.log(chalk.yellow('1. Créez un repository sur GitHub'));
console.log(chalk.yellow('2. Connectez votre repository local :'));
console.log(chalk.cyan('   git remote add origin https://github.com/VOTRE_USERNAME/bot-discord.git'));
console.log(chalk.cyan('   git branch -M main'));
console.log(chalk.cyan('   git push -u origin main'));
console.log(chalk.yellow('3. Allez sur Railway.app ou Render.com'));
console.log(chalk.yellow('4. Connectez votre repository GitHub'));
console.log(chalk.yellow('5. Configurez les variables d\'environnement'));
console.log(chalk.yellow('6. Déployez !'));

console.log(chalk.blue('\n📖 Consultez HEBERGEMENT_GRATUIT.md pour le guide détaillé'));

// 7. Test final
console.log(chalk.blue('\n🧪 Test final du déploiement...'));
try {
    execSync('npm run deploy', { stdio: 'inherit' });
    console.log(chalk.green('\n✅ Votre bot est prêt pour l\'hébergement gratuit !'));
} catch (error) {
    console.log(chalk.red('\n❌ Erreur lors du test de déploiement'));
    console.log(chalk.yellow('💡 Vérifiez votre fichier .env et réessayez'));
}
