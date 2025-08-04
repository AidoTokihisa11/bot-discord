import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('moderation')
        .setDescription('🛡️ Système de modération complet')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('🎛️ Afficher le panel de modération principal')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('⚠️ Avertir un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('👤 Utilisateur à avertir')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('📝 Raison de l\'avertissement')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mute')
                .setDescription('🔇 Mettre en sourdine un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('👤 Utilisateur à muter')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('📝 Raison du mute')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('duration')
                        .setDescription('⏱️ Durée (5m, 1h, 1d, 7d)')
                        .setRequired(false)
                        .addChoices(
                            { name: '5 minutes', value: '5m' },
                            { name: '1 heure', value: '1h' },
                            { name: '24 heures', value: '1d' },
                            { name: '7 jours', value: '7d' }
                        ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('👢 Expulser un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('👤 Utilisateur à expulser')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('📝 Raison de l\'expulsion')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('🔨 Bannir un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('👤 Utilisateur à bannir')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('📝 Raison du bannissement')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('duration')
                        .setDescription('⏱️ Durée (vide = permanent)')
                        .setRequired(false)
                        .addChoices(
                            { name: '1 heure', value: '1h' },
                            { name: '24 heures', value: '1d' },
                            { name: '7 jours', value: '7d' },
                            { name: '30 jours', value: '30d' }
                        ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('✅ Débannir un utilisateur')
                .addStringOption(option =>
                    option
                        .setName('userid')
                        .setDescription('🆔 ID de l\'utilisateur à débannir')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('📝 Raison du débannissement')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('📋 Voir l\'historique de modération d\'un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('👤 Utilisateur à consulter')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 Voir les statistiques de modération')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('⚙️ Configuration du système de modération')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const moderationManager = interaction.client.moderationManager;

        if (!moderationManager) {
            return await interaction.reply({
                content: '❌ Le système de modération n\'est pas initialisé.',
                ephemeral: true
            });
        }

        // Vérifier les permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return await interaction.reply({
                content: '❌ Vous n\'avez pas les permissions nécessaires pour utiliser le système de modération.',
                ephemeral: true
            });
        }

        try {
            switch (subcommand) {
                case 'panel':
                    await this.handlePanel(interaction, moderationManager);
                    break;
                case 'warn':
                    await this.handleWarn(interaction, moderationManager);
                    break;
                case 'mute':
                    await this.handleMute(interaction, moderationManager);
                    break;
                case 'kick':
                    await this.handleKick(interaction, moderationManager);
                    break;
                case 'ban':
                    await this.handleBan(interaction, moderationManager);
                    break;
                case 'unban':
                    await this.handleUnban(interaction, moderationManager);
                    break;
                case 'history':
                    await this.handleHistory(interaction, moderationManager);
                    break;
                case 'stats':
                    await this.handleStats(interaction, moderationManager);
                    break;
                case 'config':
                    await this.handleConfig(interaction, moderationManager);
                    break;
            }
        } catch (error) {
            console.error('Erreur dans le système de modération:', error);
            
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

    async handlePanel(interaction, moderationManager) {
        // Récupérer les statistiques actuelles
        const stats = await moderationManager.getStats();
        
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Panel de Modération Complet')
            .setDescription(`**Bienvenue dans le système de modération avancé !**\n\n` +
                           `📊 **Statistiques du jour :**\n` +
                           `• Actions totales : **${stats.actionsToday}**\n` +
                           `• Mutes actifs : **${stats.activeMutes}**\n` +
                           `• Avertissements totaux : **${stats.totalWarnings}**\n\n` +
                           `Sélectionnez une action de modération ci-dessous :`)
            .addFields(
                { 
                    name: '⚠️ Actions de Base', 
                    value: '• **Avertir** - Donner un avertissement\n• **Muter** - Mettre en sourdine temporaire\n• **Kick** - Expulser du serveur', 
                    inline: true 
                },
                { 
                    name: '🔨 Actions Sévères', 
                    value: '• **Ban** - Bannissement permanent/temporaire\n• **Unban** - Débannir un utilisateur\n• **Unmute** - Retirer un mute', 
                    inline: true 
                },
                { 
                    name: '📋 Gestion & Stats', 
                    value: '• **Historique** - Voir l\'historique d\'un user\n• **Statistiques** - Stats de modération\n• **Configuration** - Paramètres système', 
                    inline: true 
                }
            )
            .setColor('#3498db')
            .setTimestamp()
            .setFooter({ 
                text: `Système de modération • Utilisé par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setThumbnail(interaction.guild.iconURL());

        const actionRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_warn_user')
                    .setLabel('Avertir')
                    .setEmoji('⚠️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('mod_mute_user')
                    .setLabel('Muter')
                    .setEmoji('🔇')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('mod_kick_user')
                    .setLabel('Kick')
                    .setEmoji('👢')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('mod_ban_user')
                    .setLabel('Ban')
                    .setEmoji('🔨')
                    .setStyle(ButtonStyle.Danger)
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_unban_user')
                    .setLabel('Unban')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('mod_unmute_user')
                    .setLabel('Unmute')
                    .setEmoji('🔊')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('mod_clear_warnings')
                    .setLabel('Clear Warns')
                    .setEmoji('🧹')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('mod_quick_actions')
                    .setLabel('Actions Rapides')
                    .setEmoji('⚡')
                    .setStyle(ButtonStyle.Primary)
            );

        const actionRow3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_history_user')
                    .setLabel('Historique')
                    .setEmoji('📋')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mod_stats')
                    .setLabel('Statistiques')
                    .setEmoji('📊')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mod_config')
                    .setLabel('Configuration')
                    .setEmoji('⚙️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('mod_refresh_panel')
                    .setLabel('Actualiser')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow1, actionRow2, actionRow3]
        });
    },

    async handleWarn(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        // Vérifications
        if (targetUser.id === interaction.user.id) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas vous avertir vous-même.'
            });
        }

        if (targetUser.bot) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas avertir un bot.'
            });
        }

        if (!moderationManager.canModerate(interaction.member, { id: targetUser.id, guild: interaction.guild })) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas modérer cet utilisateur (rôle supérieur ou égal).'
            });
        }

        try {
            const warnData = await moderationManager.warnUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason
            );

            const warningCount = moderationManager.warnings.get(targetUser.id)?.filter(w => w.active).length || 0;

            const embed = new EmbedBuilder()
                .setTitle('⚠️ Avertissement donné')
                .setDescription(`**${targetUser.tag}** a été averti avec succès.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false },
                    { name: '📊 Total des avertissements', value: `${warningCount}`, inline: true }
                )
                .setColor('#ffff00')
                .setTimestamp()
                .setFooter({ text: `ID: ${warnData.id}` });

            if (warningCount >= 3) {
                embed.addFields({
                    name: '🚨 Attention',
                    value: 'Cet utilisateur a maintenant 3 avertissements ou plus. Des actions automatiques peuvent être déclenchées.',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur lors de l'avertissement: ${error.message}`
            });
        }
    },

    async handleMute(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration') || '1h';
        const reason = interaction.options.getString('reason');

        // Convertir la durée
        const duration = this.parseDuration(durationStr);

        // Vérifications
        if (targetUser.id === interaction.user.id) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas vous muter vous-même.'
            });
        }

        if (targetUser.bot) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas muter un bot.'
            });
        }

        try {
            const muteData = await moderationManager.muteUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason,
                duration
            );

            const embed = new EmbedBuilder()
                .setTitle('🔇 Utilisateur mis en sourdine')
                .setDescription(`**${targetUser.tag}** a été mis en sourdine avec succès.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '⏱️ Durée', value: moderationManager.formatDuration(duration), inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#ff8c00')
                .setTimestamp()
                .setFooter({ text: `ID: ${muteData.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur lors du mute: ${error.message}`
            });
        }
    },

    async handleKick(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        // Vérifications
        if (targetUser.id === interaction.user.id) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas vous expulser vous-même.'
            });
        }

        if (targetUser.bot) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas expulser un bot.'
            });
        }

        try {
            const kickData = await moderationManager.kickUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason
            );

            const embed = new EmbedBuilder()
                .setTitle('👢 Utilisateur expulsé')
                .setDescription(`**${targetUser.tag}** a été expulsé du serveur.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#ff8c00')
                .setTimestamp()
                .setFooter({ text: `ID: ${kickData.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur lors de l'expulsion: ${error.message}`
            });
        }
    },

    async handleBan(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const durationStr = interaction.options.getString('duration');
        const duration = durationStr ? this.parseDuration(durationStr) : null;

        // Vérifications
        if (targetUser.id === interaction.user.id) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas vous bannir vous-même.'
            });
        }

        if (targetUser.bot) {
            return await interaction.editReply({
                content: '❌ Vous ne pouvez pas bannir un bot.'
            });
        }

        try {
            const banData = await moderationManager.banUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason,
                duration
            );

            const embed = new EmbedBuilder()
                .setTitle('🔨 Utilisateur banni')
                .setDescription(`**${targetUser.tag}** a été banni du serveur.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#ff0000')
                .setTimestamp()
                .setFooter({ text: `ID: ${banData.id}` });

            if (duration) {
                embed.addFields({
                    name: '⏱️ Durée',
                    value: `${moderationManager.formatDuration(duration)} (temporaire)`,
                    inline: true
                });
            } else {
                embed.addFields({
                    name: '⏱️ Durée',
                    value: 'Permanent',
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur lors du bannissement: ${error.message}`
            });
        }
    },

    async handleUnban(interaction, moderationManager) {
        await interaction.deferReply();

        const userIdStr = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';

        // Vérifier que c'est un ID valide
        if (!/^\d{17,19}$/.test(userIdStr)) {
            return await interaction.editReply({
                content: '❌ ID utilisateur invalide. Veuillez fournir un ID Discord valide.'
            });
        }

        try {
            // Vérifier si l'utilisateur est banni
            const bans = await interaction.guild.bans.fetch();
            const bannedUser = bans.get(userIdStr);

            if (!bannedUser) {
                return await interaction.editReply({
                    content: '❌ Cet utilisateur n\'est pas banni sur ce serveur.'
                });
            }

            const targetUser = bannedUser.user;

            const unbanData = await moderationManager.unbanUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason
            );

            const embed = new EmbedBuilder()
                .setTitle('✅ Utilisateur débanni')
                .setDescription(`**${targetUser.tag}** a été débanni du serveur.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#00ff00')
                .setTimestamp()
                .setFooter({ text: `ID: ${unbanData.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur lors du débannissement: ${error.message}`
            });
        }
    },

    async handleHistory(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const history = await moderationManager.getUserHistory(targetUser.id);
        const warnings = await moderationManager.getUserWarnings(targetUser.id);

        if (history.length === 0 && warnings.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('📋 Historique de modération')
                .setDescription(`**${targetUser.tag}** n'a aucun antécédent de modération.`)
                .setColor('#00ff00')
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 Historique de modération')
            .setDescription(`Historique de **${targetUser.tag}** (${targetUser.id})`)
            .setColor('#3498db')
            .setTimestamp();

        // Avertissements actifs
        const activeWarnings = warnings.filter(w => w.active);
        if (activeWarnings.length > 0) {
            embed.addFields({
                name: `⚠️ Avertissements actifs (${activeWarnings.length})`,
                value: activeWarnings.slice(0, 5).map(w => 
                    `• ${w.reason} - <t:${Math.floor(w.timestamp / 1000)}:R>`
                ).join('\n') + (activeWarnings.length > 5 ? `\n... et ${activeWarnings.length - 5} autre(s)` : ''),
                inline: false
            });
        }

        // Historique récent
        const recentHistory = history.slice(-10).reverse();
        if (recentHistory.length > 0) {
            embed.addFields({
                name: `📜 Historique récent (${recentHistory.length}/${history.length})`,
                value: recentHistory.map(h => {
                    const action = h.type.toUpperCase();
                    const timestamp = `<t:${Math.floor(h.timestamp / 1000)}:R>`;
                    const reason = h.data.reason?.substring(0, 50) || 'Aucune raison';
                    return `• **${action}** - ${reason} ${timestamp}`;
                }).join('\n'),
                inline: false
            });
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`mod_history_full_${targetUser.id}`)
                    .setLabel('📄 Historique complet')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`mod_clear_warnings_${targetUser.id}`)
                    .setLabel('🧹 Effacer les avertissements')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(activeWarnings.length === 0)
            );

        await interaction.editReply({ 
            embeds: [embed],
            components: [actionRow]
        });
    },

    async handleStats(interaction, moderationManager) {
        await interaction.deferReply();

        const stats = await moderationManager.getStats();

        const embed = new EmbedBuilder()
            .setTitle('📊 Statistiques de modération')
            .setDescription('Statistiques du système de modération')
            .addFields(
                { name: '📈 Actions totales', value: stats.totalActions.toString(), inline: true },
                { name: '📅 Actions aujourd\'hui', value: stats.actionsToday.toString(), inline: true },
                { name: '🔇 Mutes actifs', value: stats.activeMutes.toString(), inline: true },
                { name: '⚠️ Avertissements', value: stats.actionTypes.warn.toString(), inline: true },
                { name: '🔇 Mutes', value: stats.actionTypes.mute.toString(), inline: true },
                { name: '👢 Kicks', value: stats.actionTypes.kick.toString(), inline: true },
                { name: '🔨 Bans', value: stats.actionTypes.ban.toString(), inline: true },
                { name: '✅ Unbans', value: stats.actionTypes.unban.toString(), inline: true },
                { name: '📊 Total avertissements', value: stats.totalWarnings.toString(), inline: true }
            )
            .setColor('#9b59b6')
            .setTimestamp()
            .setFooter({ text: `Statistiques mises à jour • ${stats.lastResetDate}` });

        await interaction.editReply({ embeds: [embed] });
    },

    async handleConfig(interaction, moderationManager) {
        const configEmbed = new EmbedBuilder()
            .setTitle('⚙️ Configuration du système de modération')
            .setDescription('Configurez les paramètres du système de modération')
            .addFields(
                { name: '📝 Canal de logs', value: 'Définir le canal pour les logs de modération', inline: false },
                { name: '🚨 Actions automatiques', value: 'Configurer les sanctions automatiques', inline: false },
                { name: '⏱️ Durées par défaut', value: 'Modifier les durées de timeout par défaut', inline: false }
            )
            .setColor('#3498db');

        const configRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('mod_config_select')
                    .setPlaceholder('Sélectionnez une option de configuration')
                    .addOptions(
                        {
                            label: '📝 Canal de logs',
                            description: 'Définir le canal pour les logs',
                            value: 'log_channel'
                        },
                        {
                            label: '🚨 Actions automatiques',
                            description: 'Configurer les sanctions auto',
                            value: 'auto_actions'
                        },
                        {
                            label: '⏱️ Durées par défaut',
                            description: 'Modifier les durées de timeout',
                            value: 'default_durations'
                        },
                        {
                            label: '📊 Réinitialiser les stats',
                            description: 'Remettre à zéro les statistiques',
                            value: 'reset_stats'
                        }
                    )
            );

        await interaction.reply({ 
            embeds: [configEmbed], 
            components: [configRow],
            ephemeral: true 
        });
    },

    // Utilitaire pour parser les durées
    parseDuration(durationStr) {
        const match = durationStr.match(/^(\d+)([mhd])$/);
        if (!match) return 3600000; // 1 heure par défaut

        const [, amount, unit] = match;
        const multipliers = {
            'm': 60 * 1000,           // minutes
            'h': 60 * 60 * 1000,      // heures
            'd': 24 * 60 * 60 * 1000  // jours
        };

        return parseInt(amount) * multipliers[unit];
    }
};
