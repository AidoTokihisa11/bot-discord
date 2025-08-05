import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus,
    VoiceConnectionStatus,
    getVoiceConnection
} from '@discordjs/voice';
import { search, stream } from 'play-dl';
import { EmbedBuilder } from 'discord.js';

class MusicManager {
    constructor() {
        this.queues = new Map(); // Map pour stocker les queues par serveur
        this.players = new Map(); // Map pour stocker les players par serveur
        this.connections = new Map(); // Map pour stocker les connexions vocales
    }

    // Créer ou récupérer la queue d'un serveur
    getQueue(guildId) {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, {
                songs: [],
                isPlaying: false,
                textChannel: null,
                voiceChannel: null,
                volume: 50,
                loop: false,
                loopQueue: false
            });
        }
        return this.queues.get(guildId);
    }

    // Rejoindre un canal vocal
    async joinChannel(voiceChannel, textChannel) {
        const guildId = voiceChannel.guild.id;
        
        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            this.connections.set(guildId, connection);
            
            const queue = this.getQueue(guildId);
            queue.voiceChannel = voiceChannel;
            queue.textChannel = textChannel;

            // Créer un player audio si il n'existe pas
            if (!this.players.has(guildId)) {
                const player = createAudioPlayer();
                this.players.set(guildId, player);
                connection.subscribe(player);

                // Gérer les événements du player avec plus de robustesse
                player.on(AudioPlayerStatus.Idle, () => {
                    console.log('🎵 Player idle pour', guildId);
                    // Ajouter un délai pour éviter les fins prématurées
                    setTimeout(() => {
                        if (player.state.status === AudioPlayerStatus.Idle) {
                            this.handleSongEnd(guildId);
                        }
                    }, 1000);
                });

                player.on(AudioPlayerStatus.Playing, () => {
                    console.log('▶️ Player en cours de lecture pour', guildId);
                });

                player.on(AudioPlayerStatus.Paused, () => {
                    console.log('⏸️ Player en pause pour', guildId);
                });

                player.on('error', error => {
                    console.error('❌ Erreur du player audio pour', guildId, ':', error);
                    const queue = this.getQueue(guildId);
                    queue.isPlaying = false;
                    
                    // Informer l'utilisateur de l'erreur
                    if (queue.textChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('❌ Erreur de lecture')
                            .setDescription('Une erreur s\'est produite pendant la lecture. Passage à la musique suivante...')
                            .setColor('#FF0000');
                        
                        queue.textChannel.send({ embeds: [embed] });
                    }
                    
                    this.handleSongEnd(guildId);
                });
            }

            return connection;
        } catch (error) {
            console.error('Erreur lors de la connexion au canal vocal:', error);
            throw error;
        }
    }

    // Rechercher une musique
    async searchMusic(query) {
        try {
            const results = await search(query, { limit: 1, source: { youtube: 'video' } });
            return results[0] || null;
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            return null;
        }
    }

    // Ajouter une musique à la queue
    async addToQueue(guildId, song, requestedBy) {
        const queue = this.getQueue(guildId);
        
        const songData = {
            title: song.title,
            url: song.url,
            duration: this.formatDuration(song.durationInSec),
            thumbnail: song.thumbnails?.[0]?.url || null,
            requestedBy: requestedBy
        };

        queue.songs.push(songData);
        return songData;
    }

    // Jouer la musique
    async play(guildId) {
        const queue = this.getQueue(guildId);
        const player = this.players.get(guildId);

        if (!queue.songs.length || !player) {
            console.log('❌ Pas de musiques ou pas de player pour', guildId);
            return;
        }

        if (queue.isPlaying) {
            console.log('⚠️ Déjà en cours de lecture pour', guildId);
            return;
        }

        queue.isPlaying = true;
        const song = queue.songs[0];

        try {
            console.log('🎵 Tentative de lecture:', song.title);
            
            // Utiliser play-dl avec des options plus robustes
            const streamData = await stream(song.url, {
                quality: 2, // Qualité audio moyenne pour éviter les problèmes
                filter: 'audioonly'
            });

            const resource = createAudioResource(streamData.stream, {
                inputType: streamData.type,
                inlineVolume: true
            });

            // Définir le volume
            if (resource.volume) {
                resource.volume.setVolume(queue.volume / 100);
            }

            player.play(resource);
            console.log('✅ Lecture démarrée pour:', song.title);

            // Envoyer un embed "En cours de lecture"
            if (queue.textChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🎵 En cours de lecture')
                    .setDescription(`**[${song.title}](${song.url})**`)
                    .addFields(
                        { name: '⏱️ Durée', value: song.duration, inline: true },
                        { name: '👤 Demandée par', value: song.requestedBy.toString(), inline: true }
                    )
                    .setThumbnail(song.thumbnail)
                    .setColor('#00FF00')
                    .setTimestamp();

                await queue.textChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            console.error('❌ Erreur lors de la lecture:', error);
            queue.isPlaying = false;
            
            // Informer l'utilisateur de l'erreur
            if (queue.textChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur de lecture')
                    .setDescription(`Impossible de lire: **${song.title}**\nTentative avec la prochaine musique...`)
                    .setColor('#FF0000');
                
                await queue.textChannel.send({ embeds: [embed] });
            }
            
            // Passer à la musique suivante
            this.handleSongEnd(guildId);
        }
    }

    // Gérer la fin d'une musique
    async handleSongEnd(guildId) {
        const queue = this.getQueue(guildId);
        
        console.log('🏁 Fin de musique détectée pour', guildId, '- Queue length:', queue.songs.length);
        
        if (queue.loop && queue.songs.length > 0) {
            console.log('🔂 Mode répétition activé - relancer la même musique');
            // Mode répétition de la musique actuelle
            setTimeout(() => this.play(guildId), 500);
            return;
        }

        if (queue.loopQueue && queue.songs.length > 0) {
            console.log('🔁 Mode répétition queue activé - déplacer à la fin');
            // Mode répétition de la queue - déplacer la première chanson à la fin
            const song = queue.songs.shift();
            queue.songs.push(song);
            setTimeout(() => this.play(guildId), 500);
            return;
        }

        // Passer à la musique suivante
        const finishedSong = queue.songs.shift();
        queue.isPlaying = false;
        
        console.log('⏭️ Musique terminée:', finishedSong?.title, '- Musiques restantes:', queue.songs.length);

        if (queue.songs.length > 0) {
            console.log('▶️ Passage à la musique suivante');
            setTimeout(() => this.play(guildId), 1500);
        } else {
            console.log('🏁 Plus de musiques dans la queue');
            // Queue vide, arrêter la lecture
            if (queue.textChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🏁 Queue terminée')
                    .setDescription('Toutes les musiques ont été jouées !')
                    .setColor('#FF0000');
                
                queue.textChannel.send({ embeds: [embed] });
            }
        }
    }

    // Passer à la musique suivante
    skip(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            player.stop();
        }
    }

    // Arrêter la musique
    stop(guildId) {
        const queue = this.getQueue(guildId);
        const player = this.players.get(guildId);
        
        queue.songs = [];
        queue.isPlaying = false;

        if (player) {
            player.stop();
        }
    }

    // Mettre en pause
    pause(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            player.pause();
        }
    }

    // Reprendre la lecture
    resume(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            player.unpause();
        }
    }

    // Quitter le canal vocal
    disconnect(guildId) {
        const connection = this.connections.get(guildId);
        const queue = this.getQueue(guildId);
        
        if (connection) {
            connection.destroy();
            this.connections.delete(guildId);
        }

        if (this.players.has(guildId)) {
            this.players.delete(guildId);
        }

        queue.songs = [];
        queue.isPlaying = false;
        queue.voiceChannel = null;
        queue.textChannel = null;
    }

    // Mélanger la queue
    shuffle(guildId) {
        const queue = this.getQueue(guildId);
        if (queue.songs.length > 1) {
            const currentSong = queue.songs.shift();
            for (let i = queue.songs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
            }
            queue.songs.unshift(currentSong);
        }
    }

    // Supprimer une musique de la queue
    remove(guildId, index) {
        const queue = this.getQueue(guildId);
        if (index > 0 && index < queue.songs.length) {
            return queue.songs.splice(index, 1)[0];
        }
        return null;
    }

    // Obtenir la queue actuelle
    getQueueList(guildId, page = 1, itemsPerPage = 10) {
        const queue = this.getQueue(guildId);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        return {
            songs: queue.songs.slice(startIndex, endIndex),
            totalSongs: queue.songs.length,
            currentPage: page,
            totalPages: Math.ceil(queue.songs.length / itemsPerPage),
            isPlaying: queue.isPlaying
        };
    }

    // Formater la durée
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Vérifier si le bot est connecté
    isConnected(guildId) {
        return this.connections.has(guildId);
    }

    // Obtenir des informations sur la musique actuelle
    getCurrentSong(guildId) {
        const queue = this.getQueue(guildId);
        return queue.songs[0] || null;
    }

    // Activer/désactiver la répétition
    toggleLoop(guildId) {
        const queue = this.getQueue(guildId);
        queue.loop = !queue.loop;
        if (queue.loop) queue.loopQueue = false;
        return queue.loop;
    }

    // Activer/désactiver la répétition de la queue
    toggleLoopQueue(guildId) {
        const queue = this.getQueue(guildId);
        queue.loopQueue = !queue.loopQueue;
        if (queue.loopQueue) queue.loop = false;
        return queue.loopQueue;
    }
}

export default new MusicManager();
