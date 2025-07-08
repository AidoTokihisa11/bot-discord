import { Client, Collection, GatewayIntentBits, ActivityType, Partials } from 'discord.js';
import { config } from 'dotenv';
import chalk from 'chalk';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import Logger from './utils/Logger.js';
import Database from './utils/Database.js';
import ErrorHandler from './utils/ErrorHandler.js';
import RoleMentionManager from './utils/RoleMentionManager.js';
import CacheManager from './utils/CacheManager.js';
import StreamManager from './managers/StreamManager.js';

// Configuration
config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Vérification des variables d'environnement critiques
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ ERREUR FATALE: Variable DISCORD_TOKEN manquante');
    console.error('💡 Ajoutez DISCORD_TOKEN dans vos variables d\'environnement Railway');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('❌ ERREUR FATALE: Variable CLIENT_ID manquante');
    console.error('💡 Ajoutez CLIENT_ID dans vos variables d\'environnement Railway');
    process.exit(1);
}

console.log('✅ Variables d\'environnement validées');

// Initialisation du logger
const logger = new Logger();

// Création du client Discord avec optimisations
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false
    },
    presence: {
        activities: [{
            name: '🚀 Démarrage en cours...',
            type: ActivityType.Custom
        }],
        status: 'dnd'
    }
});

// Ajouter le logger au client pour y accéder partout
client.logger = logger;

// Collections pour les données du bot
client.commands = new Collection();
client.events = new Collection();
client.cooldowns = new Collection();
client.tickets = new Collection();
client.config = new Collection();

// Collections pour les interactions et données temporaires
client.embedTemplates = new Collection();
client.embedBuilder = new Collection();
client.embedIA = new Collection();
client.tempData = {};

// Initialisation de la base de données
client.db = new Database();

// Gestionnaire d'erreurs
const errorHandler = new ErrorHandler(client, logger);
client.errorHandler = errorHandler;

// Fonction pour charger les commandes récursivement
async function loadCommands(dir = join(__dirname, 'commands'), baseDir = join(__dirname, 'commands')) {
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
                    client.commands.set(commandData.data.name, commandData);
                    logger.success(`Commande chargée: ${commandData.data.name}`);
                } else {
                    logger.warn(`Commande ${file} manque 'data' ou 'execute'`);
                }
            } catch (error) {
                logger.error(`Erreur lors du chargement de ${file}:`, error);
            }
        }
    }
}

// Fonction pour charger les événements
async function loadEvents(dir = join(__dirname, 'events')) {
    const files = readdirSync(dir);
    
    for (const file of files) {
        if (file.endsWith('.js')) {
            try {
                const event = await import(pathToFileURL(join(dir, file)).href);
                const eventData = event.default || event;
                
                if (eventData.once) {
                    client.once(eventData.name, (...args) => eventData.execute(...args, client));
                } else {
                    client.on(eventData.name, (...args) => eventData.execute(...args, client));
                }
                
                client.events.set(eventData.name, eventData);
                logger.success(`Événement chargé: ${eventData.name}`);
            } catch (error) {
                logger.error(`Erreur lors du chargement de ${file}:`, error);
            }
        }
    }
}

// Fonction d'initialisation avec timeout
async function initialize() {
    // Timeout de 30 secondes pour l'initialisation
    const initTimeout = setTimeout(() => {
        console.error('❌ TIMEOUT: L\'initialisation prend trop de temps');
        process.exit(1);
    }, 30000);

    try {
        logger.info('🚀 Initialisation du bot...');
        
        // Chargement des commandes
        logger.info('📁 Chargement des commandes...');
        await loadCommands();
        logger.success(`✅ ${client.commands.size} commande(s) chargée(s)`);
        
        // Chargement des événements
        logger.info('⚡ Chargement des événements...');
        await loadEvents();
        logger.success(`✅ ${client.events.size} événement(s) chargé(s)`);
        
        // Initialisation de la base de données
        logger.info('🗄️ Initialisation de la base de données...');
        await client.db.initialize();
        
        // Initialisation du gestionnaire de mentions de rôles
        logger.info('🎭 Initialisation du gestionnaire de mentions de rôles...');
        client.roleMentionManager = new RoleMentionManager(client);
        logger.success('✅ Gestionnaire de mentions de rôles initialisé');
        
        // Initialisation du gestionnaire de cache
        logger.info('🧹 Initialisation du gestionnaire de cache...');
        client.cacheManager = new CacheManager(client);
        logger.success('✅ Gestionnaire de cache initialisé');
        
        // Initialisation du gestionnaire de streams (optionnel)
        try {
            logger.info('🎮 Initialisation du gestionnaire de streams...');
            client.streamManager = new StreamManager(client);
            logger.success('✅ Gestionnaire de streams initialisé');
        } catch (streamError) {
            logger.warn('⚠️ Gestionnaire de streams non initialisé:', streamError.message);
        }
        
        // Connexion du bot
        logger.info('🔗 Connexion à Discord...');
        await client.login(process.env.DISCORD_TOKEN);
        
        // Annuler le timeout si tout s'est bien passé
        clearTimeout(initTimeout);
        
    } catch (error) {
        clearTimeout(initTimeout);
        logger.error('❌ Erreur lors de l\'initialisation:', error);
        console.error('💥 Détails de l\'erreur:', error.stack);
        process.exit(1);
    }
}

// Gestion des erreurs globales
process.on('unhandledRejection', (error, promise) => {
    console.error('❌ UNHANDLED PROMISE REJECTION:', error);
    if (client.logger) {
        client.logger.error('Unhandled Promise Rejection', error);
    }
    // Sur Railway, ne pas exit pour les rejections non gérées
    // Laisser le bot continuer à fonctionner
});

process.on('uncaughtException', (error) => {
    console.error('❌ UNCAUGHT EXCEPTION:', error);
    if (client.logger) {
        client.logger.error('Uncaught Exception', error);
    }
    
    // Pour les exceptions critiques, tenter un arrêt gracieux
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('⚠️ Erreur réseau, tentative de reconnexion...');
        return; // Ne pas exit pour les erreurs réseau
    }
    
    // Pour les autres exceptions critiques
    console.log('💀 Exception critique - Arrêt dans 5 secondes...');
    setTimeout(() => {
        process.exit(1);
    }, 5000);
});

// Gestion de l'arrêt propre
let shutdownInProgress = false;

async function shutdown(signal) {
    if (shutdownInProgress) return;
    shutdownInProgress = true;
    
    console.log(`🔄 ${signal} reçu - Arrêt gracieux...`);
    logger.info(`🛑 Arrêt du bot (${signal})...`);
    
    try {
        if (client.cacheManager) {
            client.cacheManager.stopAutoCleanup();
        }
        
        // Vérifier si le client est prêt avant de le détruire
        if (client.readyAt) {
            await client.destroy();
            console.log('✅ Client Discord déconnecté');
        }
        
        console.log('✅ Arrêt gracieux terminé');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'arrêt:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Démarrage
initialize();

export { client };
