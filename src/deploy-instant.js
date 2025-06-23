import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import chalk from 'chalk';

// Configuration de l'environnement
config();

// Variables globales
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commands = [];
const commandsPath = join(__dirname, 'commands');

/**
 * Fonction pour charger toutes les commandes récursivement
 * @param {string} dir - Répertoire à scanner
 */
async function loadCommands(dir = commandsPath) {
    try {
        const files = readdirSync(dir);
        
        for (const file of files) {
            const filePath = join(dir, file);
            const stat = statSync(filePath);
            
            if (stat.isDirectory()) {
                // Récursion pour les sous-dossiers
                await loadCommands(filePath);
            } else if (file.endsWith('.js')) {
                try {
                    // Import dynamique de la commande
                    const commandModule = await import(pathToFileURL(filePath).href);
                    const command = commandModule.default || commandModule;
                    
                    // Validation de la structure de la commande
                    if (command && command.data && command.execute) {
                        commands.push(command.data.toJSON());
                        console.log(chalk.green('✅') + ` Commande chargée: ${chalk.cyan(command.data.name)}`);
                    } else {
                        console.log(chalk.yellow('⚠️') + ` Commande invalide: ${chalk.red(file)} (manque 'data' ou 'execute')`);
                    }
                } catch (error) {
                    console.log(chalk.red('❌') + ` Erreur lors du chargement de ${chalk.red(file)}: ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.error(chalk.red('❌') + ` Erreur lors de la lecture du dossier ${dir}: ${error.message}`);
        throw error;
    }
}

/**
 * Fonction utilitaire pour ajouter un timeout à une promesse avec retry
 * @param {Promise} promise - La promesse à exécuter
 * @param {number} timeoutMs - Timeout en millisecondes
 * @param {string} operation - Description de l'opération
 */
function withTimeout(promise, timeoutMs, operation) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Timeout de ${timeoutMs}ms dépassé pour: ${operation}`));
            }, timeoutMs);
        })
    ]);
}

/**
 * Fonction pour tester la connexion à l'API Discord
 * @param {REST} rest - Instance REST de Discord.js
 */
async function testDiscordConnection(rest) {
    try {
        console.log(chalk.blue('🔍 Test de connexion à l\'API Discord...'));
        
        // Test simple avec timeout court
        const testPromise = rest.get(Routes.user('@me'));
        await withTimeout(testPromise, 10000, 'test de connexion');
        
        console.log(chalk.green('✅ Connexion à l\'API Discord réussie'));
        return true;
    } catch (error) {
        console.log(chalk.red('❌ Échec du test de connexion:'), error.message);
        return false;
    }
}

/**
 * Fonction de déploiement avec retry automatique
 * @param {REST} rest - Instance REST
 * @param {Array} commands - Liste des commandes
 * @param {number} maxRetries - Nombre maximum de tentatives
 */
async function deployWithRetry(rest, commands, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(chalk.yellow(`⚡ Tentative ${attempt}/${maxRetries} - Déploiement sur le serveur ${process.env.GUILD_ID}...`));
            
            // Timeout progressif: 15s, 30s, 45s
            const timeout = 15000 * attempt;
            console.log(chalk.gray(`   Timeout configuré: ${timeout/1000}s`));
            
            const deploymentPromise = rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            
            const deployedCommands = await withTimeout(
                deploymentPromise,
                timeout,
                `déploiement des commandes (tentative ${attempt})`
            );
            
            return deployedCommands;
            
        } catch (error) {
            console.log(chalk.yellow(`⚠️  Tentative ${attempt} échouée: ${error.message}`));
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Délai d'attente progressif entre les tentatives
            const waitTime = 5000 * attempt;
            console.log(chalk.blue(`⏳ Attente de ${waitTime/1000}s avant la prochaine tentative...`));
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

/**
 * Fonction pour obtenir l'emoji correspondant à une commande
 * @param {string} commandName - Nom de la commande
 */
function getCommandEmoji(commandName) {
    const emojiMap = {
        'help': '❓',
        'ping': '🏓',
        'setup-tickets': '🎫',
        'ticket-stats': '📊',
        'ticket': '🎫',
        'analyze-server': '🔍',
        'check-permissions': '🔐',
        'deploy': '🚀',
        'reglement': '📋',
        'setup-permissions': '⚙️'
    };
    
    return emojiMap[commandName] || '⚡';
}

/**
 * Fonction pour déployer en mode global (toutes les guildes)
 * @param {REST} rest - Instance REST
 * @param {Array} commands - Liste des commandes
 */
async function deployGlobalCommands(rest, commands) {
    try {
        console.log(chalk.blue('🌍 Tentative de déploiement global...'));
        console.log(chalk.yellow('⚠️  Note: Les commandes globales peuvent prendre jusqu\'à 1 heure pour être disponibles'));
        
        const deploymentPromise = rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        const deployedCommands = await withTimeout(
            deploymentPromise,
            30000,
            'déploiement global des commandes'
        );
        
        return deployedCommands;
    } catch (error) {
        console.log(chalk.red('❌ Échec du déploiement global:'), error.message);
        throw error;
    }
}

/**
 * Fonction principale de déploiement avancé
 */
async function deployAdvancedCommands() {
    console.log(chalk.blue.bold('🚀 DÉPLOIEMENT AVANCÉ DES COMMANDES DISCORD'));
    console.log(chalk.gray('═'.repeat(70)));
    
    // Vérification des variables d'environnement
    if (!process.env.DISCORD_TOKEN) {
        console.error(chalk.red('❌ DISCORD_TOKEN manquant dans le fichier .env'));
        process.exit(1);
    }
    
    if (!process.env.CLIENT_ID) {
        console.error(chalk.red('❌ CLIENT_ID manquant dans le fichier .env'));
        process.exit(1);
    }
    
    // GUILD_ID optionnel pour déploiement global
    const isGuildDeploy = !!process.env.GUILD_ID;
    
    try {
        // Étape 1: Chargement des commandes
        console.log(chalk.blue('📦 Chargement des commandes...'));
        await loadCommands();
        
        if (commands.length === 0) {
            console.log(chalk.red('❌ Aucune commande valide trouvée !'));
            console.log(chalk.yellow('💡 Vérifiez que vos fichiers de commandes sont correctement structurés'));
            process.exit(1);
        }
        
        console.log(chalk.green(`✅ ${commands.length} commande(s) chargée(s) avec succès`));
        console.log(chalk.gray('═'.repeat(70)));
        
        // Étape 2: Initialisation du client REST
        console.log(chalk.blue('🔗 Initialisation du client REST Discord...'));
        const rest = new REST({ 
            version: '10',
            timeout: 60000, // 60 secondes
            retries: 2
        }).setToken(process.env.DISCORD_TOKEN);
        
        // Étape 3: Test de connexion
        const connectionTest = await testDiscordConnection(rest);
        if (!connectionTest) {
            console.log(chalk.yellow('⚠️  Connexion instable détectée, mais on continue...'));
        }
        
        // Étape 4: Déploiement
        let deployedCommands;
        
        if (isGuildDeploy) {
            console.log(chalk.blue(`🎯 Mode serveur spécifique: ${process.env.GUILD_ID}`));
            deployedCommands = await deployWithRetry(rest, commands, 3);
        } else {
            console.log(chalk.blue('🌍 Mode déploiement global (toutes les guildes)'));
            deployedCommands = await deployGlobalCommands(rest, commands);
        }
        
        // Étape 5: Affichage des résultats
        console.log(chalk.green.bold(`🎉 DÉPLOIEMENT RÉUSSI !`));
        console.log(chalk.green(`✅ ${deployedCommands.length} commande(s) déployée(s) avec succès`));
        console.log(chalk.gray('═'.repeat(70)));
        
        // Liste détaillée des commandes déployées
        console.log(chalk.blue.bold('📋 COMMANDES DÉPLOYÉES:'));
        deployedCommands.forEach((command, index) => {
            const emoji = getCommandEmoji(command.name);
            const number = chalk.gray(`${(index + 1).toString().padStart(2, '0')}.`);
            const name = chalk.cyan.bold(command.name);
            const description = chalk.gray(command.description);
            console.log(`${number} ${emoji} ${name} - ${description}`);
        });
        
        console.log(chalk.gray('═'.repeat(70)));
        
        if (isGuildDeploy) {
            console.log(chalk.green.bold('🚀 COMMANDES DISPONIBLES INSTANTANÉMENT !'));
            console.log(chalk.yellow('⚡ Les commandes sont actives immédiatement sur votre serveur'));
        } else {
            console.log(chalk.green.bold('🌍 COMMANDES DÉPLOYÉES GLOBALEMENT !'));
            console.log(chalk.yellow('⏳ Délai de propagation: jusqu\'à 1 heure pour être disponibles partout'));
        }
        
        console.log(chalk.blue('💡 Utilisez /help dans Discord pour voir toutes les commandes'));
        console.log(chalk.gray('═'.repeat(70)));
        
        // Informations supplémentaires
        console.log(chalk.cyan('ℹ️  Informations:'));
        if (isGuildDeploy) {
            console.log(chalk.gray(`   • Serveur cible: ${process.env.GUILD_ID}`));
        } else {
            console.log(chalk.gray(`   • Déploiement: Global (toutes les guildes)`));
        }
        console.log(chalk.gray(`   • Client ID: ${process.env.CLIENT_ID}`));
        console.log(chalk.gray(`   • Commandes déployées: ${deployedCommands.length}`));
        console.log(chalk.gray(`   • Mode: ${isGuildDeploy ? 'Serveur spécifique' : 'Global'}`));
        
    } catch (error) {
        console.log(chalk.gray('═'.repeat(70)));
        console.error(chalk.red.bold('❌ ERREUR LORS DU DÉPLOIEMENT'));
        
        if (error.message.includes('Timeout')) {
            console.log(chalk.yellow('⚠️  L\'API Discord est actuellement surchargée'));
            console.log(chalk.yellow('⚠️  Cela peut arriver pendant les pics de trafic'));
            console.log(chalk.blue('💡 Solutions suggérées:'));
            console.log(chalk.gray('   • Réessayez dans 5-10 minutes'));
            console.log(chalk.gray('   • Vérifiez votre connexion internet'));
            console.log(chalk.gray('   • Essayez le déploiement global (retirez GUILD_ID du .env)'));
            console.log(chalk.gray('   • L\'API Discord peut être temporairement lente'));
        } else if (error.code === 50001) {
            console.log(chalk.red('❌ Bot manque les permissions nécessaires'));
            console.log(chalk.blue('💡 Solution: Vérifiez les permissions du bot sur le serveur'));
        } else if (error.code === 10004) {
            console.log(chalk.red('❌ Serveur Discord introuvable'));
            console.log(chalk.blue('💡 Solution: Vérifiez que GUILD_ID est correct dans .env'));
        } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            console.log(chalk.red('❌ Problème de connectivité réseau'));
            console.log(chalk.blue('💡 Solution: Vérifiez votre connexion internet'));
        } else {
            console.log(chalk.red(`❌ Erreur: ${error.message}`));
            if (error.code) {
                console.log(chalk.gray(`   Code d'erreur: ${error.code}`));
            }
        }
        
        // Afficher quand même les commandes qui auraient dû être déployées
        if (commands.length > 0) {
            console.log(chalk.gray('═'.repeat(70)));
            console.log(chalk.blue('📋 Commandes qui auraient été déployées:'));
            commands.forEach((command, index) => {
                const emoji = getCommandEmoji(command.name);
                const number = chalk.gray(`${(index + 1).toString().padStart(2, '0')}.`);
                const name = chalk.cyan(command.name);
                const description = chalk.gray(command.description);
                console.log(`${number} ${emoji} ${name} - ${description}`);
            });
        }
        
        process.exit(1);
    }
    
    // Fin du script
    console.log(chalk.green('✨ Déploiement terminé avec succès !'));
    process.exit(0);
}

/**
 * Gestion des signaux d'arrêt
 */
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⚠️  Arrêt demandé par l\'utilisateur (Ctrl+C)'));
    console.log(chalk.blue('👋 Au revoir !'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n⚠️  Arrêt du processus demandé'));
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red('\n❌ Erreur non gérée:'), error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('\n❌ Promesse rejetée non gérée:'), reason);
    process.exit(1);
});

// Lancement du déploiement
console.log(chalk.cyan('🚀 Initialisation du déploiement avancé...'));
deployAdvancedCommands();