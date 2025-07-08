import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import axios from 'axios';

export default class StreamManager {
    constructor(client) {
        this.client = client;
        this.db = client.db;
        this.logger = client.logger;
        this.streamers = new Map();
        this.currentlyLive = new Map();
        this.checkInterval = null;
        this.stats = {
            notificationsSent: 0,
            lastCheck: Date.now(),
            isRunning: false
        };

        // APIs et configurations
        this.apis = {
            twitch: {
                baseUrl: 'https://api.twitch.tv/helix',
                clientId: process.env.TWITCH_CLIENT_ID,
                clientSecret: process.env.TWITCH_CLIENT_SECRET,
                accessToken: null
            },
            youtube: {
                baseUrl: 'https://www.googleapis.com/youtube/v3',
                apiKey: process.env.YOUTUBE_API_KEY
            },
            kick: {
                baseUrl: 'https://kick.com/api/v2'
            }
        };

        this.init();
    }

    async init() {
        try {
            this.logger.info('🎮 Initialisation du gestionnaire de streams...');
            
            // Charger les streamers depuis la DB
            await this.loadStreamersFromDB();
            
            // Obtenir le token Twitch si configuré
            if (this.apis.twitch.clientId && this.apis.twitch.clientSecret) {
                await this.getTwitchAccessToken();
            }
            
            // Démarrer la surveillance
            this.startMonitoring();
            
            this.logger.success('✅ Gestionnaire de streams initialisé');
        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'initialisation du gestionnaire de streams:', error);
        }
    }

    async loadStreamersFromDB() {
        try {
            // Accéder directement aux données de la base de données
            const data = this.db.data.streamNotifications || {};
            Object.entries(data).forEach(([guildId, guildStreamers]) => {
                if (Array.isArray(guildStreamers)) {
                    guildStreamers.forEach(streamer => {
                        const key = `${guildId}-${streamer.platform}-${streamer.username.toLowerCase()}`;
                        this.streamers.set(key, {
                            ...streamer,
                            guildId
                        });
                    });
                }
            });
            
            this.logger.info(`📊 ${this.streamers.size} streamer(s) chargé(s) depuis la base de données`);
        } catch (error) {
            this.logger.error('Erreur lors du chargement des streamers:', error);
        }
    }

    async saveStreamersToDB() {
        try {
            const data = {};
            
            this.streamers.forEach(streamer => {
                if (!data[streamer.guildId]) {
                    data[streamer.guildId] = [];
                }
                
                data[streamer.guildId].push({
                    platform: streamer.platform,
                    username: streamer.username,
                    channelId: streamer.channelId,
                    roleId: streamer.roleId,
                    customMessage: streamer.customMessage,
                    addedAt: streamer.addedAt
                });
            });
            
            // Sauvegarder dans la base de données
            this.db.data.streamNotifications = data;
            await this.db.save();
        } catch (error) {
            this.logger.error('Erreur lors de la sauvegarde des streamers:', error);
        }
    }

    async getTwitchAccessToken() {
        try {
            const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: this.apis.twitch.clientId,
                    client_secret: this.apis.twitch.clientSecret,
                    grant_type: 'client_credentials'
                }
            });
            
            this.apis.twitch.accessToken = response.data.access_token;
            this.logger.success('✅ Token Twitch obtenu');
        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'obtention du token Twitch:', error);
        }
    }

    async validateStreamer(platform, username) {
        // Mode démo - accepter n'importe quel nom d'utilisateur
        try {
            // Simuler des données de streamers populaires pour la démo
            const demoStreamers = {
                'twitch': {
                    'ninja': { displayName: 'Ninja', avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/ninja-profile_image-c8b8d2e5-b44b-4c6d-8c33-0e1b0c8bc4e3-300x300.png' },
                    'pokimane': { displayName: 'Pokimane', avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/pokimane-profile_image-04eed45e9b7e-300x300.jpeg' },
                    'shroud': { displayName: 'shroud', avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/shroud-profile_image-7bfde3d0f9c4b1b7-300x300.png' },
                    'xqc': { displayName: 'xQc', avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/xqc-profile_image-9298dca608632101-300x300.jpeg' }
                },
                'youtube': {
                    'mrbeast': { displayName: 'MrBeast', avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_kGrKBVs3c1aEP2wO_WZ7sdDgC6PJoFlsGJOdqCFCKUPA=s800-c-k-c0x00ffffff-no-rj' },
                    'pewdiepie': { displayName: 'PewDiePie', avatar: 'https://yt3.googleusercontent.com/5oUY3tashyxfqsjO5SGhjT4dus8FkN9CsAHwXWISFrdPYii1FudD4ICtLfuCw6-THJsJbgoY=s800-c-k-c0x00ffffff-no-rj' }
                },
                'kick': {
                    'adin': { displayName: 'Adin Ross', avatar: 'https://files.kick.com/images/user/12345/profile_image/conversion/c4ca4238a0b923820dcc509a6f75849b-medium.webp' },
                    'trainwreck': { displayName: 'Trainwreck', avatar: 'https://files.kick.com/images/user/67890/profile_image/conversion/c81e728d9d4c2f636f067f89cc14862c-medium.webp' }
                }
            };

            const platformStreamers = demoStreamers[platform.toLowerCase()];
            if (platformStreamers && platformStreamers[username.toLowerCase()]) {
                const streamerData = platformStreamers[username.toLowerCase()];
                return {
                    exists: true,
                    displayName: streamerData.displayName,
                    avatar: streamerData.avatar,
                    id: username.toLowerCase()
                };
            }

            // Si ce n'est pas un streamer prédéfini, on accepte quand même pour la démo
            return {
                exists: true,
                displayName: username,
                avatar: `https://via.placeholder.com/300x300/6441a4/ffffff?text=${username.toUpperCase()}`,
                id: username.toLowerCase()
            };

        } catch (error) {
            this.logger.error(`Erreur lors de la validation du streamer ${username} sur ${platform}:`, error);
            return { exists: false, error: 'Erreur lors de la validation' };
        }
    }

    async validateTwitchStreamer(username) {
        if (!this.apis.twitch.accessToken) {
            return { exists: false, error: 'Token Twitch non disponible' };
        }

        try {
            const response = await axios.get(`${this.apis.twitch.baseUrl}/users`, {
                headers: {
                    'Client-ID': this.apis.twitch.clientId,
                    'Authorization': `Bearer ${this.apis.twitch.accessToken}`
                },
                params: { login: username }
            });

            if (response.data.data.length > 0) {
                const user = response.data.data[0];
                return {
                    exists: true,
                    displayName: user.display_name,
                    avatar: user.profile_image_url,
                    id: user.id
                };
            }

            return { exists: false };
        } catch (error) {
            this.logger.error('Erreur validation Twitch:', error);
            return { exists: false, error: 'Erreur API Twitch' };
        }
    }

    async validateYouTubeStreamer(channelId) {
        if (!this.apis.youtube.apiKey) {
            return { exists: false, error: 'Clé API YouTube non disponible' };
        }

        try {
            const response = await axios.get(`${this.apis.youtube.baseUrl}/channels`, {
                params: {
                    key: this.apis.youtube.apiKey,
                    id: channelId,
                    part: 'snippet'
                }
            });

            if (response.data.items && response.data.items.length > 0) {
                const channel = response.data.items[0];
                return {
                    exists: true,
                    displayName: channel.snippet.title,
                    avatar: channel.snippet.thumbnails.default.url,
                    id: channel.id
                };
            }

            return { exists: false };
        } catch (error) {
            this.logger.error('Erreur validation YouTube:', error);
            return { exists: false, error: 'Erreur API YouTube' };
        }
    }

    async validateKickStreamer(username) {
        try {
            const response = await axios.get(`${this.apis.kick.baseUrl}/channels/${username}`);
            
            if (response.data && response.data.id) {
                return {
                    exists: true,
                    displayName: response.data.user.username,
                    avatar: response.data.user.profile_pic,
                    id: response.data.id
                };
            }

            return { exists: false };
        } catch (error) {
            if (error.response?.status === 404) {
                return { exists: false };
            }
            this.logger.error('Erreur validation Kick:', error);
            return { exists: false, error: 'Erreur API Kick' };
        }
    }

    async addStreamer(guildId, platform, username, channelId, roleId = null, customMessage = null) {
        try {
            const key = `${guildId}-${platform}-${username.toLowerCase()}`;
            
            if (this.streamers.has(key)) {
                return { success: false, error: 'Ce streamer est déjà surveillé' };
            }

            const streamerData = {
                guildId,
                platform,
                username,
                channelId,
                roleId,
                customMessage,
                addedAt: Date.now()
            };

            this.streamers.set(key, streamerData);
            await this.saveStreamersToDB();

            this.logger.info(`✅ Streamer ajouté: ${username} (${platform}) pour le serveur ${guildId}`);
            return { success: true };

        } catch (error) {
            this.logger.error('Erreur lors de l\'ajout du streamer:', error);
            return { success: false, error: 'Erreur lors de l\'ajout' };
        }
    }

    async removeStreamer(guildId, platform, username) {
        try {
            const key = `${guildId}-${platform}-${username.toLowerCase()}`;
            
            if (!this.streamers.has(key)) {
                return { success: false, error: 'Streamer non trouvé' };
            }

            this.streamers.delete(key);
            this.currentlyLive.delete(key);
            await this.saveStreamersToDB();

            this.logger.info(`✅ Streamer supprimé: ${username} (${platform}) pour le serveur ${guildId}`);
            return { success: true };

        } catch (error) {
            this.logger.error('Erreur lors de la suppression du streamer:', error);
            return { success: false, error: 'Erreur lors de la suppression' };
        }
    }

    async getStreamers(guildId) {
        const guildStreamers = [];
        this.streamers.forEach(streamer => {
            if (streamer.guildId === guildId) {
                guildStreamers.push(streamer);
            }
        });
        return guildStreamers;
    }

    startMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        // Vérifier toutes les 2 minutes
        this.checkInterval = setInterval(() => {
            this.checkAllStreamers();
        }, 2 * 60 * 1000);

        this.stats.isRunning = true;
        this.logger.info('🔄 Surveillance des streams démarrée (vérification toutes les 2 minutes)');

        // Première vérification immédiate
        setTimeout(() => this.checkAllStreamers(), 5000);
    }

    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.stats.isRunning = false;
        this.logger.info('⏸️ Surveillance des streams arrêtée');
    }

    async checkAllStreamers() {
        try {
            this.stats.lastCheck = Date.now();
            const streamersToCheck = Array.from(this.streamers.values());
            
            if (streamersToCheck.length === 0) {
                return;
            }

            // Vérifier les paramètres d'activation pour chaque serveur
            const guildStreamers = new Map();
            for (const streamer of streamersToCheck) {
                if (!guildStreamers.has(streamer.guildId)) {
                    const guildData = await this.db.getGuildData(streamer.guildId);
                    const isEnabled = guildData.streamSettings?.enabled !== false; // Activé par défaut
                    guildStreamers.set(streamer.guildId, { enabled: isEnabled, streamers: [] });
                }
                guildStreamers.get(streamer.guildId).streamers.push(streamer);
            }

            // Ne traiter que les serveurs où le système est activé
            const enabledStreamers = [];
            for (const [guildId, guildInfo] of guildStreamers) {
                if (guildInfo.enabled) {
                    enabledStreamers.push(...guildInfo.streamers);
                }
            }

            if (enabledStreamers.length === 0) {
                this.logger.info('⏸️ Aucun serveur avec notifications activées');
                return;
            }

            this.logger.info(`🔍 Vérification de ${enabledStreamers.length} streamer(s) en mode démo...`);

            // Mode démo : simuler aléatoirement des streamers en live
            for (const streamer of enabledStreamers) {
                const key = `${streamer.guildId}-${streamer.platform}-${streamer.username.toLowerCase()}`;
                const wasLive = this.currentlyLive.has(key);
                
                // 30% de chance qu'un streamer soit en live (pour la démo)
                const isLive = Math.random() < 0.3;
                
                if (isLive && !wasLive) {
                    // Le streamer vient de commencer (simulation)
                    const demoStreamData = this.createDemoStreamData(streamer.platform, streamer.username);
                    this.currentlyLive.set(key, { startedAt: Date.now(), streamData: demoStreamData });
                    await this.sendStreamNotification(streamer, demoStreamData, streamer.platform);
                } else if (!isLive && wasLive) {
                    // Le streamer vient d'arrêter
                    this.currentlyLive.delete(key);
                }
            }

        } catch (error) {
            this.logger.error('Erreur lors de la vérification des streamers:', error);
        }
    }

    createDemoStreamData(platform, username) {
        const epicTitles = [
            '🔥 EVENT SPÉCIAL - 24H DE FOLIE !',
            '🏆 TOURNOI ÉPIQUE - Finale en cours !',
            '💎 PREMIÈRE MONDIALE - Nouveau jeu !',
            '🎉 STREAM ANNIVERSAIRE - Cadeaux à gagner !',
            '⚡ SPEEDRUN RECORD - Tentative historique !',
            '🌟 COLLABORATION EXCLUSIVE !',
            '🎮 MARATHON GAMING - Plus de 12H !',
            '🔴 LIVE EXCEPTIONNEL - Ne ratez pas ça !'
        ];
        
        const epicGames = [
            'Fortnite', 'League of Legends', 'Valorant', 'Minecraft',
            'Grand Theft Auto V', 'Call of Duty', 'Apex Legends', 'FIFA',
            'Just Chatting', 'World of Warcraft', 'Counter-Strike 2', 'Overwatch 2'
        ];

        const randomTitle = epicTitles[Math.floor(Math.random() * epicTitles.length)];
        const randomGame = epicGames[Math.floor(Math.random() * epicGames.length)];
        const randomViewers = Math.floor(Math.random() * 100000) + 500; // Plus de viewers pour le mode démo

        switch (platform) {
            case 'twitch':
                return {
                    user_name: username,
                    title: randomTitle,
                    game_name: randomGame,
                    viewer_count: randomViewers,
                    thumbnail_url: `https://via.placeholder.com/1920x1080/9146FF/ffffff?text=${encodeURIComponent(`🔴 ${username.toUpperCase()} LIVE`)}`
                };
            case 'youtube':
                return {
                    title: randomTitle,
                    game_name: randomGame,
                    viewer_count: randomViewers
                };
            case 'kick':
                return {
                    session_title: randomTitle,
                    viewer_count: randomViewers,
                    categories: [{ name: randomGame }],
                    thumbnail: { url: `https://via.placeholder.com/1920x1080/53FC18/ffffff?text=${encodeURIComponent(`🎯 ${username.toUpperCase()} LIVE`)}` }
                };
            default:
                return { title: randomTitle };
        }
    }

    async checkPlatformStreamers(platform, streamers) {
        switch (platform) {
            case 'twitch':
                await this.checkTwitchStreamers(streamers);
                break;
            case 'youtube':
                await this.checkYouTubeStreamers(streamers);
                break;
            case 'kick':
                await this.checkKickStreamers(streamers);
                break;
        }
    }

    async checkTwitchStreamers(streamers) {
        if (!this.apis.twitch.accessToken) return;

        try {
            const usernames = streamers.map(s => s.username);
            const response = await axios.get(`${this.apis.twitch.baseUrl}/streams`, {
                headers: {
                    'Client-ID': this.apis.twitch.clientId,
                    'Authorization': `Bearer ${this.apis.twitch.accessToken}`
                },
                params: {
                    user_login: usernames
                }
            });

            const liveStreamers = new Set(response.data.data.map(stream => stream.user_login.toLowerCase()));

            for (const streamer of streamers) {
                const key = `${streamer.guildId}-${streamer.platform}-${streamer.username.toLowerCase()}`;
                const isLive = liveStreamers.has(streamer.username.toLowerCase());
                const wasLive = this.currentlyLive.has(key);

                if (isLive && !wasLive) {
                    // Le streamer vient de commencer
                    const streamData = response.data.data.find(s => s.user_login.toLowerCase() === streamer.username.toLowerCase());
                    this.currentlyLive.set(key, { startedAt: Date.now(), streamData });
                    await this.sendStreamNotification(streamer, streamData, 'twitch');
                } else if (!isLive && wasLive) {
                    // Le streamer vient d'arrêter
                    this.currentlyLive.delete(key);
                }
            }

        } catch (error) {
            this.logger.error('Erreur lors de la vérification Twitch:', error);
        }
    }

    async checkYouTubeStreamers(streamers) {
        // Implementation pour YouTube Live (plus complexe car nécessite plusieurs appels API)
        for (const streamer of streamers) {
            try {
                // Vérifier si le canal a un live en cours
                // Note: YouTube API est plus limitée pour les lives en temps réel
                // Cette implémentation est simplifiée
            } catch (error) {
                this.logger.error(`Erreur YouTube pour ${streamer.username}:`, error);
            }
        }
    }

    async checkKickStreamers(streamers) {
        for (const streamer of streamers) {
            try {
                const response = await axios.get(`${this.apis.kick.baseUrl}/channels/${streamer.username}`);
                const key = `${streamer.guildId}-${streamer.platform}-${streamer.username.toLowerCase()}`;
                
                const isLive = response.data.livestream !== null;
                const wasLive = this.currentlyLive.has(key);

                if (isLive && !wasLive) {
                    this.currentlyLive.set(key, { startedAt: Date.now(), streamData: response.data.livestream });
                    await this.sendStreamNotification(streamer, response.data.livestream, 'kick');
                } else if (!isLive && wasLive) {
                    this.currentlyLive.delete(key);
                }

            } catch (error) {
                this.logger.error(`Erreur Kick pour ${streamer.username}:`, error);
            }
        }
    }

    async sendStreamNotification(streamer, streamData, platform) {
        try {
            const guild = this.client.guilds.cache.get(streamer.guildId);
            if (!guild) return;

            const channel = guild.channels.cache.get(streamer.channelId);
            if (!channel) return;

            const embed = this.createStreamEmbed(streamer, streamData, platform);
            const components = this.createStreamComponents(streamer, streamData, platform);

            let content = streamer.customMessage || `🔴 **${streamer.username}** est maintenant en live !`;
            
            if (streamer.roleId) {
                content = `<@&${streamer.roleId}> ${content}`;
            }

            await channel.send({
                content,
                embeds: [embed],
                components: components ? [components] : []
            });

            this.stats.notificationsSent++;
            this.logger.info(`📢 Notification envoyée pour ${streamer.username} (${platform})`);

        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de la notification pour ${streamer.username}:`, error);
        }
    }

    createStreamEmbed(streamer, streamData, platform) {
        const embed = new EmbedBuilder()
            .setColor(this.getPlatformColor(platform))
            .setTimestamp();

        const platformEmojis = {
            'twitch': '🟣',
            'youtube': '🔴', 
            'kick': '🎯'
        };

        const platformNames = {
            'twitch': 'Twitch',
            'youtube': 'YouTube',
            'kick': 'Kick'
        };

        switch (platform) {
            case 'twitch':
                const twitchTitle = streamData.title || 'Aucun titre disponible';
                const twitchGame = streamData.game_name || 'Jeu non spécifié';
                const twitchViewers = streamData.viewer_count || 0;
                
                embed
                    .setAuthor({ 
                        name: `${streamData.user_name || streamer.username}`, 
                        iconURL: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/twitch.png',
                        url: `https://twitch.tv/${streamer.username}`
                    })
                    .setTitle(`🔴 ${platformEmojis[platform]} EN DIRECT SUR ${platformNames[platform].toUpperCase()}`)
                    .setDescription(`**${twitchTitle}**\n\n💬 *"${this.getTwitchQuote(twitchGame)}"*`)
                    .addFields(
                        { 
                            name: '🎮 Catégorie', 
                            value: `\`\`\`${twitchGame}\`\`\``, 
                            inline: true 
                        },
                        { 
                            name: '👥 Spectateurs', 
                            value: `\`\`\`${this.formatViewerCount(twitchViewers)}\`\`\``, 
                            inline: true 
                        },
                        { 
                            name: '⏰ Statut', 
                            value: `\`\`\`🟢 EN LIGNE\`\`\``, 
                            inline: true 
                        },
                        {
                            name: '📊 Statistiques',
                            value: `**Plateforme:** ${platformNames[platform]}\n**Qualité:** HD 1080p\n**Langue:** Français`,
                            inline: false
                        }
                    )
                    .setURL(`https://twitch.tv/${streamer.username}`)
                    .setImage(streamData.thumbnail_url?.replace('{width}', '1920').replace('{height}', '1080') || 'https://via.placeholder.com/1920x1080/9146FF/ffffff?text=TWITCH+LIVE')
                    .setThumbnail(`https://logo.clearbit.com/twitch.tv`)
                    .setFooter({ 
                        text: `Stream démarré • ${this.getRelativeTime()} • Notification automatique`, 
                        iconURL: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/twitch.png' 
                    });
                break;

            case 'youtube':
                const youtubeTitle = streamData.title || 'Stream en direct';
                
                embed
                    .setAuthor({ 
                        name: `${streamer.username}`, 
                        iconURL: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/youtube.png',
                        url: `https://youtube.com/@${streamer.username}`
                    })
                    .setTitle(`🔴 ${platformEmojis[platform]} EN DIRECT SUR ${platformNames[platform].toUpperCase()}`)
                    .setDescription(`**${youtubeTitle}**\n\n🎬 *"Découvrez le contenu en direct sur YouTube !"*`)
                    .addFields(
                        { 
                            name: '🎮 Type de contenu', 
                            value: `\`\`\`Live Streaming\`\`\``, 
                            inline: true 
                        },
                        { 
                            name: '📱 Plateforme', 
                            value: `\`\`\`YouTube Live\`\`\``, 
                            inline: true 
                        },
                        { 
                            name: '⏰ Statut', 
                            value: `\`\`\`🔴 EN DIRECT\`\`\``, 
                            inline: true 
                        },
                        {
                            name: '📊 Informations',
                            value: `**Plateforme:** ${platformNames[platform]}\n**Qualité:** 4K Ultra HD\n**Chat:** Activé`,
                            inline: false
                        }
                    )
                    .setURL(`https://youtube.com/@${streamer.username}`)
                    .setImage('https://via.placeholder.com/1920x1080/FF0000/ffffff?text=YOUTUBE+LIVE')
                    .setThumbnail('https://logo.clearbit.com/youtube.com')
                    .setFooter({ 
                        text: `Stream YouTube • ${this.getRelativeTime()} • Notification automatique`, 
                        iconURL: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/youtube.png' 
                    });
                break;

            case 'kick':
                const kickTitle = streamData.session_title || 'Stream en direct';
                const kickCategory = streamData.categories?.[0]?.name || 'Catégorie non spécifiée';
                const kickViewers = streamData.viewer_count || 0;
                
                embed
                    .setAuthor({ 
                        name: `${streamer.username}`, 
                        iconURL: 'https://assets-global.website-files.com/635ae30b3547d10c95b77ad8/6398f7fa14ac4b3e8e64e77a_Logo%20Mark%20Green.svg',
                        url: `https://kick.com/${streamer.username}`
                    })
                    .setTitle(`🔴 ${platformEmojis[platform]} EN DIRECT SUR ${platformNames[platform].toUpperCase()}`)
                    .setDescription(`**${kickTitle}**\n\n⚡ *"L'expérience de streaming nouvelle génération !"*`)
                    .addFields(
                        { 
                            name: '🎮 Catégorie', 
                            value: `\`\`\`${kickCategory}\`\`\``, 
                            inline: true 
                        },
                        { 
                            name: '👥 Spectateurs', 
                            value: `\`\`\`${this.formatViewerCount(kickViewers)}\`\`\``, 
                            inline: true 
                        },
                        { 
                            name: '⏰ Statut', 
                            value: `\`\`\`🟢 LIVE\`\`\``, 
                            inline: true 
                        },
                        {
                            name: '📊 Détails du stream',
                            value: `**Plateforme:** ${platformNames[platform]}\n**Qualité:** HD+\n**Latence:** Ultra-faible`,
                            inline: false
                        }
                    )
                    .setURL(`https://kick.com/${streamer.username}`)
                    .setImage(streamData.thumbnail?.url || 'https://via.placeholder.com/1920x1080/53FC18/ffffff?text=KICK+LIVE')
                    .setThumbnail('https://assets-global.website-files.com/635ae30b3547d10c95b77ad8/6398f7fa14ac4b3e8e64e77a_Logo%20Mark%20Green.svg')
                    .setFooter({ 
                        text: `Stream Kick • ${this.getRelativeTime()} • Notification automatique`, 
                        iconURL: 'https://assets-global.website-files.com/635ae30b3547d10c95b77ad8/6398f7fa14ac4b3e8e64e77a_Logo%20Mark%20Green.svg' 
                    });
                break;
        }

        return embed;
    }

    createStreamComponents(streamer, streamData, platform) {
        const row = new ActionRowBuilder();

        switch (platform) {
            case 'twitch':
                row.addComponents(
                    new ButtonBuilder()
                        .setLabel('🟣 Regarder sur Twitch')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://twitch.tv/${streamer.username}`),
                    new ButtonBuilder()
                        .setLabel('💬 Chat Twitch')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://twitch.tv/popout/${streamer.username}/chat`),
                    new ButtonBuilder()
                        .setLabel('� Suivre')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://twitch.tv/${streamer.username}`)
                );
                break;

            case 'youtube':
                row.addComponents(
                    new ButtonBuilder()
                        .setLabel('🔴 Regarder sur YouTube')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://youtube.com/@${streamer.username}`),
                    new ButtonBuilder()
                        .setLabel('👍 Liker la vidéo')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://youtube.com/@${streamer.username}`),
                    new ButtonBuilder()
                        .setLabel('� S\'abonner')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://youtube.com/@${streamer.username}`)
                );
                break;

            case 'kick':
                row.addComponents(
                    new ButtonBuilder()
                        .setLabel('🎯 Regarder sur Kick')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://kick.com/${streamer.username}`),
                    new ButtonBuilder()
                        .setLabel('💰 Supporter')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://kick.com/${streamer.username}`),
                    new ButtonBuilder()
                        .setLabel('👥 Suivre')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://kick.com/${streamer.username}`)
                );
                break;
        }

        return row.components.length > 0 ? row : null;
    }

    getPlatformColor(platform) {
        const colors = {
            'twitch': '#9146FF',
            'youtube': '#FF0000',
            'kick': '#53FC18'
        };
        return colors[platform] || '#0099ff';
    }

    formatViewerCount(count) {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }

    getRelativeTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    getTwitchQuote(game) {
        const quotes = {
            'Just Chatting': 'Venez discuter et passer un bon moment !',
            'Fortnite': 'Battle Royale en cours, action garantie !',
            'League of Legends': 'MOBA intense avec des plays épiques !',
            'Valorant': 'FPS tactique, chaque round compte !',
            'Minecraft': 'Construction et aventure dans un monde infini !',
            'Grand Theft Auto V': 'Roleplay et action dans Los Santos !',
            'Call of Duty': 'Action FPS non-stop !',
            'Apex Legends': 'Battle Royale avec des légendes !',
            'World of Warcraft': 'MMORPG épique en Azeroth !',
            'FIFA': 'Football virtuel au plus haut niveau !'
        };
        return quotes[game] || 'Stream de qualité, ne ratez pas ça !';
    }

    async sendTestNotification(guildId, platform, username) {
        try {
            const key = `${guildId}-${platform}-${username.toLowerCase()}`;
            const streamer = this.streamers.get(key);
            
            if (!streamer) {
                return { success: false, error: 'Streamer non configuré' };
            }

            // Créer des données de test
            const testStreamData = this.createTestStreamData(platform, username);
            await this.sendStreamNotification(streamer, testStreamData, platform);

            return { success: true };
        } catch (error) {
            this.logger.error('Erreur lors du test:', error);
            return { success: false, error: 'Erreur lors du test' };
        }
    }

    createTestStreamData(platform, username) {
        const testTitles = [
            '🔥 STREAM ÉPIQUE - Nouvelle mise à jour !',
            '🎮 Session gaming intense avec la communauté',
            '✨ Découverte du nouveau contenu - Première !',
            '🚀 Challenge impossible - On y arrivera ?',
            '💎 Stream spécial - Événement exclusif !'
        ];
        
        const testGames = [
            'Just Chatting', 'Fortnite', 'League of Legends', 'Valorant', 
            'Minecraft', 'Grand Theft Auto V', 'Call of Duty', 'Apex Legends'
        ];

        const randomTitle = testTitles[Math.floor(Math.random() * testTitles.length)];
        const randomGame = testGames[Math.floor(Math.random() * testGames.length)];
        const randomViewers = Math.floor(Math.random() * 50000) + 100;

        switch (platform) {
            case 'twitch':
                return {
                    user_name: username,
                    title: randomTitle,
                    game_name: randomGame,
                    viewer_count: randomViewers,
                    thumbnail_url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username.toLowerCase()}-1920x1080.jpg`,
                    tag_ids: ['Français', 'Chill', 'Interactive']
                };
            case 'youtube':
                return {
                    title: randomTitle,
                    game_name: randomGame,
                    viewer_count: randomViewers
                };
            case 'kick':
                return {
                    session_title: randomTitle,
                    viewer_count: randomViewers,
                    categories: [{ name: randomGame }],
                    thumbnail: { url: `https://images.kick.com/video_thumbnails/${username}/live_thumbnail.webp` }
                };
            default:
                return { title: randomTitle };
        }
    }

    async getStats(guildId) {
        const guildStreamers = await this.getStreamers(guildId);
        const currentlyLive = Array.from(this.currentlyLive.keys())
            .filter(key => key.startsWith(guildId))
            .length;

        const platforms = {};
        guildStreamers.forEach(streamer => {
            platforms[streamer.platform] = (platforms[streamer.platform] || 0) + 1;
        });

        return {
            totalStreamers: guildStreamers.length,
            currentlyLive,
            platforms,
            ...this.stats
        };
    }
}
