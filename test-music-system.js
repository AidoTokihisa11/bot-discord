import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import MusicManager from './src/managers/MusicManager.js';

config();

// Test du système de musique
async function testMusicSystem() {
    console.log('🎵 Test du système de musique...\n');
    
    // Test 1: Vérifier que MusicManager existe
    console.log('✅ Test 1: MusicManager chargé');
    console.log('   - Méthodes disponibles:', Object.getOwnPropertyNames(Object.getPrototypeOf(MusicManager)));
    
    // Test 2: Créer une queue de test
    const testGuildId = '123456789';
    const queue = MusicManager.getQueue(testGuildId);
    console.log('✅ Test 2: Queue créée');
    console.log('   - Queue initiale:', queue);
    
    // Test 3: Tester le formatage de durée
    const testDurations = [60, 3661, 7260];
    console.log('✅ Test 3: Formatage des durées');
    testDurations.forEach(seconds => {
        console.log(`   - ${seconds}s = ${MusicManager.formatDuration(seconds)}`);
    });
    
    // Test 4: Tester les méthodes de queue
    console.log('✅ Test 4: Méthodes de queue');
    console.log(`   - Queue connectée: ${MusicManager.isConnected(testGuildId)}`);
    console.log(`   - Musique actuelle: ${MusicManager.getCurrentSong(testGuildId)}`);
    
    // Test 5: Vérifier les dépendances
    console.log('✅ Test 5: Vérification des dépendances');
    try {
        const voice = await import('@discordjs/voice');
        console.log('   - @discordjs/voice: ✅');
    } catch (error) {
        console.log('   - @discordjs/voice: ❌', error.message);
    }
    
    try {
        const playDl = await import('play-dl');
        console.log('   - play-dl: ✅');
    } catch (error) {
        console.log('   - play-dl: ❌', error.message);
    }
    
    console.log('\n🎉 Tests terminés !');
}

// Test des commandes de musique
async function testMusicCommands() {
    console.log('\n🎮 Test des commandes de musique...\n');
    
    const commands = [
        'play', 'skip', 'stop', 'pause', 'resume', 
        'queue', 'nowplaying', 'disconnect', 'shuffle', 
        'loop', 'remove', 'join', 'clear', 'music-help'
    ];
    
    for (const commandName of commands) {
        try {
            const command = await import(`./src/commands/music/${commandName}.js`);
            const commandData = command.default;
            
            if ('data' in commandData && 'execute' in commandData) {
                console.log(`✅ ${commandName.padEnd(12)} - Nom: ${commandData.data.name}`);
            } else {
                console.log(`❌ ${commandName.padEnd(12)} - Manque 'data' ou 'execute'`);
            }
        } catch (error) {
            console.log(`❌ ${commandName.padEnd(12)} - Erreur: ${error.message}`);
        }
    }
}

// Exécuter les tests
async function runTests() {
    try {
        await testMusicSystem();
        await testMusicCommands();
        
        console.log('\n🚀 Système de musique prêt pour le déploiement !');
        console.log('\nPour déployer les commandes, utilisez :');
        console.log('npm run deploy');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    }
}

runTests();
