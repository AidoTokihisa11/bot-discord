import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';

// Configuration
config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
let commandCount = 0;

// Fonction pour charger les commandes récursivement
async function loadCommands(dir = join(__dirname, 'commands'), baseDir = join(__dirname, 'commands')) {
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
                    commandCount++;
                    console.log(chalk.green(`✅ Commande chargée: ${commandData.data.name}`));
                } else {
                    console.log(chalk.yellow(`⚠️ Commande ${file} manque 'data' ou 'execute'`));
                }
            } catch (error) {
                console.log(chalk.red(`❌ Erreur lors du chargement de ${file}:`), error.message);
            }
        }
    }
}

async function deployCommands() {
    try {
        console.log(chalk.blue('🚀 Démarrage du déploiement des commandes...'));
        
        // Chargement des commandes
        await loadCommands();
        console.log(chalk.cyan(`📁 ${commandCount} commande(s) trouvée(s)`));

        if (commands.length === 0) {
            console.log(chalk.red('❌ Aucune commande à déployer'));
            return;
        }

        // Construction du REST client
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        console.log(chalk.blue('🔄 Déploiement des commandes en cours...'));

        // Déploiement global (recommandé pour la production)
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(chalk.green(`✅ ${data.length} commande(s) déployée(s) avec succès !`));
        
        // Afficher la liste des commandes déployées
        console.log(chalk.cyan('\n📋 Commandes déployées:'));
        data.forEach(command => {
            console.log(chalk.white(`  • /${command.name} - ${command.description}`));
        });

        console.log(chalk.green('\n🎉 Déploiement terminé avec succès !'));

    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du déploiement:'), error);
        
        if (error.code === 50001) {
            console.log(chalk.yellow('💡 Conseil: Vérifiez que le bot a les permissions nécessaires'));
        } else if (error.code === 20012) {
            console.log(chalk.yellow('💡 Conseil: Vérifiez vos IDs d\'application et de serveur'));
        }
    }
}

// Fonction pour déploiement en mode développement (serveur spécifique)
async function deployCommandsDev(guildId) {
    try {
        console.log(chalk.blue('🔧 Démarrage du déploiement DEV...'));
        
        await loadCommands();
        console.log(chalk.cyan(`📁 ${commandCount} commande(s) trouvée(s)`));

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: commands },
        );

        console.log(chalk.green(`✅ ${data.length} commande(s) déployée(s) sur le serveur ${guildId} !`));
        console.log(chalk.yellow('⚡ Les commandes seront disponibles immédiatement sur ce serveur'));

    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du déploiement DEV:'), error);
    }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--dev') || args.includes('-d')) {
    const guildId = process.env.GUILD_ID;
    if (!guildId) {
        console.log(chalk.red('❌ GUILD_ID non défini dans .env pour le mode développement'));
        process.exit(1);
    }
    deployCommandsDev(guildId);
} else if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.cyan(`
📚 Aide pour le déploiement des commandes:

Usage: node deploy-commands.js [options]

Options:
  --dev, -d     Déploiement en mode développement (serveur spécifique)
  --help, -h    Afficher cette aide

Variables d'environnement requises:
  DISCORD_TOKEN    Token du bot Discord
  CLIENT_ID        ID de l'application Discord
  GUILD_ID         ID du serveur (pour le mode dev uniquement)

Exemples:
  node deploy-commands.js              # Déploiement global
  node deploy-commands.js --dev        # Déploiement sur serveur spécifique
`));
} else {
    deployCommands();
}

export { deployCommands, deployCommandsDev };
