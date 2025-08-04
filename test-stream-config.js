import { config } from 'dotenv';
import chalk from 'chalk';

// Charger les variables d'environnement
config();

console.log(chalk.blue('🧪 Test de configuration du système de streams\n'));

// Tester les variables obligatoires
const requiredVars = {
    'DISCORD_TOKEN': process.env.DISCORD_TOKEN,
    'CLIENT_ID': process.env.CLIENT_ID,
    'TWITCH_CLIENT_ID': process.env.TWITCH_CLIENT_ID,
    'TWITCH_CLIENT_SECRET': process.env.TWITCH_CLIENT_SECRET
};

const optionalVars = {
    'YOUTUBE_API_KEY': process.env.YOUTUBE_API_KEY,
    'TWITCH_WEBHOOK_URL': process.env.TWITCH_WEBHOOK_URL,
    'GUILD_ID': process.env.GUILD_ID
};

console.log(chalk.yellow('📋 Variables obligatoires:'));
let missingRequired = 0;
for (const [name, value] of Object.entries(requiredVars)) {
    if (value) {
        console.log(`  ✅ ${name}: ${value.substring(0, 10)}...`);
    } else {
        console.log(`  ❌ ${name}: MANQUANTE`);
        missingRequired++;
    }
}

console.log(chalk.yellow('\n📋 Variables optionnelles:'));
for (const [name, value] of Object.entries(optionalVars)) {
    if (value) {
        console.log(`  ✅ ${name}: ${value.substring(0, 30)}...`);
    } else {
        console.log(`  ⚠️  ${name}: Non configurée`);
    }
}

// Test de l'API Twitch
console.log(chalk.yellow('\n🟣 Test de l\'API Twitch:'));
if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
    try {
        const { default: axios } = await import('axios');
        
        console.log('  🔄 Tentative d\'obtention du token...');
        const response = await axios.post('https://id.twitch.tv/oauth2/token', {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
        });
        
        if (response.data.access_token) {
            console.log('  ✅ Token Twitch obtenu avec succès');
            
            // Test d'une requête API
            console.log('  🔄 Test de requête API...');
            const apiResponse = await axios.get('https://api.twitch.tv/helix/games/top', {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${response.data.access_token}`
                },
                params: { first: 1 }
            });
            
            if (apiResponse.data) {
                console.log('  ✅ API Twitch fonctionnelle');
            }
        }
    } catch (error) {
        console.log('  ❌ Erreur API Twitch:', error.response?.data?.message || error.message);
    }
} else {
    console.log('  ⚠️  Identifiants Twitch manquants, test ignoré');
}

// Test de l'API YouTube
console.log(chalk.yellow('\n🔴 Test de l\'API YouTube:'));
if (process.env.YOUTUBE_API_KEY) {
    try {
        const { default: axios } = await import('axios');
        
        console.log('  🔄 Test de la clé API...');
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: process.env.YOUTUBE_API_KEY,
                part: 'snippet',
                type: 'channel',
                q: 'test',
                maxResults: 1
            }
        });
        
        if (response.data) {
            console.log('  ✅ API YouTube fonctionnelle');
        }
    } catch (error) {
        if (error.response) {
            console.log(`  ❌ Erreur API YouTube (${error.response.status}):`, error.response.data?.error?.message || 'Erreur inconnue');
        } else {
            console.log('  ❌ Erreur API YouTube:', error.message);
        }
    }
} else {
    console.log('  ⚠️  Clé API YouTube manquante, test ignoré');
}

// Test de l'API Kick
console.log(chalk.yellow('\n🎯 Test de l\'API Kick:'));
try {
    const { default: axios } = await import('axios');
    
    console.log('  🔄 Test de requête publique...');
    const response = await axios.get('https://kick.com/api/v2/channels/trainwreckstv', {
        timeout: 5000
    });
    
    if (response.data) {
        console.log('  ✅ API Kick accessible');
    }
} catch (error) {
    console.log('  ❌ Erreur API Kick:', error.response?.status || error.message);
}

// Résumé final
console.log(chalk.blue('\n📊 Résumé du test:'));
if (missingRequired === 0) {
    console.log(chalk.green('✅ Configuration de base complète'));
    console.log(chalk.green('🚀 Le système de streams peut démarrer'));
    
    console.log(chalk.blue('\n🎮 Prochaines étapes:'));
    console.log('1. Démarrez votre bot: npm start');
    console.log('2. Utilisez /stream-system add pour ajouter des streamers');
    console.log('3. Consultez /stream-system stats pour voir les performances');
    
} else {
    console.log(chalk.red(`❌ ${missingRequired} variable(s) obligatoire(s) manquante(s)`));
    console.log(chalk.yellow('📝 Consultez STREAM_CONFIG_TEMPLATE.env pour la configuration'));
}

// Conseils d'optimisation
console.log(chalk.blue('\n💡 Conseils d\'optimisation:'));
if (!process.env.YOUTUBE_API_KEY) {
    console.log('  • Ajoutez YOUTUBE_API_KEY pour surveiller YouTube');
}
if (!process.env.TWITCH_WEBHOOK_URL) {
    console.log('  • Configurez les webhooks Twitch pour des notifications instantanées');
}
if (!process.env.GUILD_ID) {
    console.log('  • Ajoutez GUILD_ID pour des déploiements de commandes plus rapides');
}

console.log(chalk.blue('\n🔗 Ressources utiles:'));
console.log('  • Guide complet: STREAM_SYSTEM_GUIDE.md');
console.log('  • Configuration: STREAM_CONFIG_TEMPLATE.env');
console.log('  • Twitch Dev: https://dev.twitch.tv/console/apps');
console.log('  • Google Cloud: https://console.cloud.google.com/');

console.log(chalk.green('\n✨ Test terminé!'));
