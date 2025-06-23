import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import chalk from 'chalk';

// Configuration
config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const commandsPath = join(__dirname, 'commands');

// Fonction pour charger les commandes récursivement
async function loadCommands(dir = commandsPath, baseDir = commandsPath) {
    const files = readdirSync(dir);
    
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            await loadCommands(filePath, baseDir);
        } else if (file.endsWith('.js')) {
            try {
                const command = await import(pathToFileURL(filePath).href);
                const commandData = command.default || command;
                
                if ('data' in commandData && 'execute' in commandData) {
                    commands.push(commandData.data.toJSON());
                    console.log(chalk.green('✅') + ` Commande chargée: ${chalk.cyan(commandData.data.name)}`);
                } else {
                    console.log(chalk.yellow('⚠️') + ` Commande ${chalk.red(file)} manque 'data' ou 'execute'`);
                }
            } catch (error) {
                console.log(chalk.red('❌') + ` Erreur lors du chargement de ${chalk.red(file)}:`, error.message);
            }
        }
    }
}

// Fonction avec timeout pour les requêtes API
async function withTimeout(promise, timeoutMs, description) {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout (${timeoutMs}ms) pour: ${description}`)), timeoutMs)
        )
    ]);
}

async function deployQuickCommands() {
    console.log(chalk.blue('🚀 Déploiement RAPIDE des commandes Discord...'));
    console.log(chalk.gray('=' .repeat(60)));
    
    try {
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        // Étape 1: Charger les commandes
        console.log(chalk.blue('📦 Chargement des commandes...'));
        await loadCommands();
        
        if (commands.length === 0) {
            console.log(chalk.red('❌ Aucune commande trouvée !'));
            process.exit(1);
        }
        
        console.log(chalk.gray('=' .repeat(60)));
        console.log(chalk.blue(`📦 ${commands.length} commande(s) à déployer...`));
        
        // Étape 2: Déployer sur le serveur spécifique UNIQUEMENT (plus rapide)
        if (process.env.GUILD_ID) {
            console.log(chalk.yellow('⚡ Déploiement sur le serveur configuré...'));
            try {
                const guildData = await withTimeout(
                    rest.put(
                        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                        { body: commands }
                    ),
                    15000, // 15 secondes max
                    'déploiement serveur'
                );
                
                console.log(chalk.green(`✅ ${guildData.length} commande(s) déployée(s) sur le serveur !`));
                
                // Afficher la liste des commandes déployées
                console.log(chalk.gray('=' .repeat(60)));
                console.log(chalk.blue('📋 Commandes déployées:'));
                
                guildData.forEach((command, index) => {
                    const emoji = getCommandEmoji(command.name);
                    console.log(chalk.gray(`${index + 1}.`) + ` ${emoji} ${chalk.cyan(command.name)} - ${chalk.gray(command.description)}`);
                });
                
                console.log(chalk.gray('=' .repeat(60)));
                console.log(chalk.green('🎉 DÉPLOIEMENT RAPIDE RÉUSSI !'));
                console.log(chalk.yellow('⚡ Les commandes sont disponibles immédiatement sur votre serveur !'));
                console.log(chalk.blue('💡 Astuce: Utilisez /help pour voir toutes les commandes'));
                
            } catch (error) {
                console.log(chalk.red(`❌ Erreur sur le serveur configuré: ${error.message}`));
                throw error;
            }
        } else {
            console.log(chalk.yellow('⚠️ GUILD_ID non défini, déploiement global uniquement...'));
            
            // Déploiement global avec timeout court
            const globalData = await withTimeout(
                rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: commands }
                ),
                20000, // 20 secondes max
                'déploiement global'
            );
            
            console.log(chalk.green(`✅ ${globalData.length} commande(s) déployée(s) globalement !`));
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du déploiement:'), error.message);
        console.log(chalk.yellow('💡 Suggestions:'));
        console.log(chalk.yellow('  • Vérifiez votre connexion internet'));
        console.log(chalk.yellow('  • Vérifiez que le token Discord est valide'));
        console.log(chalk.yellow('  • Vérifiez que GUILD_ID est correct'));
        process.exit(1);
    }
    
    // Terminer proprement
    console.log(chalk.blue('✨ Script terminé !'));
    process.exit(0);
}

// Fonction pour obtenir un emoji basé sur le nom de la commande
function getCommandEmoji(commandName) {
    const emojiMap = {
        'help': '❓',
        'ping': '🏓',
        'setup-tickets': '🎫',
        'ticket-stats': '📊',
        'analyze-server': '🔍',
        'check-permissions': '🔐',
        'deploy': '🚀',
        'reglement': '📋',
        'setup-permissions': '⚙️',
        'ticket': '🎫'
    };
    
    return emojiMap[commandName] || '⚡';
}

// Gestion propre des signaux d'arrêt
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⚠️ Arrêt demandé par l\'utilisateur'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n⚠️ Arrêt du processus'));
    process.exit(0);
});

// Lancer le déploiement rapide
deployQuickCommands();
