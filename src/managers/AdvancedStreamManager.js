import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, WebhookClient } from 'discord.js';
import axios from 'axios';
import crypto from 'crypto';

export default class AdvancedStreamManager {
    constructor(client) {
        this.client = client;
        this.db = client.db;
        this.logger = client.logger;
        
        // Maps pour gérer les données
        this.streamers = new Map(); // streamerId -> streamerData
        this.currentlyLive = new Map(); // streamerId -> liveData
        this.webhookSubscriptions = new Map(); // platform -> subscriptions
        this.rateLimits = new Map(); // platform -> rateLimitData
        
        // Intervals et timeouts
        this.checkInterval = null;
        this.cleanupInterval = null;
        this.rateLimitResetTimeout = new Map();
        
        // Configuration
        this.config = {
            checkIntervals: {
                twitch: 30000,      // 30 secondes (avec webhooks en backup)
                youtube: 60000,     // 1 minute (pas de webhooks)
                kick: 45000         // 45 secondes
            },
            rateLimits: {
                twitch: { requests: 800, window: 60000 }, // 800 req/min
                youtube: { requests: 100, window: 100000 }, // 100 req/100s
                kick: { requests: 60, window: 60000 }      // 60 req/min
            },
            retryDelays: [1000, 5000, 15000, 30000], // Délais de retry progressifs
            maxRetries: 4,
            webhookSecret: process.env.TWITCH_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex')
        };
        
        // APIs et tokens
        this.apis = {
            twitch: {
                baseUrl: 'https://api.twitch.tv/helix',
                clientId: process.env.TWITCH_CLIENT_ID,
                clientSecret: process.env.TWITCH_CLIENT_SECRET,
                accessToken: null,
                tokenExpiresAt: 0,
                webhookUrl: process.env.TWITCH_WEBHOOK_URL // URL de votre serveur pour les webhooks
            },
            youtube: {
                baseUrl: 'https://www.googleapis.com/youtube/v3',
                apiKey: process.env.YOUTUBE_API_KEY
            },
            kick: {
                baseUrl: 'https://kick.com/api/v2'
            }
        };
        
        // Statistiques détaillées
        this.stats = {
            totalNotificationsSent: 0,
            notificationsToday: 0,
            lastResetDate: new Date().toDateString(),
            apiCalls: {
                twitch: { success: 0, errors: 0, rateLimited: 0 },
                youtube: { success: 0, errors: 0, rateLimited: 0 },
                kick: { success: 0, errors: 0, rateLimited: 0 }
            },
            streamersMonitored: 0,
            currentlyLive: 0,
            uptime: Date.now(),
            lastCheck: Date.now(),
            isRunning: false,
            webhooksActive: false
        };
        
        // État du système
        this.isEnabled = false;
        
        this.init();
    }

    async init() {
        try {
            this.logger.info('🚀 Initialisation du gestionnaire de streams avancé...');
            
            // Vérifier les variables d'environnement
            this.validateEnvironment();
            
            // Charger les streamers depuis la DB
            await this.loadStreamersFromDB();
            
            // Initialiser les APIs
            await this.initializeAPIs();
            
            // Configurer les webhooks Twitch si possible
            if (this.apis.twitch.webhookUrl) {
                await this.setupTwitchWebhooks();
            }
            
            // Démarrer la surveillance
            await this.startMonitoring();
            
            // Démarrer le nettoyage périodique
            this.startCleanupSchedule();
            
            this.logger.success('✅ Gestionnaire de streams avancé initialisé');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'initialisation du gestionnaire de streams:', error);
            throw error;
        }
    }

    validateEnvironment() {
        const required = [];
        const optional = [];
        
        // Vérifier si les valeurs sont présentes ET ne sont pas des valeurs par défaut
        const isValidTwitchId = this.apis.twitch.clientId && 
                               this.apis.twitch.clientId !== 'disabled' && 
                               this.apis.twitch.clientId !== 'your_twitch_client_id_here';
        
        const isValidTwitchSecret = this.apis.twitch.clientSecret && 
                                   this.apis.twitch.clientSecret !== 'disabled' && 
                                   this.apis.twitch.clientSecret !== 'your_twitch_client_secret_here';
        
        if (!isValidTwitchId) required.push('TWITCH_CLIENT_ID');
        if (!isValidTwitchSecret) required.push('TWITCH_CLIENT_SECRET');
        if (!this.apis.youtube.apiKey || this.apis.youtube.apiKey === 'your_youtube_api_key_here') {
            optional.push('YOUTUBE_API_KEY');
        }
        
        if (required.length > 0) {
            this.logger.warn(`⚠️ Variables d'environnement Twitch manquantes: ${required.join(', ')}`);
            this.logger.warn('🔄 Le système de streams sera désactivé jusqu\'à configuration complète');
            this.isEnabled = false;
            return; // Ne pas lancer d'erreur, juste désactiver
        }
        
        if (optional.length > 0) {
            this.logger.warn(`Variables d'environnement optionnelles manquantes: ${optional.join(', ')}`);
        }
        
        this.isEnabled = true;
    }

    async initializeAPIs() {
        // Initialiser Twitch
        if (this.apis.twitch.clientId && this.apis.twitch.clientSecret) {
            await this.getTwitchAccessToken();
            this.logger.success('✅ API Twitch initialisée');
        }
        
        // Vérifier YouTube
        if (this.apis.youtube.apiKey) {
            await this.testYouTubeAPI();
            this.logger.success('✅ API YouTube initialisée');
        }
        
        // Kick ne nécessite pas d'initialisation
        this.logger.success('✅ API Kick prête');
    }

    async getTwitchAccessToken() {
        try {
            const response = await axios.post('https://id.twitch.tv/oauth2/token', {
                client_id: this.apis.twitch.clientId,
                client_secret: this.apis.twitch.clientSecret,
                grant_type: 'client_credentials'
            });
            
            this.apis.twitch.accessToken = response.data.access_token;
            this.apis.twitch.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
            
            this.logger.success('🔑 Token Twitch obtenu');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors de l\'obtention du token Twitch:', error);
            throw error;
        }
    }

    async testYouTubeAPI() {
        try {
            await axios.get(`${this.apis.youtube.baseUrl}/search`, {
                params: {
                    key: this.apis.youtube.apiKey,
                    part: 'snippet',
                    type: 'channel',
                    q: 'test',
                    maxResults: 1
                }
            });
            
        } catch (error) {
            if (error.response?.status === 403 || error.response?.status === 400) {
                throw new Error('Clé API YouTube invalide ou permissions insuffisantes');
            }
            throw error;
        }
    }

    async loadStreamersFromDB() {
        try {
            // Simuler le chargement depuis la DB pour l'instant
            // TODO: Implémenter le vrai chargement depuis la base de données
            this.streamers.clear();
            
            // Exemple de données (à remplacer par la vraie DB)
            const streamersData = await this.db.getStreamers?.() || [];
            
            for (const streamer of streamersData) {
                this.streamers.set(streamer.id, {
                    ...streamer,
                    lastChecked: 0,
                    consecutiveErrors: 0,
                    isActive: true
                });
            }
            
            this.stats.streamersMonitored = this.streamers.size;
            this.logger.info(`📊 ${this.streamers.size} streamer(s) chargé(s)`);
            
        } catch (error) {
            this.logger.error('❌ Erreur lors du chargement des streamers:', error);
        }
    }

    async setupTwitchWebhooks() {
        try {
            if (!this.apis.twitch.webhookUrl) {
                this.logger.warn('⚠️ URL de webhook Twitch non configurée');
                return;
            }
            
            this.logger.info('🔗 Configuration des webhooks Twitch...');
            
            // Souscrire aux webhooks pour chaque streamer Twitch
            const twitchStreamers = Array.from(this.streamers.values())
                .filter(s => s.platform === 'twitch');
            
            for (const streamer of twitchStreamers) {
                await this.subscribeTwitchWebhook(streamer);
                await this.sleep(100); // Éviter le rate limiting
            }
            
            this.stats.webhooksActive = true;
            this.logger.success('✅ Webhooks Twitch configurés');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors de la configuration des webhooks:', error);
        }
    }

    async subscribeTwitchWebhook(streamer) {
        try {
            const response = await axios.post(
                'https://api.twitch.tv/helix/eventsub/subscriptions',
                {
                    type: 'stream.online',
                    version: '1',
                    condition: {
                        broadcaster_user_id: streamer.platformId
                    },
                    transport: {
                        method: 'webhook',
                        callback: `${this.apis.twitch.webhookUrl}/webhook/twitch`,
                        secret: this.config.webhookSecret
                    }
                },
                {
                    headers: {
                        'Client-ID': this.apis.twitch.clientId,
                        'Authorization': `Bearer ${this.apis.twitch.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            this.logger.success(`✅ Webhook configuré pour ${streamer.username}`);
            
        } catch (error) {
            this.logger.error(`❌ Erreur webhook pour ${streamer.username}:`, error.response?.data || error.message);
        }
    }

    async startMonitoring() {
        if (this.stats.isRunning) {
            this.logger.warn('⚠️ La surveillance est déjà en cours');
            return;
        }
        
        this.stats.isRunning = true;
        this.logger.info('🎮 Démarrage de la surveillance des streams...');
        
        // Fonction de vérification principale
        const checkStreams = async () => {
            if (!this.stats.isRunning) return;
            
            try {
                await this.checkAllStreams();
                this.stats.lastCheck = Date.now();
                
                // Réinitialiser les statistiques quotidiennes si nécessaire
                const currentDate = new Date().toDateString();
                if (this.stats.lastResetDate !== currentDate) {
                    this.stats.notificationsToday = 0;
                    this.stats.lastResetDate = currentDate;
                }
                
            } catch (error) {
                this.logger.error('❌ Erreur lors de la vérification des streams:', error);
            }
        };
        
        // Première vérification immédiate
        await checkStreams();
        
        // Planifier les vérifications périodiques
        this.checkInterval = setInterval(checkStreams, Math.min(
            this.config.checkIntervals.twitch,
            this.config.checkIntervals.youtube,
            this.config.checkIntervals.kick
        ));
        
        this.logger.success('✅ Surveillance des streams démarrée');
    }

    async checkAllStreams() {
        const platforms = ['twitch', 'youtube', 'kick'];
        const checkPromises = [];
        
        for (const platform of platforms) {
            const platformStreamers = Array.from(this.streamers.values())
                .filter(s => s.platform === platform && s.isActive);
            
            if (platformStreamers.length > 0) {
                checkPromises.push(this.checkPlatformStreams(platform, platformStreamers));
            }
        }
        
        await Promise.allSettled(checkPromises);
        this.stats.currentlyLive = this.currentlyLive.size;
    }

    async checkPlatformStreams(platform, streamers) {
        try {
            // Vérifier le rate limiting
            if (!this.canMakeRequest(platform)) {
                this.logger.warn(`⏱️ Rate limit atteint pour ${platform}, attente...`);
                return;
            }
            
            switch (platform) {
                case 'twitch':
                    await this.checkTwitchStreams(streamers);
                    break;
                case 'youtube':
                    await this.checkYouTubeStreams(streamers);
                    break;
                case 'kick':
                    await this.checkKickStreams(streamers);
                    break;
            }
            
        } catch (error) {
            this.logger.error(`❌ Erreur lors de la vérification ${platform}:`, error);
        }
    }

    canMakeRequest(platform) {
        const now = Date.now();
        const rateLimit = this.rateLimits.get(platform);
        
        if (!rateLimit) {
            this.rateLimits.set(platform, {
                requests: 1,
                windowStart: now
            });
            return true;
        }
        
        const windowDuration = this.config.rateLimits[platform].window;
        const maxRequests = this.config.rateLimits[platform].requests;
        
        if (now - rateLimit.windowStart > windowDuration) {
            // Nouvelle fenêtre
            rateLimit.requests = 1;
            rateLimit.windowStart = now;
            return true;
        }
        
        if (rateLimit.requests >= maxRequests) {
            return false; // Rate limit atteint
        }
        
        rateLimit.requests++;
        return true;
    }

    async checkTwitchStreams(streamers) {
        try {
            // Vérifier si le token est encore valide
            if (Date.now() >= this.apis.twitch.tokenExpiresAt) {
                await this.getTwitchAccessToken();
            }
            
            const usernames = streamers.map(s => s.username);
            const response = await axios.get(`${this.apis.twitch.baseUrl}/streams`, {
                params: {
                    user_login: usernames.join(','),
                    first: usernames.length
                },
                headers: {
                    'Client-ID': this.apis.twitch.clientId,
                    'Authorization': `Bearer ${this.apis.twitch.accessToken}`
                }
            });
            
            this.stats.apiCalls.twitch.success++;
            
            const liveStreams = response.data.data;
            await this.processStreamUpdates('twitch', streamers, liveStreams);
            
        } catch (error) {
            this.stats.apiCalls.twitch.errors++;
            
            if (error.response?.status === 429) {
                this.stats.apiCalls.twitch.rateLimited++;
            }
            
            throw error;
        }
    }

    async checkYouTubeStreams(streamers) {
        // Implémentation YouTube (plus complexe car nécessite plusieurs appels API)
        try {
            for (const streamer of streamers) {
                const response = await axios.get(`${this.apis.youtube.baseUrl}/search`, {
                    params: {
                        key: this.apis.youtube.apiKey,
                        channelId: streamer.platformId,
                        part: 'snippet',
                        type: 'video',
                        eventType: 'live',
                        maxResults: 1
                    }
                });
                
                this.stats.apiCalls.youtube.success++;
                
                const liveVideos = response.data.items;
                await this.processYouTubeStream(streamer, liveVideos);
                
                // Petit délai pour éviter le rate limiting
                await this.sleep(100);
            }
            
        } catch (error) {
            this.stats.apiCalls.youtube.errors++;
            
            if (error.response?.status === 429) {
                this.stats.apiCalls.youtube.rateLimited++;
            }
            
            throw error;
        }
    }

    async checkKickStreams(streamers) {
        try {
            for (const streamer of streamers) {
                const response = await axios.get(`${this.apis.kick.baseUrl}/channels/${streamer.username}`);
                
                this.stats.apiCalls.kick.success++;
                
                const channelData = response.data;
                await this.processKickStream(streamer, channelData);
                
                await this.sleep(50); // Délai pour éviter de surcharger l'API
            }
            
        } catch (error) {
            this.stats.apiCalls.kick.errors++;
            throw error;
        }
    }

    async processStreamUpdates(platform, streamers, liveStreams) {
        for (const streamer of streamers) {
            const streamData = liveStreams.find(stream => 
                stream.user_login.toLowerCase() === streamer.username.toLowerCase()
            );
            
            const streamerId = this.getStreamerId(streamer);
            const wasLive = this.currentlyLive.has(streamerId);
            const isLive = !!streamData;
            
            if (isLive && !wasLive) {
                // Le streamer vient de passer en live
                await this.handleStreamStart(streamer, streamData);
            } else if (!isLive && wasLive) {
                // Le streamer vient d'arrêter son stream
                await this.handleStreamEnd(streamer);
            } else if (isLive && wasLive) {
                // Mettre à jour les données du stream
                await this.updateLiveStream(streamer, streamData);
            }
        }
    }

    async processYouTubeStream(streamer, liveVideos) {
        const streamerId = this.getStreamerId(streamer);
        const wasLive = this.currentlyLive.has(streamerId);
        const isLive = liveVideos.length > 0;
        
        if (isLive && !wasLive) {
            const videoData = liveVideos[0];
            await this.handleStreamStart(streamer, {
                title: videoData.snippet.title,
                game_name: 'YouTube Live',
                viewer_count: 0, // YouTube ne fournit pas le nombre de viewers via cette API
                thumbnail_url: videoData.snippet.thumbnails.high?.url,
                started_at: videoData.snippet.publishedAt,
                platform_url: `https://www.youtube.com/watch?v=${videoData.id.videoId}`
            });
        } else if (!isLive && wasLive) {
            await this.handleStreamEnd(streamer);
        }
    }

    async processKickStream(streamer, channelData) {
        const streamerId = this.getStreamerId(streamer);
        const wasLive = this.currentlyLive.has(streamerId);
        const isLive = channelData.livestream?.is_live || false;
        
        if (isLive && !wasLive) {
            const livestream = channelData.livestream;
            await this.handleStreamStart(streamer, {
                title: livestream.session_title,
                game_name: livestream.categories?.[0]?.name || 'Kick Stream',
                viewer_count: livestream.viewer_count || 0,
                thumbnail_url: livestream.thumbnail?.url,
                started_at: livestream.created_at,
                platform_url: `https://kick.com/${streamer.username}`
            });
        } else if (!isLive && wasLive) {
            await this.handleStreamEnd(streamer);
        }
    }

    async handleStreamStart(streamer, streamData) {
        try {
            const streamerId = this.getStreamerId(streamer);
            
            // Stocker les données du stream en cours
            this.currentlyLive.set(streamerId, {
                ...streamData,
                streamer: streamer,
                notifiedAt: Date.now(),
                notificationId: null
            });
            
            // Envoyer la notification
            await this.sendLiveNotification(streamer, streamData);
            
            // Mettre à jour les statistiques
            this.stats.totalNotificationsSent++;
            this.stats.notificationsToday++;
            
            this.logger.success(`🎉 ${streamer.username} est maintenant en live sur ${streamer.platform}!`);
            
        } catch (error) {
            this.logger.error(`❌ Erreur lors du traitement du début de stream pour ${streamer.username}:`, error);
        }
    }

    async handleStreamEnd(streamer) {
        try {
            const streamerId = this.getStreamerId(streamer);
            const liveData = this.currentlyLive.get(streamerId);
            
            if (!liveData) return;
            
            // Supprimer des streams en cours
            this.currentlyLive.delete(streamerId);
            
            // Optionnel: Envoyer une notification de fin de stream
            if (streamer.notifyOnEnd) {
                await this.sendOfflineNotification(streamer, liveData);
            }
            
            this.logger.info(`📺 ${streamer.username} n'est plus en live sur ${streamer.platform}`);
            
        } catch (error) {
            this.logger.error(`❌ Erreur lors du traitement de fin de stream pour ${streamer.username}:`, error);
        }
    }

    async updateLiveStream(streamer, streamData) {
        const streamerId = this.getStreamerId(streamer);
        const currentData = this.currentlyLive.get(streamerId);
        
        if (currentData) {
            // Mettre à jour avec les nouvelles données
            this.currentlyLive.set(streamerId, {
                ...currentData,
                ...streamData,
                streamer: streamer
            });
        }
    }

    async sendLiveNotification(streamer, streamData) {
        try {
            const guild = this.client.guilds.cache.get(streamer.guildId);
            if (!guild) return;
            
            const channel = guild.channels.cache.get(streamer.channelId);
            if (!channel) return;
            
            // Créer l'embed de notification
            const embed = await this.createLiveEmbed(streamer, streamData);
            
            // Créer les boutons d'action
            const actionRow = this.createActionButtons(streamer, streamData);
            
            // Préparer le message avec mentions
            let content = '';
            if (streamer.roleId) {
                content += `<@&${streamer.roleId}> `;
            }
            if (streamer.customMessage) {
                content += streamer.customMessage.replace('{streamer}', streamer.displayName || streamer.username);
            }
            
            // Envoyer la notification
            const message = await channel.send({
                content: content || undefined,
                embeds: [embed],
                components: actionRow ? [actionRow] : []
            });
            
            // Stocker l'ID du message pour d'éventuelles mises à jour
            const streamerId = this.getStreamerId(streamer);
            const liveData = this.currentlyLive.get(streamerId);
            if (liveData) {
                liveData.notificationId = message.id;
            }
            
        } catch (error) {
            this.logger.error(`❌ Erreur lors de l'envoi de notification pour ${streamer.username}:`, error);
        }
    }

    async createLiveEmbed(streamer, streamData) {
        const platformEmojis = {
            twitch: '🟣',
            youtube: '🔴',
            kick: '🎯'
        };
        
        const platformColors = {
            twitch: '#9146FF',
            youtube: '#FF0000',
            kick: '#53FC18'
        };
        
        const embed = new EmbedBuilder()
            .setTitle(`${platformEmojis[streamer.platform]} ${streamer.displayName || streamer.username} est en live !`)
            .setDescription(streamData.title || 'Pas de titre disponible')
            .setColor(platformColors[streamer.platform])
            .setTimestamp()
            .setFooter({ 
                text: `${streamer.platform.charAt(0).toUpperCase() + streamer.platform.slice(1)} • En live depuis`,
                iconURL: this.client.user.displayAvatarURL()
            });
        
        // Ajouter des champs d'information
        if (streamData.game_name) {
            embed.addFields({
                name: '🎮 Catégorie',
                value: streamData.game_name,
                inline: true
            });
        }
        
        if (streamData.viewer_count !== undefined) {
            embed.addFields({
                name: '👥 Spectateurs',
                value: streamData.viewer_count.toLocaleString(),
                inline: true
            });
        }
        
        // Ajouter la miniature si disponible
        if (streamData.thumbnail_url) {
            // Twitch utilise des placeholders dans les URLs de miniatures
            let thumbnailUrl = streamData.thumbnail_url;
            if (streamer.platform === 'twitch') {
                thumbnailUrl = thumbnailUrl
                    .replace('{width}', '1920')
                    .replace('{height}', '1080');
            }
            embed.setImage(thumbnailUrl);
        }
        
        // Ajouter l'avatar du streamer si disponible
        if (streamer.avatarUrl) {
            embed.setThumbnail(streamer.avatarUrl);
        }
        
        return embed;
    }

    createActionButtons(streamer, streamData) {
        const platformUrls = {
            twitch: `https://twitch.tv/${streamer.username}`,
            youtube: streamData.platform_url || `https://youtube.com/c/${streamer.username}`,
            kick: `https://kick.com/${streamer.username}`
        };
        
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Regarder le stream')
                    .setStyle(ButtonStyle.Link)
                    .setURL(platformUrls[streamer.platform])
                    .setEmoji('📺'),
                new ButtonBuilder()
                    .setCustomId(`stream_remind_${this.getStreamerId(streamer)}`)
                    .setLabel('Me rappeler')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔔'),
                new ButtonBuilder()
                    .setCustomId(`stream_share_${this.getStreamerId(streamer)}`)
                    .setLabel('Partager')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📤')
            );
        
        return actionRow;
    }

    async sendOfflineNotification(streamer, liveData) {
        try {
            const guild = this.client.guilds.cache.get(streamer.guildId);
            if (!guild) return;
            
            const channel = guild.channels.cache.get(streamer.channelId);
            if (!channel) return;
            
            const duration = this.formatDuration(Date.now() - new Date(liveData.started_at).getTime());
            
            const embed = new EmbedBuilder()
                .setTitle(`📺 ${streamer.displayName || streamer.username} n'est plus en live`)
                .setDescription(`Le stream a duré ${duration}`)
                .setColor('#95a5a6')
                .setTimestamp()
                .setFooter({ 
                    text: `${streamer.platform.charAt(0).toUpperCase() + streamer.platform.slice(1)} • Stream terminé`,
                    iconURL: this.client.user.displayAvatarURL()
                });
            
            await channel.send({ embeds: [embed] });
            
        } catch (error) {
            this.logger.error(`❌ Erreur lors de l'envoi de notification de fin pour ${streamer.username}:`, error);
        }
    }

    // Méthodes utilitaires
    getStreamerId(streamer) {
        return `${streamer.platform}_${streamer.username}_${streamer.guildId}`;
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startCleanupSchedule() {
        // Nettoyage périodique toutes les heures
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, 3600000); // 1 heure
    }

    async performCleanup() {
        try {
            // Nettoyer les anciens rate limits
            const now = Date.now();
            for (const [platform, rateLimit] of this.rateLimits.entries()) {
                const windowDuration = this.config.rateLimits[platform].window;
                if (now - rateLimit.windowStart > windowDuration * 2) {
                    this.rateLimits.delete(platform);
                }
            }
            
            // Nettoyer les streams qui ne sont plus live depuis longtemps
            for (const [streamerId, liveData] of this.currentlyLive.entries()) {
                if (now - liveData.notifiedAt > 24 * 60 * 60 * 1000) { // 24 heures
                    this.currentlyLive.delete(streamerId);
                    this.logger.info(`🧹 Nettoyage: suppression de ${liveData.streamer.username} (inactif depuis 24h)`);
                }
            }
            
            this.logger.info('🧹 Nettoyage périodique effectué');
            
        } catch (error) {
            this.logger.error('❌ Erreur lors du nettoyage:',);
        }
    }

    // Méthodes publiques pour la gestion
    async addStreamer(streamerData) {
        const streamerId = this.getStreamerId(streamerData);
        this.streamers.set(streamerId, {
            ...streamerData,
            lastChecked: 0,
            consecutiveErrors: 0,
            isActive: true,
            addedAt: Date.now()
        });
        
        this.stats.streamersMonitored = this.streamers.size;
        
        // Sauvegarder en DB
        await this.saveStreamerToDB(streamerData);
        
        // Configurer le webhook Twitch si nécessaire
        if (streamerData.platform === 'twitch' && this.apis.twitch.webhookUrl) {
            await this.subscribeTwitchWebhook(streamerData);
        }
        
        this.logger.success(`✅ Streamer ajouté: ${streamerData.username} (${streamerData.platform})`);
    }

    async removeStreamer(streamerId) {
        const streamer = this.streamers.get(streamerId);
        if (!streamer) return false;
        
        this.streamers.delete(streamerId);
        this.currentlyLive.delete(streamerId);
        this.stats.streamersMonitored = this.streamers.size;
        
        // Supprimer de la DB
        await this.removeStreamerFromDB(streamerId);
        
        this.logger.success(`✅ Streamer supprimé: ${streamer.username} (${streamer.platform})`);
        return true;
    }

    async getStats() {
        return {
            ...this.stats,
            uptime: this.formatDuration(Date.now() - this.stats.uptime),
            rateLimits: Object.fromEntries(this.rateLimits),
            streamersMonitored: this.streamers.size,
            currentlyLive: this.currentlyLive.size
        };
    }

    async getLiveStreams() {
        return Array.from(this.currentlyLive.values());
    }

    async stopMonitoring() {
        this.stats.isRunning = false;
        
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        this.logger.info('🛑 Surveillance des streams arrêtée');
    }

    // Méthodes de base de données (à implémenter selon votre système)
    async saveStreamerToDB(streamerData) {
        // TODO: Implémenter la sauvegarde en base de données
        try {
            await this.db.saveStreamer?.(streamerData);
        } catch (error) {
            this.logger.error('❌ Erreur sauvegarde DB:', error);
        }
    }

    async removeStreamerFromDB(streamerId) {
        // TODO: Implémenter la suppression de la base de données
        try {
            await this.db.removeStreamer?.(streamerId);
        } catch (error) {
            this.logger.error('❌ Erreur suppression DB:', error);
        }
    }
}
