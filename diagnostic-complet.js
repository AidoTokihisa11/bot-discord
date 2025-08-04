import { config } from 'dotenv';
import chalk from 'chalk';
import { readdirSync } from 'fs';
import { join } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { dirname } from 'path';

config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(chalk.blue('🔍 DIAGNOSTIC COMPLET DU BOT'));
console.log(chalk.blue('============================\n'));

// 1. Vérification des variables d'environnement
console.log(chalk.cyan('1. Variables d\'environnement:'));
const requiredVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const optionalVars = ['DEPLOY_CHANNEL_ID', 'NODE_ENV', 'AUTO_DEPLOY_COMMANDS'];

for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value && value !== 'VOTRE_TOKEN_COMPLET_ICI') {
        console.log(chalk.green(`✅ ${varName}: ***CONFIGURÉ***`));
    } else {
        console.log(chalk.red(`❌ ${varName}: MANQUANT OU NON CONFIGURÉ`));
    }
}

for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
        console.log(chalk.yellow(`⚠️ ${varName}: ${value}`));
    } else {
        console.log(chalk.gray(`⚪ ${varName}: non défini`));
    }
}

// 2. Vérification des commandes
console.log(chalk.cyan('\n2. Vérification des commandes:'));
let commandCount = 0;
const commandsPath = join(__dirname, 'src', 'commands');

async function checkCommands(dir = commandsPath) {
    try {
        const files = readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = join(dir, file.name);
            
            if (file.isDirectory()) {
                await checkCommands(fullPath);
            } else if (file.name.endsWith('.js')) {
                try {
                    const command = await import(pathToFileURL(fullPath).href);
                    const commandData = command.default || command;
                    
                    if ('data' in commandData && 'execute' in commandData) {
                        commandCount++;
                        const relativePath = fullPath.replace(commandsPath, '').replace(/\\/g, '/');
                        console.log(chalk.green(`✅ ${commandData.data.name}${relativePath}`));
                        
                        // Vérification spéciale pour moderation
                        if (commandData.data.name === 'moderation') {
                            console.log(chalk.blue(`   🛡️ Sous-commandes: ${commandData.data.options?.length || 0}`));
                        }
                    } else {
                        console.log(chalk.red(`❌ ${file.name}: Structure invalide`));
                    }
                } catch (error) {
                    console.log(chalk.red(`❌ ${file.name}: ${error.message}`));
                }
            }
        }
    } catch (error) {
        console.log(chalk.red(`❌ Erreur lecture dossier: ${error.message}`));
    }
}

await checkCommands();
console.log(chalk.cyan(`\nTotal: ${commandCount} commande(s) valide(s)`));

// 3. Vérification des gestionnaires
console.log(chalk.cyan('\n3. Vérification des gestionnaires:'));
const managersPath = join(__dirname, 'src', 'managers');
const handlers = ['ModerationManager.js', 'TicketManager.js'];

for (const handler of handlers) {
    try {
        const handlerPath = join(managersPath, handler);
        await import(pathToFileURL(handlerPath).href);
        console.log(chalk.green(`✅ ${handler}`));
    } catch (error) {
        console.log(chalk.red(`❌ ${handler}: ${error.message}`));
    }
}

// 4. Conseils
console.log(chalk.cyan('\n4. Conseils pour résoudre les problèmes:'));
if (process.env.DISCORD_TOKEN === 'VOTRE_TOKEN_COMPLET_ICI') {
    console.log(chalk.red('❌ URGENT: Configurez votre token Discord dans le fichier .env'));
    console.log(chalk.yellow('   1. Allez sur https://discord.com/developers/applications'));
    console.log(chalk.yellow('   2. Sélectionnez votre application'));
    console.log(chalk.yellow('   3. Allez dans Bot > Token'));
    console.log(chalk.yellow('   4. Copiez le token et remplacez dans .env'));
}

console.log(chalk.yellow('💡 Pour déployer les commandes: npm run deploy-commands'));
console.log(chalk.yellow('💡 Pour forcer le déploiement: npm run force-deploy'));
console.log(chalk.yellow('💡 Pour tester le bot: npm start'));

console.log(chalk.blue('\n🎯 RÉSUMÉ:'));
if (commandCount >= 10 && process.env.DISCORD_TOKEN !== 'VOTRE_TOKEN_COMPLET_ICI') {
    console.log(chalk.green('✅ Configuration semble correcte'));
    console.log(chalk.green('🚀 Vous devriez pouvoir voir vos commandes sur Discord'));
} else {
    console.log(chalk.red('❌ Configuration incomplète'));
    console.log(chalk.yellow('🔧 Suivez les conseils ci-dessus pour corriger'));
}
