#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { config } from 'dotenv';
import chalk from 'chalk';

// Charger les variables d'environnement
config();

class BotManager {
    constructor() {
        this.botProcess = null;
        this.restartCount = 0;
        this.maxRestarts = 5;
        this.restartCooldown = 30000; // 30 secondes
        this.lastRestart = 0;
    }

    start() {
        console.log(chalk.blue('🚀 Démarrage du gestionnaire de bot...'));
        
        // Vérifications préliminaires
        if (!this.checkEnvironment()) {
            process.exit(1);
        }

        this.startBot();
        this.setupSignalHandlers();
    }

    checkEnvironment() {
        console.log(chalk.cyan('🔍 Vérification de l\'environnement...'));
        
        // Vérifier les fichiers essentiels
        const requiredFiles = [
            'src/index.js',
            '.env'
        ];

        for (const file of requiredFiles) {
            if (!existsSync(file)) {
                console.log(chalk.red(`❌ Fichier manquant: ${file}`));
                return false;
            }
        }

        // Vérifier les variables d'environnement
        const requiredEnvVars = [
            'DISCORD_TOKEN',
            'CLIENT_ID'
        ];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                console.log(chalk.red(`❌ Variable d'environnement manquante: ${envVar}`));
                return false;
            }
        }

        console.log(chalk.green('✅ Environnement vérifié'));
        return true;
    }

    startBot() {
        console.log(chalk.blue('🤖 Démarrage du bot Discord...'));
        
        this.botProcess = spawn('node', ['src/index.js'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: process.env
        });

        this.botProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                console.log(output);
            }
        });

        this.botProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            if (error) {
                console.log(chalk.red(error));
            }
        });

        this.botProcess.on('close', (code) => {
            console.log(chalk.yellow(`🔄 Bot fermé avec le code: ${code}`));
            
            if (code !== 0 && this.shouldRestart()) {
                this.scheduleRestart();
            } else if (code !== 0) {
                console.log(chalk.red('💀 Trop de redémarrages, arrêt du gestionnaire'));
                process.exit(1);
            }
        });

        this.botProcess.on('error', (error) => {
            console.log(chalk.red('❌ Erreur du processus bot:'), error);
            if (this.shouldRestart()) {
                this.scheduleRestart();
            }
        });
    }

    shouldRestart() {
        const now = Date.now();
        
        // Reset du compteur si assez de temps s'est écoulé
        if (now - this.lastRestart > 300000) { // 5 minutes
            this.restartCount = 0;
        }

        return this.restartCount < this.maxRestarts;
    }

    scheduleRestart() {
        const now = Date.now();
        const timeSinceLastRestart = now - this.lastRestart;
        
        if (timeSinceLastRestart < this.restartCooldown) {
            const waitTime = this.restartCooldown - timeSinceLastRestart;
            console.log(chalk.yellow(`⏰ Attente de ${Math.ceil(waitTime / 1000)}s avant redémarrage...`));
            
            setTimeout(() => {
                this.restart();
            }, waitTime);
        } else {
            this.restart();
        }
    }

    restart() {
        this.restartCount++;
        this.lastRestart = Date.now();
        
        console.log(chalk.cyan(`🔄 Redémarrage du bot (${this.restartCount}/${this.maxRestarts})...`));
        
        if (this.botProcess) {
            this.botProcess.kill();
            this.botProcess = null;
        }

        setTimeout(() => {
            this.startBot();
        }, 2000); // Attendre 2 secondes avant de redémarrer
    }

    stop() {
        console.log(chalk.yellow('🛑 Arrêt du gestionnaire de bot...'));
        
        if (this.botProcess) {
            this.botProcess.kill('SIGTERM');
            
            // Force kill si pas de réponse après 10 secondes
            setTimeout(() => {
                if (this.botProcess) {
                    console.log(chalk.red('💀 Force kill du bot'));
                    this.botProcess.kill('SIGKILL');
                }
            }, 10000);
        }
    }

    setupSignalHandlers() {
        // Gestion de l'arrêt propre
        process.on('SIGINT', () => {
            console.log(chalk.blue('\n📴 Signal SIGINT reçu...'));
            this.stop();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log(chalk.blue('\n📴 Signal SIGTERM reçu...'));
            this.stop();
            process.exit(0);
        });

        // Gestion des erreurs non gérées
        process.on('uncaughtException', (error) => {
            console.log(chalk.red('💥 Exception non gérée:'), error);
            this.stop();
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.log(chalk.red('💥 Promise rejetée non gérée:'), reason);
            // Ne pas arrêter le gestionnaire pour une rejection non gérée
        });
    }

    // Commandes de gestion
    handleCommand(command) {
        switch (command.trim().toLowerCase()) {
            case 'restart':
                console.log(chalk.cyan('🔄 Redémarrage manuel...'));
                this.restart();
                break;
            case 'stop':
                console.log(chalk.yellow('🛑 Arrêt manuel...'));
                this.stop();
                process.exit(0);
                break;
            case 'status':
                console.log(chalk.blue(`📊 Status: Bot ${this.botProcess ? 'actif' : 'inactif'}, Redémarrages: ${this.restartCount}`));
                break;
            case 'help':
                console.log(chalk.cyan(`
📚 Commandes disponibles:
  restart - Redémarrer le bot
  stop    - Arrêter le gestionnaire
  status  - Afficher le statut
  help    - Afficher cette aide
`));
                break;
            default:
                console.log(chalk.yellow(`❓ Commande inconnue: ${command}`));
                break;
        }
    }
}

// Démarrage du gestionnaire
const manager = new BotManager();
manager.start();

// Interface de commande simple
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    manager.handleCommand(data);
});

console.log(chalk.green(`
✅ Gestionnaire de bot démarré !
💡 Tapez 'help' pour voir les commandes disponibles
`));
