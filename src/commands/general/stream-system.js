import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stream-system')
        .setDescription('🎮 Système complet de notifications de streams (Twitch, YouTube, Kick)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('➕ Ajouter un streamer à surveiller')
                .addStringOption(option =>
                    option
                        .setName('platform')
                        .setDescription('🎯 Plateforme de streaming')
                        .setRequired(true)
                        .addChoices(
                            { name: '🟣 Twitch', value: 'twitch' },
                            { name: '🔴 YouTube', value: 'youtube' },
                            { name: '🎯 Kick', value: 'kick' }
                        ))
                .addStringOption(option =>
                    option
                        .setName('username')
                        .setDescription('👤 Nom d\'utilisateur du streamer')
                        .setRequired(true))
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('📢 Canal où envoyer les notifications')
                        .setRequired(true))
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('🏷️ Rôle à mentionner lors des notifications')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('💬 Message personnalisé (utilisez {streamer} pour le nom)')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('display-name')
                        .setDescription('✨ Nom d\'affichage personnalisé')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('➖ Supprimer un streamer de la surveillance')
                .addStringOption(option =>
                    option
                        .setName('streamer')
                        .setDescription('👤 Streamer à supprimer')
                        .setRequired(true)
                        .setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 Afficher la liste des streamers surveillés')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('live')
                .setDescription('🔴 Afficher les streams actuellement en cours')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 Afficher les statistiques du système')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('⚙️ Configuration avancée du système')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('🧪 Tester une notification pour un streamer')
                .addStringOption(option =>
                    option
                        .setName('streamer')
                        .setDescription('👤 Streamer à tester')
                        .setRequired(true)
                        .setAutocomplete(true))
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const streamManager = interaction.client.streamManager;

        if (!streamManager) {
            return await interaction.reply({
                content: '❌ Le système de streams n\'est pas initialisé. Contactez un administrateur.',
                ephemeral: true
            });
        }

        // Vérifier les permissions pour certaines commandes
        if (['add', 'remove', 'config'].includes(subcommand)) {
            if (!interaction.member.permissions.has('ManageChannels')) {
                return await interaction.reply({
                    content: '❌ Vous devez avoir la permission "Gérer les salons" pour utiliser cette commande.',
                    ephemeral: true
                });
            }
        }

        try {
            switch (subcommand) {
                case 'add':
                    await this.handleAdd(interaction, streamManager);
                    break;
                case 'remove':
                    await this.handleRemove(interaction, streamManager);
                    break;
                case 'list':
                    await this.handleList(interaction, streamManager);
                    break;
                case 'live':
                    await this.handleLive(interaction, streamManager);
                    break;
                case 'stats':
                    await this.handleStats(interaction, streamManager);
                    break;
                case 'config':
                    await this.handleConfig(interaction, streamManager);
                    break;
                case 'test':
                    await this.handleTest(interaction, streamManager);
                    break;
            }
        } catch (error) {
            console.error('Erreur dans stream-system:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Erreur')
                .setDescription('Une erreur est survenue lors de l\'exécution de la commande.')
                .setColor('#ff0000')
                .setTimestamp();

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async handleAdd(interaction, streamManager) {
        await interaction.deferReply();

        const platform = interaction.options.getString('platform');
        const username = interaction.options.getString('username').toLowerCase().trim();
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');
        const customMessage = interaction.options.getString('message');
        const displayName = interaction.options.getString('display-name');

        // Vérifier si le canal est textuel
        if (!channel.isTextBased()) {
            return await interaction.editReply({
                content: '❌ Le canal spécifié doit être un canal textuel.'
            });
        }

        // Vérifier si le streamer existe déjà
        const streamerId = `${platform}_${username}_${interaction.guild.id}`;
        if (streamManager.streamers.has(streamerId)) {
            return await interaction.editReply({
                content: `❌ Le streamer **${username}** sur **${platform}** est déjà surveillé dans ce serveur.`
            });
        }

        try {
            // Vérifier que le streamer existe sur la plateforme
            const streamerData = await this.validateStreamer(platform, username);
            if (!streamerData) {
                return await interaction.editReply({
                    content: `❌ Impossible de trouver le streamer **${username}** sur **${platform}**.`
                });
            }

            // Préparer les données du streamer
            const newStreamer = {
                id: streamerId,
                platform: platform,
                username: username,
                displayName: displayName || streamerData.displayName || username,
                platformId: streamerData.id,
                guildId: interaction.guild.id,
                channelId: channel.id,
                roleId: role?.id || null,
                customMessage: customMessage || null,
                avatarUrl: streamerData.avatarUrl || null,
                addedBy: interaction.user.id,
                addedAt: Date.now(),
                notifyOnEnd: false // Par défaut, pas de notification de fin
            };

            // Ajouter le streamer
            await streamManager.addStreamer(newStreamer);

            // Créer l'embed de confirmation
            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ Streamer ajouté avec succès !')
                .setDescription(`**${newStreamer.displayName}** est maintenant surveillé sur ${platform}.`)
                .addFields(
                    { name: '👤 Streamer', value: newStreamer.displayName, inline: true },
                    { name: '🎯 Plateforme', value: platform.charAt(0).toUpperCase() + platform.slice(1), inline: true },
                    { name: '📢 Canal', value: `<#${channel.id}>`, inline: true }
                )
                .setColor(this.getPlatformColor(platform))
                .setTimestamp();

            if (role) {
                confirmEmbed.addFields({ name: '🏷️ Rôle', value: `<@&${role.id}>`, inline: true });
            }

            if (customMessage) {
                confirmEmbed.addFields({ name: '💬 Message', value: customMessage, inline: false });
            }

            if (newStreamer.avatarUrl) {
                confirmEmbed.setThumbnail(newStreamer.avatarUrl);
            }

            await interaction.editReply({ embeds: [confirmEmbed] });

        } catch (error) {
            console.error('Erreur lors de l\'ajout du streamer:', error);
            await interaction.editReply({
                content: `❌ Erreur lors de l'ajout du streamer: ${error.message}`
            });
        }
    },

    async handleRemove(interaction, streamManager) {
        await interaction.deferReply();

        const streamerInput = interaction.options.getString('streamer');
        
        // Trouver le streamer
        const streamerId = Array.from(streamManager.streamers.keys())
            .find(id => id.includes(streamerInput) && id.includes(interaction.guild.id));

        if (!streamerId) {
            return await interaction.editReply({
                content: '❌ Streamer non trouvé. Utilisez `/stream-system list` pour voir les streamers surveillés.'
            });
        }

        const streamer = streamManager.streamers.get(streamerId);
        const success = await streamManager.removeStreamer(streamerId);

        if (success) {
            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ Streamer supprimé')
                .setDescription(`**${streamer.displayName}** n'est plus surveillé.`)
                .setColor('#95a5a6')
                .setTimestamp();

            await interaction.editReply({ embeds: [confirmEmbed] });
        } else {
            await interaction.editReply({
                content: '❌ Erreur lors de la suppression du streamer.'
            });
        }
    },

    async handleList(interaction, streamManager) {
        await interaction.deferReply();

        const guildStreamers = Array.from(streamManager.streamers.values())
            .filter(s => s.guildId === interaction.guild.id);

        if (guildStreamers.length === 0) {
            const noStreamersEmbed = new EmbedBuilder()
                .setTitle('📋 Aucun streamer surveillé')
                .setDescription('Utilisez `/stream-system add` pour ajouter des streamers à surveiller.')
                .setColor('#95a5a6');

            return await interaction.editReply({ embeds: [noStreamersEmbed] });
        }

        // Grouper par plateforme
        const groupedStreamers = guildStreamers.reduce((groups, streamer) => {
            if (!groups[streamer.platform]) {
                groups[streamer.platform] = [];
            }
            groups[streamer.platform].push(streamer);
            return groups;
        }, {});

        const embed = new EmbedBuilder()
            .setTitle('📋 Streamers surveillés')
            .setDescription(`Total: **${guildStreamers.length}** streamer(s)`)
            .setColor('#3498db')
            .setTimestamp();

        // Ajouter un champ par plateforme
        for (const [platform, streamers] of Object.entries(groupedStreamers)) {
            const platformEmoji = { twitch: '🟣', youtube: '🔴', kick: '🎯' }[platform];
            const streamerList = streamers
                .map(s => {
                    const isLive = streamManager.currentlyLive.has(s.id) ? '🔴' : '⚫';
                    return `${isLive} **${s.displayName}** → <#${s.channelId}>`;
                })
                .join('\n');

            embed.addFields({
                name: `${platformEmoji} ${platform.charAt(0).toUpperCase() + platform.slice(1)} (${streamers.length})`,
                value: streamerList,
                inline: false
            });
        }

        // Ajouter des boutons d'action
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('stream_list_refresh')
                    .setLabel('🔄 Actualiser')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('stream_list_live_only')
                    .setLabel('🔴 Voir uniquement les lives')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('stream_list_manage')
                    .setLabel('⚙️ Gérer')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({ 
            embeds: [embed],
            components: [actionRow]
        });
    },

    async handleLive(interaction, streamManager) {
        await interaction.deferReply();

        const liveStreams = Array.from(streamManager.currentlyLive.values())
            .filter(stream => stream.streamer.guildId === interaction.guild.id);

        if (liveStreams.length === 0) {
            const noLiveEmbed = new EmbedBuilder()
                .setTitle('📺 Aucun stream en cours')
                .setDescription('Aucun des streamers surveillés n\'est actuellement en live.')
                .setColor('#95a5a6');

            return await interaction.editReply({ embeds: [noLiveEmbed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('🔴 Streams en cours')
            .setDescription(`**${liveStreams.length}** streamer(s) actuellement en live`)
            .setColor('#e74c3c')
            .setTimestamp();

        // Ajouter chaque stream live
        for (const stream of liveStreams.slice(0, 10)) { // Limiter à 10 pour éviter la limite d'embed
            const streamer = stream.streamer;
            const duration = this.formatDuration(Date.now() - new Date(stream.started_at).getTime());
            const platformEmoji = { twitch: '🟣', youtube: '🔴', kick: '🎯' }[streamer.platform];
            
            let streamInfo = `${platformEmoji} **${stream.title || 'Sans titre'}**\n`;
            streamInfo += `🎮 ${stream.game_name || 'Catégorie inconnue'}\n`;
            streamInfo += `⏱️ En live depuis ${duration}\n`;
            if (stream.viewer_count !== undefined) {
                streamInfo += `👥 ${stream.viewer_count.toLocaleString()} spectateurs\n`;
            }
            streamInfo += `📢 <#${streamer.channelId}>`;

            embed.addFields({
                name: `${streamer.displayName}`,
                value: streamInfo,
                inline: true
            });
        }

        if (liveStreams.length > 10) {
            embed.setFooter({ text: `... et ${liveStreams.length - 10} autre(s) stream(s)` });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    async handleStats(interaction, streamManager) {
        await interaction.deferReply();

        const stats = await streamManager.getStats();
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Statistiques du système de streams')
            .setColor('#9b59b6')
            .setTimestamp();

        // Statistiques générales
        embed.addFields(
            { 
                name: '📈 Statistiques générales', 
                value: [
                    `🎯 Streamers surveillés: **${stats.streamersMonitored}**`,
                    `🔴 Actuellement en live: **${stats.currentlyLive}**`,
                    `📨 Notifications envoyées: **${stats.totalNotificationsSent}**`,
                    `📅 Notifications aujourd'hui: **${stats.notificationsToday}**`,
                    `⏱️ Système actif depuis: **${stats.uptime}**`,
                    `🟢 Statut: **${stats.isRunning ? 'Actif' : 'Inactif'}**`
                ].join('\n'),
                inline: false 
            }
        );

        // Statistiques API
        const apiStats = Object.entries(stats.apiCalls)
            .map(([platform, data]) => {
                const total = data.success + data.errors;
                const successRate = total > 0 ? Math.round((data.success / total) * 100) : 0;
                return `${platform}: ${data.success}✅/${data.errors}❌ (${successRate}%)`;
            })
            .join('\n');

        embed.addFields({
            name: '🔗 Statistiques API',
            value: apiStats || 'Aucune donnée',
            inline: false
        });

        // État des webhooks
        embed.addFields({
            name: '🔔 Webhooks',
            value: stats.webhooksActive ? '✅ Actifs (Twitch)' : '⚠️ Inactifs',
            inline: true
        });

        // Dernière vérification
        const lastCheckTime = new Date(stats.lastCheck).toLocaleTimeString('fr-FR');
        embed.addFields({
            name: '🕒 Dernière vérification',
            value: lastCheckTime,
            inline: true
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async handleConfig(interaction, streamManager) {
        // Interface de configuration avancée
        const configEmbed = new EmbedBuilder()
            .setTitle('⚙️ Configuration du système')
            .setDescription('Choisissez les paramètres à configurer')
            .setColor('#3498db');

        const configRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('stream_config_select')
                    .setPlaceholder('Sélectionnez une option de configuration')
                    .addOptions(
                        {
                            label: '🔔 Gérer les webhooks',
                            description: 'Configurer les webhooks Twitch',
                            value: 'webhooks'
                        },
                        {
                            label: '⏱️ Intervalles de vérification',
                            description: 'Modifier les fréquences de vérification',
                            value: 'intervals'
                        },
                        {
                            label: '🎯 Rate limits',
                            description: 'Configurer les limites de requêtes',
                            value: 'ratelimits'
                        },
                        {
                            label: '🔄 Redémarrer le système',
                            description: 'Redémarrer la surveillance',
                            value: 'restart'
                        }
                    )
            );

        await interaction.reply({ 
            embeds: [configEmbed], 
            components: [configRow],
            ephemeral: true 
        });
    },

    async handleTest(interaction, streamManager) {
        await interaction.deferReply({ ephemeral: true });

        const streamerInput = interaction.options.getString('streamer');
        
        // Trouver le streamer
        const streamerId = Array.from(streamManager.streamers.keys())
            .find(id => id.includes(streamerInput) && id.includes(interaction.guild.id));

        if (!streamerId) {
            return await interaction.editReply({
                content: '❌ Streamer non trouvé.'
            });
        }

        const streamer = streamManager.streamers.get(streamerId);
        
        try {
            // Simuler une notification de test
            const testStreamData = {
                title: `🧪 Test de notification pour ${streamer.displayName}`,
                game_name: 'Test de Notification',
                viewer_count: 1337,
                started_at: new Date().toISOString(),
                thumbnail_url: null
            };

            await streamManager.sendLiveNotification(streamer, testStreamData);
            
            await interaction.editReply({
                content: `✅ Notification de test envoyée pour **${streamer.displayName}** dans <#${streamer.channelId}>.`
            });

        } catch (error) {
            console.error('Erreur test notification:', error);
            await interaction.editReply({
                content: `❌ Erreur lors du test: ${error.message}`
            });
        }
    },

    async validateStreamer(platform, username) {
        // Cette fonction devrait valider l'existence du streamer sur la plateforme
        // Pour l'instant, on retourne un objet basique
        // TODO: Implémenter la validation réelle via les APIs
        
        try {
            switch (platform) {
                case 'twitch':
                    return await this.validateTwitchStreamer(username);
                case 'youtube':
                    return await this.validateYouTubeStreamer(username);
                case 'kick':
                    return await this.validateKickStreamer(username);
                default:
                    return null;
            }
        } catch (error) {
            console.error(`Erreur validation ${platform}:`, error);
            return null;
        }
    },

    async validateTwitchStreamer(username) {
        // Validation Twitch simplifiée pour l'instant
        return {
            id: `twitch_${username}`,
            displayName: username.charAt(0).toUpperCase() + username.slice(1),
            avatarUrl: null
        };
    },

    async validateYouTubeStreamer(username) {
        // Validation YouTube simplifiée pour l'instant
        return {
            id: `youtube_${username}`,
            displayName: username.charAt(0).toUpperCase() + username.slice(1),
            avatarUrl: null
        };
    },

    async validateKickStreamer(username) {
        // Validation Kick simplifiée pour l'instant
        return {
            id: `kick_${username}`,
            displayName: username.charAt(0).toUpperCase() + username.slice(1),
            avatarUrl: null
        };
    },

    getPlatformColor(platform) {
        const colors = {
            twitch: '#9146FF',
            youtube: '#FF0000',
            kick: '#53FC18'
        };
        return colors[platform] || '#3498db';
    },

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${seconds}s`;
        }
    },

    // Autocomplétion pour les streamers
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const streamManager = interaction.client.streamManager;
        
        if (!streamManager) return await interaction.respond([]);

        if (focusedOption.name === 'streamer') {
            const guildStreamers = Array.from(streamManager.streamers.values())
                .filter(s => s.guildId === interaction.guild.id);

            const filtered = guildStreamers
                .filter(streamer => 
                    streamer.displayName.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
                    streamer.username.toLowerCase().includes(focusedOption.value.toLowerCase())
                )
                .slice(0, 25); // Discord limite à 25 options

            await interaction.respond(
                filtered.map(streamer => ({
                    name: `${streamer.displayName} (${streamer.platform})`,
                    value: streamer.username
                }))
            );
        }
    }
};
