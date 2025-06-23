import { REST, Routes } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import chalk from 'chalk';
import deploymentConfig, { validateConfig, sanitizeConfig } from './config/deployment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validation de la configuration au démarrage
validateConfig();

const { discord } = deploymentConfig;

// Configuration REST avec timeout étendu et retry
const rest = new REST({ 
    version: '10',
    timeout: 60000, // 60 secondes
    retries: 3,
    rejectOnRateLimit: null
}).setToken(discord.token);

// Fonction pour charger les commandes récursivement
async function loadCommands(dir = join(__dirname, 'commands'), baseDir = join(__dirname, 'commands')) {
    const commands = [];
    const files = readdirSync(dir);
    
    console.log(chalk.blue(`📁 Scan du dossier: ${dir}`));
    
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            console.log(chalk.cyan(`📂 Dossier trouvé: ${file}`));
            const subCommands = await loadCommands(filePath, baseDir);
            commands.push(...subCommands);
        } else if (file.endsWith('.js')) {
            try {
                console.log(chalk.yellow(`⏳ Chargement: ${file}`));
                
                const command = await import(pathToFileURL(filePath).href);
                const commandData = command.default || command;
                
                if ('data' in commandData && 'execute' in commandData) {
                    commands.push(commandData.data.toJSON());
                    console.log(chalk.green(`✅ Commande chargée: ${commandData.data.name}`));
                } else {
                    console.log(chalk.red(`❌ Commande ${file} manque 'data' ou 'execute'`));
                }
            } catch (error) {
                console.log(chalk.red(`❌ Erreur lors du chargement de ${file}:`));
                console.error(error);
            }
        }
    }
    
    return commands;
}

// Fonction de déploiement avec gestion d'erreurs améliorée
async function deployCommands() {
    try {
        console.log(chalk.blue('🚀 Début du déploiement des commandes...'));
        console.log(chalk.gray('📋 Configuration utilisée:'));
        console.log(sanitizeConfig(deploymentConfig));
        
        // Chargement des commandes
        console.log(chalk.blue('\n📁 Chargement des commandes...'));
        const commands = await loadCommands();
        
        if (commands.length === 0) {
            console.log(chalk.yellow('⚠️ Aucune commande trouvée à déployer'));
            return;
        }
        
        console.log(chalk.green(`\n✅ ${commands.length} commande(s) chargée(s)`));
        
        // Affichage des commandes à déployer
        console.log(chalk.blue('\n📋 Commandes à déployer:'));
        commands.forEach((cmd, index) => {
            console.log(chalk.cyan(`  ${index + 1}. ${cmd.name} - ${cmd.description}`));
        });
        
        // Déploiement avec retry automatique
        console.log(chalk.blue('\n🔄 Déploiement en cours...'));
        
        let deploymentRoute;
        let deploymentScope;
        
        if (discord.guildId) {
            deploymentRoute = Routes.applicationGuildCommands(discord.clientId, discord.guildId);
            deploymentScope = `serveur ${discord.guildId}`;
        } else {
            deploymentRoute = Routes.applicationCommands(discord.clientId);
            deploymentScope = 'global';
        }
        
        console.log(chalk.blue(`📡 Déploiement ${deploymentScope}...`));
        
        const startTime = Date.now();
        
        const data = await rest.put(deploymentRoute, { 
            body: commands 
        });
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(chalk.green(`\n🎉 Déploiement réussi !`));
        console.log(chalk.green(`✅ ${data.length} commande(s) déployée(s) en ${duration}s`));
        console.log(chalk.green(`📍 Portée: ${deploymentScope}`));
        
        // Notification dans le canal de déploiement si configuré
        if (discord.deployChannelId) {
            try {
                console.log(chalk.blue('\n📢 Envoi de la notification...'));
                // Note: Cette partie nécessiterait une instance du client Discord
                // Pour l'instant, on affiche juste le message
                console.log(chalk.green('✅ Notification prête (nécessite une instance client)'));
            } catch (notifError) {
                console.log(chalk.yellow('⚠️ Impossible d\'envoyer la notification:', notifError.message));
            }
        }
        
    } catch (error) {
        console.log(chalk.red('\n❌ Erreur lors du déploiement:'));
        
        if (error.code === 50001) {
            console.log(chalk.red('🔒 Erreur: Permissions insuffisantes'));
            console.log(chalk.yellow('💡 Vérifiez que le bot a les permissions nécessaires'));
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
            console.log(chalk.red('🌐 Erreur de connexion réseau'));
            console.log(chalk.yellow('💡 Vérifiez votre connexion internet et réessayez'));
        } else if (error.status === 429) {
            console.log(chalk.red('⏱️ Rate limit atteint'));
            console.log(chalk.yellow('💡 Attendez quelques minutes avant de réessayer'));
        } else if (error.status === 401) {
            console.log(chalk.red('🔑 Token Discord invalide'));
            console.log(chalk.yellow('💡 Vérifiez votre token dans le fichier .env'));
        } else {
            console.log(chalk.red('📋 Détails de l\'erreur:'));
            console.error(error);
        }
        
        process.exit(1);
    }
}

// Fonction principale avec gestion des signaux
async function main() {
    console.log(chalk.blue('🤖 Déploiement sécurisé du bot Discord'));
    console.log(chalk.gray('=' .repeat(50)));
    
    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n⏹️ Arrêt du déploiement...'));
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log(chalk.yellow('\n⏹️ Arrêt du déploiement...'));
        process.exit(0);
    });
    
    try {
        await deployCommands();
        console.log(chalk.green('\n🎯 Déploiement terminé avec succès !'));
        process.exit(0);
    } catch (error) {
        console.log(chalk.red('\n💥 Échec du déploiement'));
        process.exit(1);
    }
}

// Démarrage du script
main();
