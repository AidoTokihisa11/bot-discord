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
async function loadCommands(dir = commandsPath) {
    const files = readdirSync(dir);
    
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            await loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            try {
                const command = await import(pathToFileURL(filePath).href);
                const commandData = command.default || command;
                
                if ('data' in commandData && 'execute' in commandData) {
                    commands.push(commandData.data.toJSON());
                    console.log(chalk.green('✅') + ` ${commandData.data.name}`);
                }
            } catch (error) {
                console.log(chalk.red('❌') + ` ${file}: ${error.message}`);
            }
        }
    }
}

async function deploySimple() {
    console.log(chalk.blue('🚀 Déploiement SIMPLE des commandes...'));
    
    try {
        // Charger les commandes
        console.log(chalk.blue('📦 Chargement...'));
        await loadCommands();
        
        if (commands.length === 0) {
            console.log(chalk.red('❌ Aucune commande trouvée !'));
            return;
        }
        
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        // Déployer UNIQUEMENT sur le serveur (plus rapide)
        if (process.env.GUILD_ID) {
            console.log(chalk.yellow(`⚡ Déploiement sur serveur ${process.env.GUILD_ID}...`));
            
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            
            console.log(chalk.green(`✅ ${data.length} commandes déployées !`));
            
            // Liste des commandes
            data.forEach((cmd, i) => {
                console.log(chalk.gray(`${i + 1}.`) + ` ${chalk.cyan(cmd.name)}`);
            });
            
            console.log(chalk.green('🎉 TERMINÉ !'));
        } else {
            console.log(chalk.red('❌ GUILD_ID manquant dans .env'));
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Erreur:'), error.message);
    }
    
    // Forcer la sortie
    setTimeout(() => process.exit(0), 500);
}

// Lancer le déploiement simple
deploySimple();
