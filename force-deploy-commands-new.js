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

console.log(chalk.cyan('🔧 DÉPLOIEMENT FORCÉ DES COMMANDES SLASH'));
console.log(chalk.yellow('⚠️  Ce script va forcer la mise à jour de toutes les commandes'));

// Fonction pour charger les commandes récursivement
async function loadCommands(dir = join(__dirname, 'src', 'commands'), baseDir = join(__dirname, 'src', 'commands')) {
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

async function forceDeployCommands() {
    try {
        console.log(chalk.blue('\n🚀 Démarrage du déploiement forcé...'));
        
        // Vérifications des variables d'environnement
        if (!process.env.DISCORD_TOKEN) {
            console.log(chalk.red('❌ DISCORD_TOKEN manquant dans .env'));
            process.exit(1);
        }
        
        if (!process.env.CLIENT_ID) {
            console.log(chalk.red('❌ CLIENT_ID manquant dans .env'));
            process.exit(1);
        }
        
        // Chargement des commandes
        await loadCommands();
        console.log(chalk.cyan(`📁 ${commandCount} commande(s) trouvée(s)`));

        if (commands.length === 0) {
            console.log(chalk.red('❌ Aucune commande à déployer'));
            return;
        }

        // Construction du REST client
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        // D'abord, on supprime toutes les commandes existantes
        console.log(chalk.yellow('🗑️ Suppression des anciennes commandes...'));
        
        if (process.env.GUILD_ID) {
            // Suppression des commandes de guilde
            await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
            console.log(chalk.green('✅ Anciennes commandes de guilde supprimées'));
            
            // Déploiement des nouvelles commandes sur la guilde
            console.log(chalk.blue('📡 Déploiement des nouvelles commandes sur la guilde...'));
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            console.log(chalk.green(`✅ ${data.length} commande(s) déployée(s) sur la guilde !`));
            console.log(chalk.yellow('⚡ Les commandes seront disponibles immédiatement'));
        } else {
            // Suppression des commandes globales
            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
            console.log(chalk.green('✅ Anciennes commandes globales supprimées'));
            
            // Déploiement des nouvelles commandes globalement
            console.log(chalk.blue('🌍 Déploiement global des nouvelles commandes...'));
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log(chalk.green(`✅ ${data.length} commande(s) déployée(s) globalement !`));
            console.log(chalk.yellow('⏳ Les commandes seront disponibles dans ~1 heure'));
        }
        
        // Afficher la liste des commandes déployées
        console.log(chalk.cyan('\n📋 Commandes déployées:'));
        commands.forEach(command => {
            console.log(chalk.white(`  • /${command.name} - ${command.description}`));
        });

        console.log(chalk.green('\n🎉 Déploiement forcé terminé avec succès !'));
        console.log(chalk.blue('💡 Conseil: Redémarrez votre bot pour qu\'il prenne en compte les changements'));

    } catch (error) {
        console.error(chalk.red('❌ Erreur lors du déploiement forcé:'), error);
        
        if (error.code === 50001) {
            console.log(chalk.yellow('💡 Le bot n\'a pas les permissions nécessaires'));
        } else if (error.code === 20012) {
            console.log(chalk.yellow('💡 Vérifiez vos IDs d\'application et de serveur'));
        } else if (error.code === 401) {
            console.log(chalk.yellow('💡 Token Discord invalide ou expiré'));
        }
        
        process.exit(1);
    }
}

// Exécution
forceDeployCommands();
