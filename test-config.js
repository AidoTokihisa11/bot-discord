import { config } from 'dotenv';
import chalk from 'chalk';

// Charger les variables d'environnement
config();

console.log(chalk.blue('🔍 Test de Configuration du Bot Discord'));
console.log(chalk.gray('=' .repeat(50)));

// Variables requises
const requiredVars = [
    'DISCORD_TOKEN',
    'CLIENT_ID'
];

// Variables optionnelles
const optionalVars = [
    'GUILD_ID',
    'DEPLOY_CHANNEL_ID',
    'DEV_USER_ID_2',
    'NODE_ENV'
];

let hasErrors = false;

console.log(chalk.blue('\n📋 Variables d\'environnement requises:'));
requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        // Masquer les tokens sensibles
        const displayValue = varName.includes('TOKEN') ? '***MASQUÉ***' : value;
        console.log(chalk.green(`✅ ${varName}: ${displayValue}`));
    } else {
        console.log(chalk.red(`❌ ${varName}: MANQUANT`));
        hasErrors = true;
    }
});

console.log(chalk.blue('\n📋 Variables d\'environnement optionnelles:'));
optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(chalk.green(`✅ ${varName}: ${value}`));
    } else {
        console.log(chalk.yellow(`⚠️ ${varName}: Non défini (optionnel)`));
    }
});

// Validation du token Discord
if (process.env.DISCORD_TOKEN) {
    const token = process.env.DISCORD_TOKEN;
    if (token.length < 50) {
        console.log(chalk.red('\n❌ Token Discord trop court (probablement invalide)'));
        hasErrors = true;
    } else if (!token.includes('.')) {
        console.log(chalk.red('\n❌ Format de token Discord invalide'));
        hasErrors = true;
    } else {
        console.log(chalk.green('\n✅ Format de token Discord valide'));
    }
}

// Validation du CLIENT_ID
if (process.env.CLIENT_ID) {
    const clientId = process.env.CLIENT_ID;
    if (!/^\d+$/.test(clientId)) {
        console.log(chalk.red('\n❌ CLIENT_ID doit être un nombre'));
        hasErrors = true;
    } else {
        console.log(chalk.green('\n✅ Format CLIENT_ID valide'));
    }
}

// Résultat final
console.log(chalk.blue('\n🎯 Résultat du test:'));
if (hasErrors) {
    console.log(chalk.red('❌ Configuration incomplète ou invalide'));
    console.log(chalk.yellow('\n💡 Actions à effectuer:'));
    console.log(chalk.yellow('1. Vérifiez votre fichier .env'));
    console.log(chalk.yellow('2. Régénérez votre token Discord si nécessaire'));
    console.log(chalk.yellow('3. Assurez-vous que toutes les variables requises sont définies'));
    process.exit(1);
} else {
    console.log(chalk.green('✅ Configuration valide !'));
    console.log(chalk.green('\n🚀 Vous pouvez maintenant déployer le bot avec: npm run deploy'));
    process.exit(0);
}
