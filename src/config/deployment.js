import { config } from 'dotenv';

// Charger les variables d'environnement
config();

// Validation des variables d'environnement requises
const requiredEnvVars = [
    'DISCORD_TOKEN',
    'CLIENT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:', missingVars.join(', '));
    console.error('📝 Veuillez créer un fichier .env basé sur .env.example');
    process.exit(1);
}

// Configuration sécurisée
export const deploymentConfig = {
    // Configuration Discord
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID || null,
        deployChannelId: process.env.DEPLOY_CHANNEL_ID || null
    },
    
    // Configuration de l'environnement
    environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT) || 3000,
        isDevelopment: process.env.NODE_ENV !== 'production',
        isProduction: process.env.NODE_ENV === 'production'
    },
    
    // Configuration des développeurs
    developers: {
        devUserId: process.env.DEV_USER_ID_2 || null
    },
    
    // Configuration de la base de données
    database: {
        url: process.env.DATABASE_URL || null,
        path: process.env.DATABASE_PATH || './data/database.json'
    },
    
    // Configuration des logs
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true'
    }
};

// Fonction pour masquer les données sensibles dans les logs
export function sanitizeConfig(config) {
    const sanitized = JSON.parse(JSON.stringify(config));
    
    // Masquer le token Discord
    if (sanitized.discord?.token) {
        sanitized.discord.token = '***HIDDEN***';
    }
    
    // Masquer l'URL de base de données si elle contient des credentials
    if (sanitized.database?.url) {
        sanitized.database.url = sanitized.database.url.replace(
            /:\/\/([^:]+):([^@]+)@/,
            '://***:***@'
        );
    }
    
    return sanitized;
}

// Validation de la configuration au démarrage
export function validateConfig() {
    const errors = [];
    
    // Vérifier le token Discord
    if (!deploymentConfig.discord.token || deploymentConfig.discord.token.length < 50) {
        errors.push('Token Discord invalide');
    }
    
    // Vérifier le Client ID
    if (!deploymentConfig.discord.clientId || !/^\d+$/.test(deploymentConfig.discord.clientId)) {
        errors.push('Client ID Discord invalide');
    }
    
    if (errors.length > 0) {
        console.error('❌ Erreurs de configuration:');
        errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
    }
    
    console.log('✅ Configuration validée avec succès');
    console.log('📋 Configuration:', sanitizeConfig(deploymentConfig));
}

export default deploymentConfig;
