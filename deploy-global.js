import { REST, Routes } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLIENT_ID = process.env.CLIENT_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!CLIENT_ID || !DISCORD_TOKEN) {
    console.error('❌ Variables d\'environnement manquantes: CLIENT_ID ou DISCORD_TOKEN');
    process.exit(1);
}

// Configuration REST
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// Fonction pour charger les commandes
async function loadCommands(dir = join(__dirname, 'src', 'commands')) {
    const commands = [];
    const files = readdirSync(dir);
    
    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
            const subCommands = await loadCommands(filePath);
            commands.push(...subCommands);
        } else if (file.endsWith('.js')) {
            try {
                const command = await import(pathToFileURL(filePath).href);
                const commandData = command.default || command;
                
                if ('data' in commandData && 'execute' in commandData) {
                    commands.push(commandData.data.toJSON());
                    console.log(`✅ ${commandData.data.name}`);
                }
            } catch (error) {
                console.error(`❌ Erreur: ${file}`, error.message);
            }
        }
    }
    
    return commands;
}

// Déploiement global
async function deployGlobal() {
    try {
        console.log('🚀 DÉPLOIEMENT GLOBAL DES COMMANDES');
        console.log('=====================================');
        
        console.log('📁 Chargement des commandes...');
        const commands = await loadCommands();
        
        console.log(`\n📋 ${commands.length} commande(s) prête(s) pour le déploiement global`);
        
        console.log('\n🌍 Déploiement global en cours...');
        const startTime = Date.now();
        
        const data = await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`\n🎉 DÉPLOIEMENT GLOBAL RÉUSSI !`);
        console.log(`✅ ${data.length} commande(s) déployée(s) en ${duration}s`);
        console.log(`🌍 Portée: GLOBAL (tous les serveurs)`);
        console.log(`⏰ Propagation: 1-5 minutes`);
        
        console.log('\n📋 Commandes déployées:');
        commands.forEach((cmd, i) => {
            console.log(`  ${i + 1}. ${cmd.name} - ${cmd.description}`);
        });
        
        console.log('\n✨ Les commandes seront disponibles sur tous les serveurs dans quelques minutes !');
        
    } catch (error) {
        console.error('❌ Erreur lors du déploiement global:', error);
        process.exit(1);
    }
}

// Exécution
deployGlobal();
