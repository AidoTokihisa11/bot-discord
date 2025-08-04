#!/usr/bin/env node
import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import chalk from 'chalk';

// Charger les variables d'environnement
config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
    console.log(chalk.red('❌ Variables d\'environnement manquantes: DISCORD_TOKEN, CLIENT_ID'));
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function clearCommands() {
    try {
        console.log(chalk.blue('🧹 Suppression de toutes les commandes slash...'));
        
        // Supprimer les commandes du serveur spécifique si GUILD_ID est défini
        if (GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
            console.log(chalk.green(`✅ Commandes supprimées du serveur ${GUILD_ID}`));
        }
        
        // Supprimer les commandes globales
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log(chalk.green('✅ Commandes globales supprimées'));
        
        console.log(chalk.green('🎉 Toutes les anciennes commandes ont été supprimées !'));
        console.log(chalk.yellow('💡 Redémarrez maintenant votre bot pour déployer les nouvelles commandes.'));
        
    } catch (error) {
        console.log(chalk.red('❌ Erreur lors de la suppression des commandes:'));
        console.error(error);
        process.exit(1);
    }
}

// Affichage des informations
console.log(chalk.blue('🤖 Script de nettoyage des commandes Discord'));
console.log(chalk.gray('=' .repeat(50)));
console.log(chalk.cyan(`📱 Client ID: ${CLIENT_ID}`));
console.log(chalk.cyan(`🏠 Guild ID: ${GUILD_ID || 'Non défini (global)'}`));
console.log(chalk.gray('=' .repeat(50)));

// Démarrage
clearCommands();
