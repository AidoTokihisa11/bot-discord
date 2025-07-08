import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Configuration de dotenv
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function forceDeployCommands() {
    try {
        console.log('🔄 Suppression de TOUTES les commandes globales...');
        
        // Supprimer toutes les commandes globales
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );
        
        console.log('✅ Toutes les commandes globales supprimées');
        
        // Attendre un peu pour que Discord traite la suppression
        console.log('⏳ Attente de 3 secondes...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔄 Redéploiement des nouvelles commandes...');
        
        // Collecter les nouvelles commandes
        const commands = [];
        const foldersPath = path.join(__dirname, 'src', 'commands');
        const commandFolders = fs.readdirSync(foldersPath);
        
        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
                
                try {
                    const command = await import(fileUrl);
                    
                    if (command.default && 'data' in command.default && 'execute' in command.default) {
                        commands.push(command.default.data.toJSON());
                        console.log(`✅ Commande trouvée: ${command.default.data.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur lors du chargement de ${file}:`, error.message);
                }
            }
        }
        
        console.log(`📊 Total de ${commands.length} commandes à déployer`);
        
        // Redéployer les commandes
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log(`✅ ${data.length} commandes redéployées avec succès!`);
        console.log('🎉 Déploiement forcé terminé!');
        
        // Afficher la liste des commandes déployées
        console.log('\n📋 Commandes déployées:');
        data.forEach(cmd => {
            console.log(`  - ${cmd.name}: ${cmd.description}`);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors du déploiement forcé:', error);
        process.exit(1);
    }
}

forceDeployCommands();
