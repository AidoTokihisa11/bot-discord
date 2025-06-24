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

// Configuration
config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        
        // Initialisation du gestionnaire de mentions de rôles
        logger.info('🎭 Initialisation du gestionnaire de mentions de rôles...');
        client.roleMentionManager = new RoleMentionManager(client);
        logger.success('✅ Gestionnaire de mentions de rôles initialisé');
        
        // Connexion du bot
        logger.info('🔗 Connexion à Discord...');
        await client.login(process.env.DISCORD_TOKEN);
        
    } catch (error) {
        logger.error('❌ Erreur lors de l\'initialisation:', error);
        process.exit(1);
    }
}

// Gestion des erreurs globales
process.on('unhandledRejection', (error) => {
    errorHandler.handleError(error, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (error) => {
    errorHandler.handleError(error, 'Uncaught Exception');
    process.exit(1);
});

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
    logger.info('🛑 Arrêt du bot...');
    await client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('🛑 Arrêt du bot...');
    await client.destroy();
    process.exit(0);
});

// Démarrage
initialize();

export { client };
