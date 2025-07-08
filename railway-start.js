#!/usr/bin/env node

// Script de démarrage optimisé pour Railway
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🚀 Démarrage optimisé pour Railway...');

// Créer un fichier de santé
const createHealthFile = () => {
    try {
        writeFileSync('/tmp/healthy', Date.now().toString());
    } catch (error) {
        // Ignore l'erreur si /tmp n'existe pas (Windows)
    }
};

// Signal de santé initial
createHealthFile();

// Variables d'environnement essentielles
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:', missingVars.join(', '));
    console.error('💡 Configurez ces variables dans Railway');
    process.exit(1);
}

console.log('✅ Variables d\'environnement validées');

// Démarrage du bot avec gestion d'erreurs
const botProcess = spawn('node', ['src/index.js'], {
    stdio: 'inherit',
    env: process.env
});

// Gérer les signaux d'arrêt
let shutdownInProgress = false;

const shutdown = (signal) => {
    if (shutdownInProgress) return;
    shutdownInProgress = true;
    
    console.log(`📡 Railway signal ${signal} reçu`);
    
    if (botProcess && !botProcess.killed) {
        console.log('🔄 Arrêt du processus bot...');
        botProcess.kill('SIGTERM');
        
        // Forcer l'arrêt après 10 secondes
        setTimeout(() => {
            if (!botProcess.killed) {
                console.log('💀 Arrêt forcé du bot');
                botProcess.kill('SIGKILL');
            }
            process.exit(0);
        }, 10000);
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Gérer la fin du processus bot
botProcess.on('exit', (code, signal) => {
    if (!shutdownInProgress) {
        console.log(`🤖 Bot arrêté avec le code ${code} (signal: ${signal})`);
        
        if (code !== 0) {
            console.error('❌ Arrêt inattendu du bot');
            process.exit(1);
        }
    }
    process.exit(0);
});

botProcess.on('error', (error) => {
    console.error('❌ Erreur du processus bot:', error);
    process.exit(1);
});

// Signal de santé périodique
const healthInterval = setInterval(createHealthFile, 30000);

// Nettoyage à l'arrêt
process.on('exit', () => {
    clearInterval(healthInterval);
});

console.log('📡 Processus de surveillance Railway actif');
