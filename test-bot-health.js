import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config();

// Test simple pour vérifier que le bot répond
const testClient = new Client({
    intents: [GatewayIntentBits.Guilds]
});

testClient.once('ready', () => {
    console.log('✅ Bot de test connecté:', testClient.user.tag);
    
    // Récupérer les guildes
    const guilds = testClient.guilds.cache;
    console.log(`🔍 Nombre de serveurs: ${guilds.size}`);
    
    guilds.forEach(guild => {
        console.log(`  - ${guild.name} (${guild.id})`);
    });
    
    // Tester la latence
    console.log('📡 Latence WebSocket:', testClient.ws.ping + 'ms');
    
    // Quitter après le test
    setTimeout(() => {
        console.log('✅ Test terminé, déconnexion...');
        testClient.destroy();
        process.exit(0);
    }, 3000);
});

testClient.on('error', (error) => {
    console.error('❌ Erreur du bot de test:', error);
    process.exit(1);
});

console.log('🔄 Connexion du bot de test...');
testClient.login(process.env.DISCORD_TOKEN);
