import { REST, Routes } from 'discord.js';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { config } from 'dotenv';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
config();

// Vérification des variables d'environnement
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
    console.log(chalk.red('❌ Variables d\'environnement manquantes:'));
    console.log(chalk.red('   - DISCORD_TOKEN'));
    console.log(chalk.red('   - CLIENT_ID'));
    console.log(chalk.yellow('💡 Vérifiez votre fichier .env'));
    process.exit(1);
}

// Configuration REST
const rest = new REST({ 
    version: '10',
    timeout: 60000,
    retries: 3
}).setToken(DISCORD_TOKEN);

// Fonction pour charger les commandes récursivement
async function loadCommands(dir = join(__dirname, 'commands')) {
    const commands = [];
    
    if (!existsSync(dir)) {
        console.log(chalk.red(`❌ Dossier de commandes non trouvé: ${dir}`));
        return commands;
    }
    
    const files = readdirSync(dir);
    
    console.log(chalk.blue(`📁 Scan du dossier: ${dir}`));
    
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            console.log(chalk.cyan(`📂 Dossier trouvé: ${file}`));
            const subCommands = await loadCommands(filePath);
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
                console.log(chalk.gray(error.message));
            }
        }
    }
    
    return commands;
}

// Fonction de déploiement
async function deployCommands() {
    try {
        console.log(chalk.blue('🚀 Début du déploiement des commandes...'));
        
        // Chargement des commandes
        console.log(chalk.blue('\n📁 Chargement des commandes...'));
        const commands = await loadCommands();
        
        if (commands.length === 0) {
            console.log(chalk.yellow('⚠️ Aucune commande trouvée à déployer'));
            process.exit(0);
        }
        
        console.log(chalk.green(`\n✅ ${commands.length} commande(s) chargée(s)`));
        
        // Affichage des commandes à déployer
        console.log(chalk.blue('\n📋 Commandes à déployer:'));
        commands.forEach((cmd, index) => {
            console.log(chalk.cyan(`  ${index + 1}. ${cmd.name} - ${cmd.description}`));
        });
        
        // Déploiement
        console.log(chalk.blue('\n🔄 Déploiement en cours...'));
        
        let deploymentRoute;
        let deploymentScope;
        
        if (GUILD_ID) {
            deploymentRoute = Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
            deploymentScope = `serveur ${GUILD_ID}`;
        } else {
            deploymentRoute = Routes.applicationCommands(CLIENT_ID);
            deploymentScope = 'global';
        }
        
        console.log(chalk.blue(`📡 Déploiement ${deploymentScope}...`));
        
        const startTime = Date.now();
        const data = await rest.put(deploymentRoute, { body: commands });
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(chalk.green(`\n🎉 Déploiement réussi !`));
        console.log(chalk.green(`✅ ${data.length} commande(s) déployée(s) en ${duration}s`));
        console.log(chalk.green(`📍 Portée: ${deploymentScope}`));
        
    } catch (error) {
        console.log(chalk.red('\n❌ Erreur lors du déploiement:'));
        
        if (error.code === 50001) {
            console.log(chalk.red('🔒 Erreur: Permissions insuffisantes'));
        } else if (error.status === 401) {
            console.log(chalk.red('🔑 Token Discord invalide'));
        } else if (error.status === 429) {
            console.log(chalk.red('⏱️ Rate limit atteint - attendez avant de réessayer'));
        } else {
            console.log(chalk.red('📋 Détails de l\'erreur:'));
            console.log(error.message || error);
        }
        
        process.exit(1);
    }
}

// Démarrage
console.log(chalk.blue('🤖 Déploiement simple du bot Discord'));
console.log(chalk.gray('=' .repeat(50)));
console.log(chalk.cyan(`📱 Client ID: ${CLIENT_ID}`));
console.log(chalk.cyan(`🏠 Guild ID: ${GUILD_ID || 'Non défini (global)'}`));
console.log(chalk.gray('=' .repeat(50)));

deployCommands()
    .then(() => {
        console.log(chalk.green('\n🎯 Déploiement terminé avec succès !'));
        process.exit(0);
    })
    .catch((error) => {
        console.log(chalk.red('\n💥 Échec du déploiement'));
        console.error(error);
        process.exit(1);
    });
