import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stream-notifications')
        .setDescription('🎮 Gérer les notifications de streamers en live')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('➕ Ajouter un streamer à surveiller')
                .addStringOption(option =>
                    option
                        .setName('platform')
                        .setDescription('Plateforme de streaming')
                        .setRequired(true)
                        .addChoices(
                            { name: '🟣 Twitch', value: 'twitch' },
                            { name: '🔴 YouTube', value: 'youtube' },
                            { name: '🎯 Kick', value: 'kick' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('username')
                        .setDescription('Nom d\'utilisateur du streamer')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Canal où envoyer les notifications')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Rôle à mentionner (optionnel)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('custom-message')
                        .setDescription('Message personnalisé (optionnel)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('➖ Supprimer un streamer de la surveillance')
                .addStringOption(option =>
                    option
                        .setName('platform')
                        .setDescription('Plateforme de streaming')
                        .setRequired(true)
                        .addChoices(
                            { name: '🟣 Twitch', value: 'twitch' },
                            { name: '🔴 YouTube', value: 'youtube' },
                            { name: '🎯 Kick', value: 'kick' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('username')
                        .setDescription('Nom d\'utilisateur du streamer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 Afficher tous les streamers surveillés')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('🧪 Tester une notification de stream')
                .addStringOption(option =>
                    option
                        .setName('platform')
                        .setDescription('Plateforme de streaming')
                        .setRequired(true)
                        .addChoices(
                            { name: '🟣 Twitch', value: 'twitch' },
                            { name: '🔴 YouTube', value: 'youtube' },
                            { name: '🎯 Kick', value: 'kick' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('username')
                        .setDescription('Nom d\'utilisateur du streamer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('📊 Statut du système de notifications')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('demo')
                .setDescription('🎬 Déclencher une démonstration avec notifications fictives')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Canal où envoyer les notifications de démo')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('✅ Activer le système de notifications de stream')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('❌ Désactiver le système de notifications de stream')
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const subcommand = interaction.options.getSubcommand();
            const streamManager = interaction.client.streamManager;

            if (!streamManager) {
                return await interaction.editReply({
                    content: '❌ Le système de notifications de stream n\'est pas initialisé.'
                });
            }

            switch (subcommand) {
                case 'add':
                    await handleAddStreamer(interaction, streamManager);
                    break;
                case 'remove':
                    await handleRemoveStreamer(interaction, streamManager);
                    break;
                case 'list':
                    await handleListStreamers(interaction, streamManager);
                    break;
                case 'test':
                    await handleTestNotification(interaction, streamManager);
                    break;
                case 'status':
                    await handleStatus(interaction, streamManager);
                    break;
                case 'demo':
                    await handleDemo(interaction, streamManager);
                    break;
                case 'enable':
                    await handleEnable(interaction, streamManager);
                    break;
                case 'disable':
                    await handleDisable(interaction, streamManager);
                    break;
                default:
                    await interaction.editReply({
                        content: '❌ Sous-commande non reconnue.'
                    });
            }

        } catch (error) {
            console.error('Erreur dans stream-notifications:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de l\'exécution de la commande.'
            });
        }
    }
};

async function handleAddStreamer(interaction, streamManager) {
    const platform = interaction.options.getString('platform');
    const username = interaction.options.getString('username');
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const customMessage = interaction.options.getString('custom-message');

    try {
        // Vérifier si le streamer existe et est valide
        const streamerInfo = await streamManager.validateStreamer(platform, username);
        
        if (!streamerInfo.exists) {
            return await interaction.editReply({
                content: `❌ Le streamer \`${username}\` n'existe pas sur **${platform.toUpperCase()}**.`
            });
        }

        // Ajouter le streamer
        const result = await streamManager.addStreamer(
            interaction.guild.id,
            platform,
            username,
            channel.id,
            role?.id,
            customMessage
        );

        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff88')
                .setTitle('✅ Streamer ajouté avec succès!')
                .setDescription(`**${streamerInfo.displayName || username}** sera maintenant surveillé`)
                .addFields(
                    { name: '🎮 Plateforme', value: platform.toUpperCase(), inline: true },
                    { name: '👤 Streamer', value: streamerInfo.displayName || username, inline: true },
                    { name: '📢 Canal', value: `${channel}`, inline: true }
                )
                .setThumbnail(streamerInfo.avatar || null)
                .setTimestamp();

            if (role) {
                embed.addFields({ name: '🏷️ Rôle à mentionner', value: `${role}`, inline: true });
            }

            if (customMessage) {
                embed.addFields({ name: '💬 Message personnalisé', value: customMessage, inline: false });
            }

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({
                content: `❌ ${result.error || 'Erreur lors de l\'ajout du streamer.'}`
            });
        }

    } catch (error) {
        console.error('Erreur lors de l\'ajout du streamer:', error);
        await interaction.editReply({
            content: '❌ Erreur lors de la validation du streamer.'
        });
    }
}

async function handleRemoveStreamer(interaction, streamManager) {
    const platform = interaction.options.getString('platform');
    const username = interaction.options.getString('username');

    const result = await streamManager.removeStreamer(
        interaction.guild.id,
        platform,
        username
    );

    if (result.success) {
        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('✅ Streamer supprimé')
            .setDescription(`**${username}** ne sera plus surveillé sur **${platform.toUpperCase()}**`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } else {
        await interaction.editReply({
            content: `❌ ${result.error || 'Streamer non trouvé.'}`
        });
    }
}

async function handleListStreamers(interaction, streamManager) {
    const streamers = await streamManager.getStreamers(interaction.guild.id);

    if (streamers.length === 0) {
        return await interaction.editReply({
            content: '📋 Aucun streamer configuré pour ce serveur.'
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📋 Streamers surveillés')
        .setDescription(`**${streamers.length}** streamer(s) configuré(s)`)
        .setTimestamp();

    // Grouper par plateforme
    const platforms = {};
    streamers.forEach(streamer => {
        if (!platforms[streamer.platform]) {
            platforms[streamer.platform] = [];
        }
        platforms[streamer.platform].push(streamer);
    });

    Object.entries(platforms).forEach(([platform, streamers]) => {
        const platformEmoji = {
            'twitch': '🟣',
            'youtube': '🔴',
            'kick': '🎯'
        };

        const streamerList = streamers.map(s => 
            `• **${s.username}** → <#${s.channelId}>${s.roleId ? ` (${s.roleId})` : ''}`
        ).join('\n');

        embed.addFields({
            name: `${platformEmoji[platform] || '🎮'} ${platform.toUpperCase()}`,
            value: streamerList,
            inline: false
        });
    });

    await interaction.editReply({ embeds: [embed] });
}

async function handleTestNotification(interaction, streamManager) {
    const platform = interaction.options.getString('platform');
    const username = interaction.options.getString('username');

    try {
        const result = await streamManager.sendTestNotification(
            interaction.guild.id,
            platform,
            username
        );

        if (result.success) {
            await interaction.editReply({
                content: `✅ Notification de test envoyée pour **${username}** sur **${platform.toUpperCase()}**!`
            });
        } else {
            await interaction.editReply({
                content: `❌ ${result.error || 'Impossible d\'envoyer la notification de test.'}`
            });
        }

    } catch (error) {
        console.error('Erreur lors du test:', error);
        await interaction.editReply({
            content: '❌ Erreur lors de l\'envoi de la notification de test.'
        });
    }
}

async function handleStatus(interaction, streamManager) {
    const stats = await streamManager.getStats(interaction.guild.id);
    
    // Vérifier l'état d'activation du système
    const guildData = await streamManager.db.getGuildData(interaction.guild.id);
    const isSystemEnabled = guildData.streamSettings?.enabled !== false; // Activé par défaut
    const systemStatus = isSystemEnabled ? '🟢 Activé' : '🔴 Désactivé';
    const systemColor = isSystemEnabled ? '#00ff88' : '#ff4444';
    
    const embed = new EmbedBuilder()
        .setColor(systemColor)
        .setTitle('📊 Statut du système de notifications')
        .addFields(
            { name: '⚡ Système', value: systemStatus, inline: true },
            { name: '👥 Streamers surveillés', value: `${stats.totalStreamers}`, inline: true },
            { name: '🟢 Actuellement en live', value: `${stats.currentlyLive}`, inline: true },
            { name: '📢 Notifications envoyées', value: `${stats.notificationsSent}`, inline: true },
            { name: '⏱️ Dernière vérification', value: `<t:${Math.floor(stats.lastCheck / 1000)}:R>`, inline: true },
            { name: '🔄 Surveillance', value: stats.isRunning ? '🟢 Active' : '🔴 Arrêtée', inline: true }
        )
        .setTimestamp();

    if (stats.platforms) {
        const platformStats = Object.entries(stats.platforms)
            .map(([platform, count]) => `${platform.toUpperCase()}: ${count}`)
            .join('\n');
        
        embed.addFields({
            name: '🎮 Par plateforme',
            value: platformStats || 'Aucune',
            inline: false
        });
    }

    // Ajouter des informations d'activation/désactivation si disponibles
    if (guildData.streamSettings?.enabledBy || guildData.streamSettings?.disabledBy) {
        const lastActionUser = isSystemEnabled ? guildData.streamSettings.enabledBy : guildData.streamSettings.disabledBy;
        const lastActionTime = isSystemEnabled ? guildData.streamSettings.enabledAt : guildData.streamSettings.disabledAt;
        const actionType = isSystemEnabled ? 'Activé' : 'Désactivé';
        
        if (lastActionTime) {
            embed.addFields({
                name: `📝 ${actionType} par`,
                value: `<@${lastActionUser}> • <t:${Math.floor(lastActionTime / 1000)}:R>`,
                inline: false
            });
        }
    }

    // Ajouter des conseils selon l'état
    if (!isSystemEnabled) {
        embed.addFields({
            name: '💡 Pour réactiver',
            value: 'Utilisez `/stream-notifications enable`',
            inline: false
        });
    } else if (stats.totalStreamers === 0) {
        embed.addFields({
            name: '💡 Pour commencer',
            value: 'Utilisez `/stream-notifications add` ou `/setup-demo-streamers`',
            inline: false
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

async function handleDemo(interaction, streamManager) {
    const channel = interaction.options.getChannel('channel');

    try {
        // Créer des streamers fictifs pour la démo
        const demoStreamers = [
            { platform: 'twitch', username: 'ninja', displayName: 'Ninja' },
            { platform: 'twitch', username: 'pokimane', displayName: 'Pokimane' },
            { platform: 'youtube', username: 'mrbeast', displayName: 'MrBeast' },
            { platform: 'kick', username: 'adin', displayName: 'Adin Ross' }
        ];

        let sentNotifications = 0;

        for (const streamer of demoStreamers) {
            // Créer des données de stream fictives
            const demoStreamData = streamManager.createDemoStreamData(streamer.platform, streamer.username);
            
            // Créer un objet streamer temporaire
            const tempStreamer = {
                guildId: interaction.guild.id,
                platform: streamer.platform,
                username: streamer.username,
                channelId: channel.id,
                customMessage: `🎬 DÉMO - ${streamer.displayName} est en live !`
            };

            // Envoyer la notification
            await streamManager.sendStreamNotification(tempStreamer, demoStreamData, streamer.platform);
            sentNotifications++;

            // Petite pause entre les notifications
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('🎬 Démonstration lancée !')
            .setDescription(`**${sentNotifications} notifications de démo** ont été envoyées dans ${channel}`)
            .addFields(
                { name: '🎮 Plateformes testées', value: 'Twitch, YouTube, Kick', inline: true },
                { name: '📢 Canal', value: `${channel}`, inline: true },
                { name: '⚡ Type', value: 'Notifications fictives', inline: true }
            )
            .setFooter({ text: 'Ces notifications sont uniquement pour la démonstration' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur lors de la démo:', error);
        await interaction.editReply({
            content: '❌ Erreur lors de la démonstration.'
        });
    }
}

// Fonction pour activer le système
async function handleEnable(interaction, streamManager) {
    try {
        const guildId = interaction.guild.id;
        
        // Vérifier si le système est déjà activé
        const guildData = await streamManager.db.getGuildData(guildId);
        if (!guildData.streamSettings) {
            guildData.streamSettings = {};
        }
        
        if (guildData.streamSettings.enabled === true) {
            const embed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('⚠️ Système déjà activé')
                .setDescription('Le système de notifications de stream est déjà **activé** sur ce serveur.')
                .addFields(
                    { name: '📊 Statut', value: '✅ Actif', inline: true },
                    { name: '🎮 Streamers surveillés', value: `${Object.keys(guildData.streamers || {}).length}`, inline: true }
                )
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embed] });
        }
        
        // Activer le système
        guildData.streamSettings.enabled = true;
        guildData.streamSettings.enabledAt = Date.now();
        guildData.streamSettings.enabledBy = interaction.user.id;
        
        // Sauvegarder les modifications
        streamManager.db.setGuildData(guildId, guildData);
        await streamManager.db.save();
        
        // Redémarrer la surveillance si nécessaire
        if (!streamManager.checkInterval) {
            streamManager.startMonitoring();
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('✅ Système activé !')
            .setDescription('Le système de notifications de stream a été **activé** avec succès.')
            .addFields(
                { name: '📊 Statut', value: '✅ Actif', inline: true },
                { name: '👤 Activé par', value: `${interaction.user}`, inline: true },
                { name: '🔄 Vérification', value: 'Toutes les 2 minutes', inline: true },
                { name: '🎮 Streamers surveillés', value: `${streamersCount}`, inline: true }
            )
            .setFooter({ text: 'Utilisez /stream-notifications add pour ajouter des streamers à surveiller' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Erreur lors de l\'activation:', error);
        await interaction.editReply({
            content: '❌ Une erreur est survenue lors de l\'activation du système.'
        });
    }
}

// Fonction pour désactiver le système
async function handleDisable(interaction, streamManager) {
    try {
        const guildId = interaction.guild.id;
        
        // Vérifier si le système est déjà désactivé
        const guildData = await streamManager.db.getGuildData(guildId);
        if (!guildData.streamSettings) {
            guildData.streamSettings = {};
        }
        
        if (guildData.streamSettings.enabled === false) {
            const embed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('⚠️ Système déjà désactivé')
                .setDescription('Le système de notifications de stream est déjà **désactivé** sur ce serveur.')
                .addFields(
                    { name: '📊 Statut', value: '❌ Inactif', inline: true },
                    { name: '🎮 Streamers configurés', value: `${Object.keys(guildData.streamers || {}).length}`, inline: true }
                )
                .setFooter({ text: 'Utilisez /stream-notifications enable pour le réactiver' })
                .setTimestamp();
            
            return await interaction.editReply({ embeds: [embed] });
        }
        
        // Désactiver le système
        guildData.streamSettings.enabled = false;
        guildData.streamSettings.disabledAt = Date.now();
        guildData.streamSettings.disabledBy = interaction.user.id;
        
        // Sauvegarder les modifications
        streamManager.db.setGuildData(guildId, guildData);
        await streamManager.db.save();
        
        const streamersCount = Object.keys(guildData.streamers || {}).length;
        
        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setTitle('❌ Système désactivé')
            .setDescription('Le système de notifications de stream a été **désactivé**.')
            .addFields(
                { name: '📊 Statut', value: '❌ Inactif', inline: true },
                { name: '👤 Désactivé par', value: `${interaction.user}`, inline: true },
                { name: '🎮 Streamers configurés', value: `${streamersCount}`, inline: true },
                { name: '💡 Information', value: 'Les streamers restent configurés mais aucune notification ne sera envoyée', inline: false }
            )
            .setFooter({ text: 'Utilisez /stream-notifications enable pour réactiver le système' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        await interaction.editReply({
            content: '❌ Une erreur est survenue lors de la désactivation du système.'
        });
    }
}
