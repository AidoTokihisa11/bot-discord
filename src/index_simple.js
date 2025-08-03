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

// Initialisation du logger
const logger = new Logger();

// Vérification simple des variables d'environnement
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    logger.error('Variables d\'environnement manquantes: DISCORD_TOKEN ou CLIENT_ID');
    process.exit(1);
}

// Création du client Discord
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

// Ajouter le logger au client
client.logger = logger;

// Collections
client.commands = new Collection();
client.events = new Collection();
client.cooldowns = new Collection();
client.tickets = new Collection();
client.config = new Collection();
client.tempData = {};

// Initialisation de la base de données
client.db = new Database();

// Gestionnaire d'erreurs
const errorHandler = new ErrorHandler(client, logger);
client.errorHandler = errorHandler;

// Fonction pour charger les commandes
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
                }
            } catch (error) {
                logger.error(`Erreur lors du chargement de ${file}:`, error);
            }
        }
    }
}

// Fonction pour charger les événements
async function loadEvents() {
    const eventsPath = join(__dirname, 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        try {
            const filePath = join(eventsPath, file);
            const event = await import(pathToFileURL(filePath).href);
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

// Fonction d'initialisation
async function initialize() {
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
        
        // Initialisation des gestionnaires
        logger.info('🎭 Initialisation des gestionnaires...');
        client.roleMentionManager = new RoleMentionManager(client);
        client.cacheManager = new CacheManager(client);
        client.streamManager = new StreamManager(client);
        logger.success('✅ Gestionnaires initialisés');
        
        // Connexion du bot
        logger.info('🔗 Connexion à Discord...');
        await client.login(process.env.DISCORD_TOKEN);
        
    } catch (error) {
        logger.error('❌ Erreur lors de l\'initialisation:', error);
        process.exit(1);
    }
}

// Gestion simple des erreurs
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Gestion de l'arrêt
process.on('SIGINT', () => {
    logger.info('🛑 Arrêt du bot...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('🛑 Arrêt du bot (SIGTERM)...');
    process.exit(0);
});

// Démarrage
initialize();

export { client };
