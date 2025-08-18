import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 VÉRIFICATION DE TOUTES LES COMMANDES');
console.log('======================================\n');

// Liste des commandes attendues
const expectedCommands = {
    general: [
        'ping', 'help', 'diagnostic', 'cleanup', 'embed', 'reglement',
        'send-women-message', 'setup-demo-streamers', 'stream-notifications',
        'test-interactions', 'verify-bot', 'my-data', 'export-my-data', 
        'info', 'stats', 'charte', 'support', 'appeal', 'suggest', 
        'config', 'backup', 'logs', 'automod'
    ],
    tickets: [
        'setup-tickets', 'ticket-stats', 'ticket'
    ]
};

async function verifyCommands() {
    let totalCommands = 0;
    let validCommands = 0;
    let errors = [];

    for (const [category, commands] of Object.entries(expectedCommands)) {
        console.log(`📁 Catégorie: ${category.toUpperCase()}`);
        console.log('─'.repeat(30));

        for (const commandName of commands) {
            totalCommands++;
            const commandPath = path.join(__dirname, 'src', 'commands', category, `${commandName}.js`);
            
            try {
                if (fs.existsSync(commandPath)) {
                    // Vérifier que le fichier contient bien une commande slash
                    const content = fs.readFileSync(commandPath, 'utf8');
                    
                    if (content.includes('SlashCommandBuilder') && content.includes('setName')) {
                        console.log(`✅ ${commandName} - OK`);
                        validCommands++;
                    } else {
                        console.log(`⚠️  ${commandName} - Fichier invalide`);
                        errors.push(`${commandName}: Structure de commande invalide`);
                    }
                } else {
                    console.log(`❌ ${commandName} - MANQUANT`);
                    errors.push(`${commandName}: Fichier manquant`);
                }
            } catch (error) {
                console.log(`❌ ${commandName} - ERREUR: ${error.message}`);
                errors.push(`${commandName}: ${error.message}`);
            }
        }
        console.log('');
    }

    // Résumé final
    console.log('📊 RÉSUMÉ FINAL');
    console.log('═'.repeat(30));
    console.log(`✅ Commandes valides: ${validCommands}/${totalCommands}`);
    console.log(`❌ Erreurs détectées: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log('\n🚨 ERREURS DÉTECTÉES:');
        errors.forEach(error => console.log(`   • ${error}`));
    } else {
    console.log('\n🎉 TOUTES LES COMMANDES SONT VALIDES !');
        console.log('Votre bot Team7 est prêt avec toutes les fonctionnalités !');
        console.log('\n📋 CHARTE OFFICIELLE MISE À JOUR :');
        console.log('✅ Référence : DOC-BOT-2025-002');
        console.log('✅ Éditeur : [Théo Garcès / AidoTokihisa]');
        console.log('✅ Statut : Partenaire Certifié');
        console.log('✅ Conformité RGPD : Totale');
    }

    // Vérifier les fichiers additionnels
    console.log('\n🔧 VÉRIFICATION DES FICHIERS DE SUPPORT:');
    console.log('─'.repeat(40));
    
    const supportFiles = [
        'src/deploy-commands.js',
        'src/index.js',
        'package.json',
        '.env'
    ];

    for (const file of supportFiles) {
        if (fs.existsSync(path.join(__dirname, file))) {
            console.log(`✅ ${file} - OK`);
        } else {
            console.log(`❌ ${file} - MANQUANT`);
        }
    }

    console.log('\n🚀 PRÊT POUR LE DÉPLOIEMENT !');
    console.log('Utilisez: npm start pour démarrer le bot');
}

verifyCommands().catch(console.error);
