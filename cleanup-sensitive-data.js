import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

console.log(chalk.red('🚨 NETTOYAGE DES DONNÉES SENSIBLES'));
console.log(chalk.yellow('=' .repeat(50)));

// 1. Nettoyer le fichier .env (garder la structure mais vider les valeurs)
const envPath = '.env';
if (existsSync(envPath)) {
    console.log(chalk.blue('🧹 Nettoyage du fichier .env...'));
    
    const cleanEnvContent = `# Configuration Discord Bot - VALEURS NETTOYÉES
# Remplacez par vos vraies valeurs avant utilisation
DISCORD_TOKEN=your_new_discord_token_here
CLIENT_ID=your_client_id_here
#GUILD_ID=your_guild_id_here
DEPLOY_CHANNEL_ID=your_deploy_channel_id_here
DEV_USER_ID_2=your_dev_user_id_here

# Configuration de production
NODE_ENV=development
`;
    
    writeFileSync(envPath, cleanEnvContent);
    console.log(chalk.green('✅ Fichier .env nettoyé'));
} else {
    console.log(chalk.yellow('⚠️ Fichier .env non trouvé'));
}

// 2. Nettoyer la base de données (garder la structure mais vider les données)
const dbPath = join('data', 'database.json');
if (existsSync(dbPath)) {
    console.log(chalk.blue('🧹 Nettoyage de la base de données...'));
    
    const cleanDbContent = {
        "guilds": {},
        "users": {},
        "tickets": {},
        "ticketNumbers": {},
        "stats": {
            "totalTickets": 0,
            "totalCommands": 0,
            "startTime": Date.now()
        }
    };
    
    writeFileSync(dbPath, JSON.stringify(cleanDbContent, null, 2));
    console.log(chalk.green('✅ Base de données nettoyée'));
} else {
    console.log(chalk.yellow('⚠️ Base de données non trouvée'));
}

// 3. Afficher les instructions de sécurité
console.log(chalk.red('\n🔒 ACTIONS DE SÉCURITÉ REQUISES :'));
console.log(chalk.yellow('1. Régénérez votre token Discord sur Discord Developer Portal'));
console.log(chalk.yellow('2. Mettez à jour le fichier .env avec le nouveau token'));
console.log(chalk.yellow('3. Vérifiez que tous les fichiers sensibles sont dans .gitignore'));
console.log(chalk.yellow('4. Ne commitez JAMAIS le fichier .env'));

console.log(chalk.green('\n✅ Nettoyage terminé !'));
console.log(chalk.blue('📖 Consultez SECURITY.md pour plus d\'informations'));
