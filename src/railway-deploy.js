import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuration
config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function deployToDiscord() {
    try {
        console.log('🚀 Déploiement des commandes sur Railway...');
        
        // Collecter toutes les commandes
        const commands = [];
        const foldersPath = join(__dirname, 'commands');
        const commandFolders = readdirSync(foldersPath);
        
        for (const folder of commandFolders) {
            const commandsPath = join(foldersPath, folder);
            const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = join(commandsPath, file);
                const fileUrl = pathToFileURL(filePath).href;
                
                try {
                    const command = await import(fileUrl);
                    
                    if (command.default && 'data' in command.default && 'execute' in command.default) {
                        commands.push(command.default.data.toJSON());
                        console.log(`✅ Commande chargée: ${command.default.data.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur lors du chargement de ${file}:`, error.message);
                }
            }
        }
        
        console.log(`📊 Total: ${commands.length} commandes à déployer`);
        
        // Déployer les commandes
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log(`✅ ${data.length} commandes déployées avec succès sur Discord!`);
        
        // Afficher la liste
        console.log('\n📋 Commandes déployées:');
        data.forEach(cmd => {
            console.log(`  - ${cmd.name}`);
        });
        
        console.log('\n🎉 Déploiement Railway terminé avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur lors du déploiement:', error);
        process.exit(1);
    }
}

// Déployer uniquement si ce script est exécuté directement
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    deployToDiscord();
}

export default deployToDiscord;
