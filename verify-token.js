import { config } from 'dotenv';
import { REST } from 'discord.js';
import chalk from 'chalk';

config();

async function verifyToken() {
    console.log(chalk.blue('🔍 Vérification du token Discord...'));
    
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;
    
    if (!token || token === 'VOTRE_TOKEN_COMPLET_ICI') {
        console.log(chalk.red('❌ Token Discord manquant ou non configuré'));
        console.log(chalk.yellow('💡 Veuillez modifier le fichier .env avec votre vrai token'));
        return;
    }
    
    if (!clientId) {
        console.log(chalk.red('❌ CLIENT_ID manquant'));
        return;
    }
    
    // Vérifier le format du token
    const tokenPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    if (!tokenPattern.test(token)) {
        console.log(chalk.red('❌ Format de token invalide'));
        console.log(chalk.yellow('💡 Un token Discord doit avoir le format: XXX.YYY.ZZZ'));
        return;
    }
    
    try {
        const rest = new REST({ version: '10' }).setToken(token);
        
        // Tenter de récupérer les informations de l'application
        const application = await rest.get('/applications/@me');
        
        console.log(chalk.green('✅ Token valide !'));
        console.log(chalk.cyan(`📱 Application: ${application.name}`));
        console.log(chalk.cyan(`🆔 ID: ${application.id}`));
        
        if (application.id !== clientId) {
            console.log(chalk.yellow('⚠️ CLIENT_ID ne correspond pas au token'));
            console.log(chalk.yellow(`💡 CLIENT_ID devrait être: ${application.id}`));
        }
        
    } catch (error) {
        console.log(chalk.red('❌ Token invalide ou problème de connexion'));
        console.log(chalk.red(`Erreur: ${error.message}`));
        
        if (error.code === 0) {
            console.log(chalk.yellow('💡 Problème de connexion réseau'));
        } else if (error.status === 401) {
            console.log(chalk.yellow('💡 Token expiré ou invalide - générez un nouveau token'));
        }
    }
}

verifyToken();
