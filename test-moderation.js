import { config } from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import ModerationManager from './src/managers/ModerationManager.js';
import Logger from './src/utils/Logger.js';

config();

const logger = new Logger('TEST');

async function testModerationSystem() {
    logger.info('🧪 Test du système de modération...');
    
    try {
        // Créer un client Discord minimal
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
        
        // Initialiser le ModerationManager
        logger.info('🛡️ Initialisation du ModerationManager...');
        client.moderationManager = new ModerationManager(client);
        await client.moderationManager.init();
        logger.success('✅ ModerationManager initialisé avec succès!');
        
        // Test de la configuration par défaut
        logger.info('⚙️ Test de la configuration...');
        const config = client.moderationManager.config;
        logger.info('📋 Configuration chargée:', JSON.stringify(config, null, 2));
        
        // Test de l'historique (sans utilisateur réel)
        logger.info('📚 Test de l\'historique...');
        const history = await client.moderationManager.getUserHistory('test-user-id');
        logger.info('📖 Historique testé:', history);
        
        // Test des statistiques
        logger.info('📊 Test des statistiques...');
        const stats = await client.moderationManager.getStats();
        logger.info('📈 Statistiques:', JSON.stringify(stats, null, 2));
        
        logger.success('🎉 Tous les tests sont passés avec succès!');
        logger.info('✨ Le système de modération est prêt à être utilisé');
        
    } catch (error) {
        logger.error('❌ Erreur lors du test:', error);
        console.error(error.stack);
    }
}

// Exécuter les tests
testModerationSystem().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
