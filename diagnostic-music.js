import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus,
    VoiceConnectionStatus,
    getVoiceConnection
} from '@discordjs/voice';
import { search, stream } from 'play-dl';

console.log('🔍 Diagnostic du système de musique...\n');

// Test 1: Vérifier les dépendances
console.log('1️⃣ Test des dépendances:');
try {
    console.log('   ✅ @discordjs/voice importé');
    console.log('   ✅ play-dl importé');
} catch (error) {
    console.log('   ❌ Erreur d\'import:', error.message);
}

// Test 2: Créer un player
console.log('\n2️⃣ Test de création de player:');
try {
    const player = createAudioPlayer();
    console.log('   ✅ Player créé avec succès');
    console.log('   📊 État initial:', player.state.status);
    
    // Tester les événements
    player.on(AudioPlayerStatus.Idle, () => {
        console.log('   🎵 Événement Idle détecté');
    });
    
    player.on(AudioPlayerStatus.Playing, () => {
        console.log('   ▶️ Événement Playing détecté');
    });
    
    player.on('error', (error) => {
        console.log('   ❌ Erreur player:', error.message);
    });
    
} catch (error) {
    console.log('   ❌ Erreur création player:', error.message);
}

// Test 3: Test de recherche YouTube
console.log('\n3️⃣ Test de recherche YouTube:');
try {
    const results = await search('Never Gonna Give You Up', { limit: 1, source: { youtube: 'video' } });
    if (results && results.length > 0) {
        const song = results[0];
        console.log('   ✅ Recherche réussie');
        console.log('   📝 Titre:', song.title);
        console.log('   🔗 URL:', song.url);
        console.log('   ⏱️ Durée:', song.durationInSec, 'secondes');
        console.log('   🖼️ Thumbnail:', song.thumbnails?.[0]?.url ? 'Oui' : 'Non');
        
        // Test 4: Test de streaming
        console.log('\n4️⃣ Test de streaming audio:');
        try {
            console.log('   🔄 Tentative de création du stream...');
            const streamData = await stream(song.url, {
                quality: 2,
                filter: 'audioonly'
            });
            console.log('   ✅ Stream créé avec succès');
            console.log('   📊 Type:', streamData.type);
            console.log('   🎵 Stream disponible:', streamData.stream ? 'Oui' : 'Non');
            
            // Test 5: Test de ressource audio
            console.log('\n5️⃣ Test de ressource audio:');
            try {
                const resource = createAudioResource(streamData.stream, {
                    inputType: streamData.type,
                    inlineVolume: true
                });
                console.log('   ✅ Ressource audio créée');
                console.log('   🔊 Volume disponible:', resource.volume ? 'Oui' : 'Non');
                
                if (resource.volume) {
                    resource.volume.setVolume(0.5);
                    console.log('   🔊 Volume défini à 50%');
                }
                
            } catch (error) {
                console.log('   ❌ Erreur création ressource:', error.message);
            }
            
        } catch (error) {
            console.log('   ❌ Erreur streaming:', error.message);
            console.log('   🔍 Détails:', error);
        }
        
    } else {
        console.log('   ❌ Aucun résultat trouvé');
    }
} catch (error) {
    console.log('   ❌ Erreur recherche:', error.message);
    console.log('   🔍 Détails:', error);
}

// Test 6: Test ffmpeg
console.log('\n6️⃣ Test FFmpeg:');
try {
    const ffmpeg = await import('ffmpeg-static');
    console.log('   ✅ FFmpeg importé');
    console.log('   📍 Chemin:', ffmpeg.default || 'Non défini');
} catch (error) {
    console.log('   ❌ Erreur FFmpeg:', error.message);
    console.log('   💡 Solution: npm install ffmpeg-static');
}

console.log('\n✅ Diagnostic terminé !');
console.log('\n💡 Conseils de dépannage:');
console.log('   • Assurez-vous que FFmpeg est installé');
console.log('   • Vérifiez votre connexion Internet');
console.log('   • Testez avec une URL YouTube directe');
console.log('   • Vérifiez les logs du bot pour plus de détails');
