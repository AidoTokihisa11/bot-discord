import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import chalk from 'chalk';

// Configuration
config();

async function deployDataDeletionCommand() {
    try {
        console.log(chalk.blue('🚀 Déploiement forcé de la commande suppression_donnees...'));

        // Définir directement la commande pour éviter les problèmes d'import
        const commandData = {
            name: 'suppression_donnees',
            description: '🗑️ COMMANDE FINALE - Suppression complète et décommissionnement total du système',
            default_member_permissions: null, // Pas de restriction de permissions par défaut
            options: [
                {
                    name: 'confirmation',
                    description: 'Tapez "CONFIRMER-SUPPRESSION-DEFINITIVE" pour valider',
                    type: 3, // STRING
                    required: true
                },
                {
                    name: 'raison',
                    description: 'Raison détaillée de la suppression (obligatoire pour audit)',
                    type: 3, // STRING
                    required: true
                },
                {
                    name: 'export_audit',
                    description: 'Exporter un rapport d\'audit avant suppression',
                    type: 5, // BOOLEAN
                    required: false
                }
            ]
        };

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        console.log(chalk.yellow('🔄 Déploiement global en cours...'));

        // Déploiement global
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [commandData] },
        );

        console.log(chalk.green(`✅ Commande suppression_donnees déployée avec succès !`));
        console.log(chalk.cyan('📋 Détails de la commande:'));
        console.log(chalk.white(`  • /${data[0].name} - ${data[0].description}`));
        console.log(chalk.yellow('⏰ La commande sera disponible dans 1-5 minutes sur tous les serveurs'));

    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du déploiement:'), error);
        
        if (error.code === 50001) {
            console.log(chalk.yellow('💡 Le bot n\'a pas les permissions nécessaires'));
        } else if (error.code === 20012) {
            console.log(chalk.yellow('💡 Vérifiez vos IDs d\'application dans .env'));
        } else if (error.rawError && error.rawError.message) {
            console.log(chalk.red('💥 Détail de l\'erreur:', error.rawError.message));
        }
    }
}

// Déploiement en mode développement pour test immédiat
async function deployDataDeletionCommandDev() {
    try {
        const guildId = process.env.GUILD_ID;
        if (!guildId) {
            console.log(chalk.red('❌ GUILD_ID non défini pour le déploiement DEV'));
            return;
        }

        console.log(chalk.blue('🔧 Déploiement DEV de la commande suppression_donnees...'));

        const commandData = {
            name: 'suppression_donnees',
            description: '🗑️ COMMANDE FINALE - Suppression complète et décommissionnement total du système',
            default_member_permissions: null,
            options: [
                {
                    name: 'confirmation',
                    description: 'Tapez "CONFIRMER-SUPPRESSION-DEFINITIVE" pour valider',
                    type: 3,
                    required: true
                },
                {
                    name: 'raison',
                    description: 'Raison détaillée de la suppression (obligatoire pour audit)',
                    type: 3,
                    required: true
                },
                {
                    name: 'export_audit',
                    description: 'Exporter un rapport d\'audit avant suppression',
                    type: 5,
                    required: false
                }
            ]
        };

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: [commandData] },
        );

        console.log(chalk.green(`✅ Commande suppression_donnees déployée sur le serveur ${guildId} !`));
        console.log(chalk.yellow('⚡ Disponible immédiatement sur ce serveur'));

    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du déploiement DEV:'), error);
    }
}

// Gestion des arguments
const args = process.argv.slice(2);

if (args.includes('--dev') || args.includes('-d')) {
    deployDataDeletionCommandDev();
} else {
    deployDataDeletionCommand();
}

console.log(chalk.cyan(`
🔧 Commande disponible:
   node force-deploy-data-deletion.js        # Déploiement global
   node force-deploy-data-deletion.js --dev  # Déploiement serveur spécifique
`));
