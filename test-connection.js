import { REST } from 'discord.js';
import { config } from 'dotenv';
import chalk from 'chalk';

config();

async function testDiscordConnection() {
    console.log(chalk.blue('🔍 Test de connexion à l\'API Discord...'));
    
    if (!process.env.DISCORD_TOKEN) {
        console.error(chalk.red('❌ DISCORD_TOKEN manquant'));
        return;
    }
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        // Test 1: Informations du bot
        console.log(chalk.yellow('📡 Test 1: Récupération des infos du bot...'));
        const botInfo = await rest.get('/users/@me');
        console.log(chalk.green(`✅ Bot connecté: ${botInfo.username}#${botInfo.discriminator}`));
        
        // Test 2: Liste des guildes
        console.log(chalk.yellow('📡 Test 2: Liste des serveurs...'));
        const guilds = await rest.get('/users/@me/guilds');
        console.log(chalk.green(`✅ Bot présent sur ${guilds.length} serveur(s)`));
        
        // Test 3: Vérification du serveur spécifique
        if (process.env.GUILD_ID) {
            console.log(chalk.yellow('📡 Test 3: Vérification du serveur cible...'));
            try {
                const guild = await rest.get(`/guilds/${process.env.GUILD_ID}`);
                console.log(chalk.green(`✅ Serveur trouvé: ${guild.name}`));
            } catch (error) {
                console.log(chalk.red(`❌ Serveur introuvable: ${error.message}`));
            }
        }
        
        // Test 4: Test de latence
        console.log(chalk.yellow('📡 Test 4: Mesure de la latence...'));
        const start = Date.now();
        await rest.get('/users/@me');
        const latency = Date.now() - start;
        console.log(chalk.green(`✅ Latence API: ${latency}ms`));
        
        if (latency > 5000) {
            console.log(chalk.yellow('⚠️  Latence élevée détectée - cela peut causer des timeouts'));
        }
        
        console.log(chalk.green.bold('\n🎉 Tous les tests sont passés ! Votre connexion Discord fonctionne.'));
        
    } catch (error) {
        console.error(chalk.red('❌ Erreur de connexion:'), error.message);
        
        if (error.code === 0) {
            console.log(chalk.yellow('💡 Token invalide - vérifiez votre DISCORD_TOKEN'));
        } else if (error.code === 'ENOTFOUND') {
            console.log(chalk.yellow('💡 Problème de DNS - vérifiez votre connexion internet'));
        } else if (error.code === 'ETIMEDOUT') {
            console.log(chalk.yellow('💡 Timeout - l\'API Discord est peut-être surchargée'));
        }
    }
}

testDiscordConnection();