import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import chalk from 'chalk';

// Configuration
config();

async function deployInstantCommand() {
    try {
        console.log(chalk.blue('⚡ DÉPLOIEMENT INSTANTANÉ - Commande suppression_donnees'));
        console.log(chalk.yellow('🎯 Cible: Serveur spécifique pour disponibilité immédiate'));

        const guildId = process.env.GUILD_ID || "1368917489160818728"; // Ton serveur
        
        // Commande avec accès élargi au rôle spécifié
        const commandData = {
            name: 'suppression_donnees',
            description: '🗑️ COMMANDE FINALE - Suppression complète et décommissionnement total du système',
            default_member_permissions: null, // Pas de restriction Discord native
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

        console.log(chalk.cyan(`🚀 Déploiement sur le serveur ${guildId}...`));

        // Déploiement spécifique au serveur = INSTANTANÉ
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
            { body: [commandData] },
        );

        console.log(chalk.green('✅ SUCCÈS ! Commande déployée instantanément !'));
        console.log(chalk.white(`📋 Commande: /${data[0].name}`));
        console.log(chalk.white(`📝 Description: ${data[0].description}`));
        
        console.log(chalk.yellow('\n🔐 ACCÈS AUTORISÉ POUR:'));
        console.log(chalk.white('  • AidoTokihisa (421245210220298240)'));
        console.log(chalk.white('  • Rôle spécifique (1387354997024624710)'));
        
        console.log(chalk.green('\n⚡ La commande est DISPONIBLE IMMÉDIATEMENT sur ton serveur !'));
        console.log(chalk.cyan('💡 Utilise: /suppression_donnees pour l\'exécuter'));

    } catch (error) {
        console.error(chalk.red('❌ ERREUR lors du déploiement instantané:'), error);
        
        if (error.code === 50001) {
            console.log(chalk.yellow('💡 Le bot n\'a pas les permissions nécessaires'));
        } else if (error.code === 20012) {
            console.log(chalk.yellow('💡 Vérifiez vos IDs dans .env'));
        }
    }
}

deployInstantCommand();
