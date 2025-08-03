import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default class StreamButtonHandler {
    constructor(client) {
        this.client = client;
        this.streamManager = client.streamManager;
        this.logger = client.logger;

        // Map pour stocker les rappels utilisateur
        this.reminders = new Map(); // userId -> Set de streamIds
    }

    async handleStreamButton(interaction) {
        const customId = interaction.customId;
        
        try {
            if (customId.startsWith('stream_remind_')) {
                await this.handleReminder(interaction);
            } else if (customId.startsWith('stream_share_')) {
                await this.handleShare(interaction);
            } else if (customId === 'stream_list_refresh') {
                await this.handleListRefresh(interaction);
            } else if (customId === 'stream_list_live_only') {
                await this.handleLiveOnly(interaction);
            } else if (customId === 'stream_list_manage') {
                await this.handleManage(interaction);
            } else if (customId.startsWith('stream_config_')) {
                await this.handleConfig(interaction);
            } else if (customId.startsWith('stream_manage_')) {
                await this.handleStreamManagement(interaction);
            }
            
        } catch (error) {
            this.logger.error('Erreur dans StreamButtonHandler:', error);
            
            const errorMsg = {
                content: '❌ Une erreur est survenue lors du traitement de votre demande.',
                ephemeral: true
            };

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(errorMsg);
            } else {
                await interaction.reply(errorMsg);
            }
        }
    }

    async handleReminder(interaction) {
        const streamerId = interaction.customId.replace('stream_remind_', '');
        const userId = interaction.user.id;
        
        // Vérifier si l'utilisateur a déjà un rappel pour ce streamer
        if (!this.reminders.has(userId)) {
            this.reminders.set(userId, new Set());
        }
        
        const userReminders = this.reminders.get(userId);
        
        if (userReminders.has(streamerId)) {
            // Supprimer le rappel
            userReminders.delete(streamerId);
            
            await interaction.reply({
                content: '🔕 Rappel supprimé ! Vous ne recevrez plus de notification pour ce streamer.',
                ephemeral: true
            });
        } else {
            // Ajouter le rappel
            userReminders.add(streamerId);
            
            await interaction.reply({
                content: '🔔 Rappel activé ! Je vous enverrai un message privé quand ce streamer sera en live.',
                ephemeral: true
            });
            
            // Programmer le rappel si le streamer n'est pas encore live
            this.scheduleReminder(userId, streamerId);
        }
    }

    async handleShare(interaction) {
        const streamerId = interaction.customId.replace('stream_share_', '');
        const liveData = this.streamManager.currentlyLive.get(streamerId);
        
        if (!liveData) {
            return await interaction.reply({
                content: '❌ Ce stream n\'est plus en live.',
                ephemeral: true
            });
        }

        const streamer = liveData.streamer;
        const platformUrls = {
            twitch: `https://twitch.tv/${streamer.username}`,
            youtube: liveData.platform_url || `https://youtube.com/c/${streamer.username}`,
            kick: `https://kick.com/${streamer.username}`
        };

        const shareEmbed = new EmbedBuilder()
            .setTitle(`🎮 ${streamer.displayName} est en live !`)
            .setDescription(liveData.title || 'Pas de titre disponible')
            .addFields(
                { name: '🎯 Plateforme', value: streamer.platform.charAt(0).toUpperCase() + streamer.platform.slice(1), inline: true },
                { name: '🎮 Catégorie', value: liveData.game_name || 'Inconnue', inline: true },
                { name: '👥 Spectateurs', value: liveData.viewer_count?.toLocaleString() || 'N/A', inline: true }
            )
            .setColor(this.getPlatformColor(streamer.platform))
            .setTimestamp();

        if (liveData.thumbnail_url) {
            let thumbnailUrl = liveData.thumbnail_url;
            if (streamer.platform === 'twitch') {
                thumbnailUrl = thumbnailUrl.replace('{width}', '1920').replace('{height}', '1080');
            }
            shareEmbed.setImage(thumbnailUrl);
        }

        const shareRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Regarder maintenant')
                    .setStyle(ButtonStyle.Link)
                    .setURL(platformUrls[streamer.platform])
                    .setEmoji('📺')
            );

        await interaction.reply({
            content: `${interaction.user} partage ce stream avec vous ! 🎉`,
            embeds: [shareEmbed],
            components: [shareRow]
        });
    }

    async handleListRefresh(interaction) {
        await interaction.deferUpdate();
        
        const guildStreamers = Array.from(this.streamManager.streamers.values())
            .filter(s => s.guildId === interaction.guild.id);

        if (guildStreamers.length === 0) {
            const noStreamersEmbed = new EmbedBuilder()
                .setTitle('📋 Aucun streamer surveillé')
                .setDescription('Utilisez `/stream-system add` pour ajouter des streamers à surveiller.')
                .setColor('#95a5a6');

            return await interaction.editReply({ 
                embeds: [noStreamersEmbed],
                components: []
            });
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
            .setTitle('📋 Streamers surveillés (actualisé)')
            .setDescription(`Total: **${guildStreamers.length}** streamer(s)`)
            .setColor('#3498db')
            .setTimestamp();

        // Ajouter un champ par plateforme
        for (const [platform, streamers] of Object.entries(groupedStreamers)) {
            const platformEmoji = { twitch: '🟣', youtube: '🔴', kick: '🎯' }[platform];
            const streamerList = streamers
                .map(s => {
                    const isLive = this.streamManager.currentlyLive.has(s.id) ? '🔴' : '⚫';
                    return `${isLive} **${s.displayName}** → <#${s.channelId}>`;
                })
                .join('\n');

            embed.addFields({
                name: `${platformEmoji} ${platform.charAt(0).toUpperCase() + platform.slice(1)} (${streamers.length})`,
                value: streamerList,
                inline: false
            });
        }

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
    }

    async handleLiveOnly(interaction) {
        await interaction.deferUpdate();

        const liveStreams = Array.from(this.streamManager.currentlyLive.values())
            .filter(stream => stream.streamer.guildId === interaction.guild.id);

        if (liveStreams.length === 0) {
            const noLiveEmbed = new EmbedBuilder()
                .setTitle('📺 Aucun stream en cours')
                .setDescription('Aucun des streamers surveillés n\'est actuellement en live.')
                .setColor('#95a5a6');

            return await interaction.editReply({ 
                embeds: [noLiveEmbed],
                components: []
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🔴 Streams en cours uniquement')
            .setDescription(`**${liveStreams.length}** streamer(s) actuellement en live`)
            .setColor('#e74c3c')
            .setTimestamp();

        // Ajouter chaque stream live
        for (const stream of liveStreams.slice(0, 10)) {
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

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('stream_list_refresh')
                    .setLabel('🔙 Retour à la liste complète')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({ 
            embeds: [embed],
            components: [backButton]
        });
    }

    async handleManage(interaction) {
        // Vérifier les permissions
        if (!interaction.member.permissions.has('ManageChannels')) {
            return await interaction.reply({
                content: '❌ Vous devez avoir la permission "Gérer les salons" pour accéder à la gestion.',
                ephemeral: true
            });
        }

        const guildStreamers = Array.from(this.streamManager.streamers.values())
            .filter(s => s.guildId === interaction.guild.id);

        if (guildStreamers.length === 0) {
            return await interaction.reply({
                content: '❌ Aucun streamer à gérer. Ajoutez d\'abord des streamers avec `/stream-system add`.',
                ephemeral: true
            });
        }

        const manageEmbed = new EmbedBuilder()
            .setTitle('⚙️ Gestion des streamers')
            .setDescription('Sélectionnez une action de gestion')
            .addFields(
                { name: '📊 Streamers surveillés', value: guildStreamers.length.toString(), inline: true },
                { name: '🔴 Actuellement en live', value: this.streamManager.currentlyLive.size.toString(), inline: true }
            )
            .setColor('#3498db');

        const manageRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('stream_manage_bulk_remove')
                    .setLabel('🗑️ Suppression en masse')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('stream_manage_export')
                    .setLabel('📤 Exporter la liste')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('stream_manage_stats')
                    .setLabel('📊 Statistiques détaillées')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            embeds: [manageEmbed],
            components: [manageRow],
            ephemeral: true
        });
    }

    async handleStreamManagement(interaction) {
        const action = interaction.customId.replace('stream_manage_', '');
        
        switch (action) {
            case 'bulk_remove':
                await this.handleBulkRemove(interaction);
                break;
            case 'export':
                await this.handleExport(interaction);
                break;
            case 'stats':
                await this.handleDetailedStats(interaction);
                break;
        }
    }

    async handleBulkRemove(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('stream_bulk_remove_modal')
            .setTitle('🗑️ Suppression en masse');

        const platformInput = new TextInputBuilder()
            .setCustomId('platform')
            .setLabel('Plateforme (optionnel)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('twitch, youtube, kick (laissez vide pour toutes)')
            .setRequired(false);

        const confirmInput = new TextInputBuilder()
            .setCustomId('confirm')
            .setLabel('Confirmation')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Tapez "SUPPRIMER" pour confirmer')
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(platformInput);
        const secondRow = new ActionRowBuilder().addComponents(confirmInput);

        modal.addComponents(firstRow, secondRow);
        await interaction.showModal(modal);
    }

    async handleExport(interaction) {
        await interaction.deferUpdate();

        const guildStreamers = Array.from(this.streamManager.streamers.values())
            .filter(s => s.guildId === interaction.guild.id);

        const exportData = guildStreamers.map(streamer => ({
            username: streamer.username,
            displayName: streamer.displayName,
            platform: streamer.platform,
            channel: `#${interaction.guild.channels.cache.get(streamer.channelId)?.name || streamer.channelId}`,
            role: streamer.roleId ? `@${interaction.guild.roles.cache.get(streamer.roleId)?.name || streamer.roleId}` : 'Aucun',
            customMessage: streamer.customMessage || 'Aucun',
            addedAt: new Date(streamer.addedAt).toLocaleDateString('fr-FR')
        }));

        const csvContent = [
            'Username,Display Name,Platform,Channel,Role,Custom Message,Added At',
            ...exportData.map(s => `"${s.username}","${s.displayName}","${s.platform}","${s.channel}","${s.role}","${s.customMessage}","${s.addedAt}"`)
        ].join('\n');

        const exportEmbed = new EmbedBuilder()
            .setTitle('📤 Export terminé')
            .setDescription(`Données de **${exportData.length}** streamer(s) exportées`)
            .setColor('#27ae60')
            .setTimestamp();

        await interaction.editReply({
            embeds: [exportEmbed],
            files: [{
                attachment: Buffer.from(csvContent, 'utf8'),
                name: `streamers-export-${Date.now()}.csv`
            }]
        });
    }

    async handleDetailedStats(interaction) {
        await interaction.deferUpdate();

        const stats = await this.streamManager.getStats();
        const guildStreamers = Array.from(this.streamManager.streamers.values())
            .filter(s => s.guildId === interaction.guild.id);

        // Statistiques par plateforme
        const platformStats = guildStreamers.reduce((acc, streamer) => {
            if (!acc[streamer.platform]) {
                acc[streamer.platform] = { total: 0, live: 0 };
            }
            acc[streamer.platform].total++;
            if (this.streamManager.currentlyLive.has(streamer.id)) {
                acc[streamer.platform].live++;
            }
            return acc;
        }, {});

        const statsEmbed = new EmbedBuilder()
            .setTitle('📊 Statistiques détaillées du serveur')
            .setColor('#9b59b6')
            .setTimestamp();

        // Stats par plateforme
        let platformInfo = '';
        for (const [platform, data] of Object.entries(platformStats)) {
            const emoji = { twitch: '🟣', youtube: '🔴', kick: '🎯' }[platform];
            platformInfo += `${emoji} ${platform}: ${data.total} total, ${data.live} live\n`;
        }

        if (platformInfo) {
            statsEmbed.addFields({
                name: '🎯 Répartition par plateforme',
                value: platformInfo,
                inline: false
            });
        }

        // Streamers les plus récents
        const recentStreamers = guildStreamers
            .sort((a, b) => b.addedAt - a.addedAt)
            .slice(0, 5)
            .map(s => `• ${s.displayName} (${s.platform})`)
            .join('\n');

        if (recentStreamers) {
            statsEmbed.addFields({
                name: '📅 Ajouts récents',
                value: recentStreamers,
                inline: false
            });
        }

        // Performance du système
        statsEmbed.addFields(
            {
                name: '⚡ Performance système',
                value: [
                    `🚀 Uptime: ${stats.uptime}`,
                    `🔄 Dernière vérification: ${new Date(stats.lastCheck).toLocaleTimeString('fr-FR')}`,
                    `📡 Webhooks: ${stats.webhooksActive ? '✅ Actifs' : '❌ Inactifs'}`
                ].join('\n'),
                inline: false
            }
        );

        await interaction.editReply({ embeds: [statsEmbed] });
    }

    async scheduleReminder(userId, streamerId) {
        // Cette fonction sera appelée quand le streamer passe en live
        // Pour l'instant, on stocke juste le rappel
        // TODO: Implémenter le système de rappels avec les événements de stream
    }

    async sendReminder(userId, streamer, streamData) {
        try {
            const user = await this.client.users.fetch(userId);
            if (!user) return;

            const reminderEmbed = new EmbedBuilder()
                .setTitle('🔔 Rappel de stream')
                .setDescription(`**${streamer.displayName}** est maintenant en live !`)
                .addFields(
                    { name: '🎮 Titre', value: streamData.title || 'Sans titre', inline: false },
                    { name: '🎯 Catégorie', value: streamData.game_name || 'Inconnue', inline: true },
                    { name: '🎪 Plateforme', value: streamer.platform.charAt(0).toUpperCase() + streamer.platform.slice(1), inline: true }
                )
                .setColor(this.getPlatformColor(streamer.platform))
                .setTimestamp();

            const platformUrls = {
                twitch: `https://twitch.tv/${streamer.username}`,
                youtube: streamData.platform_url || `https://youtube.com/c/${streamer.username}`,
                kick: `https://kick.com/${streamer.username}`
            };

            const reminderRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Regarder maintenant')
                        .setStyle(ButtonStyle.Link)
                        .setURL(platformUrls[streamer.platform])
                        .setEmoji('📺')
                );

            await user.send({
                embeds: [reminderEmbed],
                components: [reminderRow]
            });

            // Supprimer le rappel après l'envoi
            const userReminders = this.reminders.get(userId);
            if (userReminders) {
                userReminders.delete(streamerId);
            }

        } catch (error) {
            this.logger.error(`Erreur envoi rappel à ${userId}:`, error);
        }
    }

    getPlatformColor(platform) {
        const colors = {
            twitch: '#9146FF',
            youtube: '#FF0000',
            kick: '#53FC18'
        };
        return colors[platform] || '#3498db';
    }

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
    }
}
