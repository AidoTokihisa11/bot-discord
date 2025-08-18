// Test simple pour vérifier les corrections
import { config } from 'dotenv';
config();

console.log('🧪 Test des configurations...');

// Test des variables d'environnement
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Configuré' : '❌ Manquant');
console.log('TWITCH_CLIENT_ID:', process.env.TWITCH_CLIENT_ID);
console.log('TWITCH_CLIENT_SECRET:', process.env.TWITCH_CLIENT_SECRET);
console.log('YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY);

console.log('✅ Test terminé');
