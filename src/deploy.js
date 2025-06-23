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

async function deployCommands() {
    console.log(chalk.blue('🚀 Déploiement des commandes Discord...'));
    console.log(chalk.gray('=' .repeat(50)));
    
    try {
        // Charger toutes les commandes
        await loadCommands();
        
        if (commands.length === 0) {
            console.log(chalk.red('❌ Aucune commande trouvée !'));
            process.exit(1);
        }
        
        console.log(chalk.gray('=' .repeat(50)));
        console.log(chalk.blue(`📦 ${commands.length} commande(s) à déployer...`));
        
        // Construire et préparer l'instance REST
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        // Déployer les commandes
        console.log(chalk.yellow('⏳ Déploiement en cours...'));
        
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        
        console.log(chalk.gray('=' .repeat(50)));
        console.log(chalk.green('🎉 Déploiement réussi !'));
        console.log(chalk.green(`✅ ${data.length} commande(s) déployée(s) globalement`));
        
        // Afficher la liste des commandes déployées
        console.log(chalk.gray('=' .repeat(50)));
        console.log(chalk.blue('📋 Commandes déployées:'));
        
        data.forEach((command, index) => {
            const emoji = getCommandEmoji(command.name);
            console.log(chalk.gray(`${index + 1}.`) + ` ${emoji} ${chalk.cyan(command.name)} - ${chalk.gray(command.description)}`);
        });
        
        console.log(chalk.gray('=' .repeat(50)));
        console.log(chalk.green('🎊 Toutes les commandes ont été déployées avec succès !'));
        console.log(chalk.gray('Les commandes peuvent prendre jusqu\'à 1 heure pour apparaître globalement.'));
        
    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du déploiement:'), error);
        process.exit(1);
    }
}

// Fonction pour obtenir un emoji basé sur le nom de la commande
function getCommandEmoji(commandName) {
    const emojiMap = {
        'help': '❓',
        'ping': '🏓',
        'info': 'ℹ️',
        'stats': '📊',
        'config': '⚙️',
        'setup': '🔧',
        'ticket': '🎫',
        'close': '🔒',
        'ban': '🔨',
        'kick': '👢',
        'mute': '🔇',
        'warn': '⚠️',
        'clear': '🧹',
        'announce': '📢',
        'poll': '📊',
        'giveaway': '🎁',
        'music': '🎵',
        'play': '▶️',
        'stop': '⏹️',
        'skip': '⏭️',
        'queue': '📝',
        'volume': '🔊',
        'avatar': '🖼️',
        'userinfo': '👤',
        'serverinfo': '🏠',
        'roleinfo': '🎭',
        'channelinfo': '📺',
        'invite': '🔗',
        'suggest': '💡',
        'report': '🚨',
        'feedback': '📝',
        'bug': '🐛',
        'feature': '✨'
    };
    
    return emojiMap[commandName] || '⚡';
}

// Fonction pour déployer sur un serveur spécifique (pour les tests)
async function deployGuildCommands(guildId) {
    console.log(chalk.blue(`🚀 Déploiement des commandes pour le serveur ${guildId}...`));
    
    try {
        await loadCommands();
        
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: commands },
        );
        
        console.log(chalk.green(`✅ ${data.length} commande(s) déployée(s) pour le serveur ${guildId}`));
        
    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du déploiement sur le serveur:'), error);
    }
}

// Fonction pour supprimer toutes les commandes
async function deleteAllCommands() {
    console.log(chalk.red('🗑️ Suppression de toutes les commandes...'));
    
    try {
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] },
        );
        
        console.log(chalk.green('✅ Toutes les commandes ont été supprimées'));
        
    } catch (error) {
        console.error(chalk.red('❌ Erreur lors de la suppression:'), error);
    }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--guild') && args[args.indexOf('--guild') + 1]) {
    const guildId = args[args.indexOf('--guild') + 1];
    deployGuildCommands(guildId);
} else if (args.includes('--delete')) {
    deleteAllCommands();
} else if (args.includes('--help')) {
    console.log(chalk.blue('📖 Aide pour le déploiement des commandes:'));
    console.log('');
    console.log(chalk.cyan('node src/deploy.js') + chalk.gray(' - Déploie toutes les commandes globalement'));
    console.log(chalk.cyan('node src/deploy.js --guild <ID>') + chalk.gray(' - Déploie les commandes sur un serveur spécifique'));
    console.log(chalk.cyan('node src/deploy.js --delete') + chalk.gray(' - Supprime toutes les commandes'));
    console.log(chalk.cyan('node src/deploy.js --help') + chalk.gray(' - Affiche cette aide'));
    console.log('');
    console.log(chalk.yellow('⚠️ Note: Les commandes globales peuvent prendre jusqu\'à 1 heure pour apparaître.'));
    console.log(chalk.yellow('⚠️ Les commandes de serveur apparaissent instantanément.'));
} else {
    deployCommands();
}
