#!/usr/bin/env node

import { spawn } from 'child_process';
import { config } from 'dotenv';
import chalk from 'chalk';

// Charger les variables d'environnement
config();

console.log(chalk.blue('🚀 Démarrage Railway - Bot Discord'));
console.log(chalk.gray('=' .repeat(50)));

async function deployAndStart() {
    try {
        // Étape 1: Déployer les commandes
        console.log(chalk.blue('\n📡 Étape 1: Déploiement des commandes...'));
        
        const deploy = spawn('node', ['src/deploy-simple.js'], {
            stdio: 'inherit',
            env: process.env
        });
        
        await new Promise((resolve, reject) => {
            deploy.on('close', (code) => {
                if (code === 0) {
                    console.log(chalk.green('✅ Commandes déployées avec succès'));
                    resolve();
                } else {
                    console.log(chalk.yellow('⚠️ Déploiement des commandes échoué, mais on continue...'));
                    resolve(); // On continue même si le déploiement échoue
                }
            });
            
            deploy.on('error', (error) => {
                console.log(chalk.yellow('⚠️ Erreur lors du déploiement, mais on continue...'));
                resolve(); // On continue même en cas d'erreur
            });
        });
        
        // Étape 2: Démarrer le bot
        console.log(chalk.blue('\n🤖 Étape 2: Démarrage du bot...'));
        
        const bot = spawn('node', ['src/index.js'], {
            stdio: 'inherit',
            env: process.env
        });
        
        // Gérer l'arrêt propre
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n⏹️ Arrêt du bot...'));
            bot.kill('SIGINT');
        });
        
        process.on('SIGTERM', () => {
            console.log(chalk.yellow('\n⏹️ Arrêt du bot...'));
            bot.kill('SIGTERM');
        });
        
        bot.on('close', (code) => {
            console.log(chalk.yellow(`🔄 Bot fermé avec le code: ${code}`));
            process.exit(code);
        });
        
        bot.on('error', (error) => {
            console.log(chalk.red('❌ Erreur du bot:'), error);
            process.exit(1);
        });
        
    } catch (error) {
        console.log(chalk.red('❌ Erreur lors du démarrage:'), error);
        process.exit(1);
    }
}

deployAndStart();
