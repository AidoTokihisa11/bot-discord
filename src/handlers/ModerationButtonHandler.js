import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ChannelType } from 'discord.js';

export default class ModerationButtonHandler {
    constructor(client) {
        this.client = client;
        this.moderationManager = client.moderationManager;
        this.logger = client.logger;
    }

    async handleModerationButton(interaction) {
        const customId = interaction.customId;
        
        try {
            if (customId.startsWith('mod_warn_')) {
                await this.handleWarnButton(interaction);
            } else if (customId.startsWith('mod_mute_')) {
                await this.handleMuteButton(interaction);
            } else if (customId.startsWith('mod_kick_')) {
                await this.handleKickButton(interaction);
            } else if (customId.startsWith('mod_ban_')) {
                await this.handleBanButton(interaction);
            } else if (customId.startsWith('mod_unban_')) {
                await this.handleUnbanButton(interaction);
            } else if (customId.startsWith('mod_unmute_')) {
                await this.handleUnmuteButton(interaction);
            } else if (customId.startsWith('mod_history_')) {
                await this.handleHistoryButton(interaction);
            } else if (customId === 'mod_stats') {
                await this.handleStatsButton(interaction);
            } else if (customId === 'mod_config') {
                await this.handleConfigButton(interaction);
            } else if (customId === 'mod_refresh_panel') {
                await this.handleRefreshPanel(interaction);
            } else if (customId.startsWith('mod_clear_warnings')) {
                await this.handleClearWarnings(interaction);
            } else if (customId === 'mod_quick_actions') {
                await this.handleQuickActions(interaction);
            } else if (customId.startsWith('quick_')) {
                await this.handleQuickActionButton(interaction);
            }
            
        } catch (error) {
            this.logger.error('Erreur dans ModerationButtonHandler:', error);
            
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

    async handleModerationSelect(interaction) {
        const customId = interaction.customId;
        const value = interaction.values[0];
        
        try {
            if (customId === 'mod_config_select') {
                await this.handleConfigSelect(interaction, value);
            } else if (customId === 'mod_user_select') {
                await this.handleUserSelect(interaction, value);
            } else if (customId === 'mod_duration_select') {
                await this.handleDurationSelect(interaction, value);
            }
            
        } catch (error) {
            this.logger.error('Erreur dans handleModerationSelect:', error);
            
            await interaction.reply({
                content: '❌ Une erreur est survenue lors du traitement de votre sélection.',
                ephemeral: true
            });
        }
    }

    async handleModerationModal(interaction) {
        const customId = interaction.customId;
        
        try {
            if (customId === 'mod_warn_modal') {
                await this.handleWarnModal(interaction);
            } else if (customId === 'mod_mute_modal') {
                await this.handleMuteModal(interaction);
            } else if (customId === 'mod_kick_modal') {
                await this.handleKickModal(interaction);
            } else if (customId === 'mod_ban_modal') {
                await this.handleBanModal(interaction);
            } else if (customId === 'mod_unban_modal') {
                await this.handleUnbanModal(interaction);
            } else if (customId === 'mod_unmute_modal') {
                await this.handleUnmuteModal(interaction);
            } else if (customId === 'mod_set_log_channel') {
                await this.handleSetLogChannel(interaction);
            } else if (customId === 'quick_warn_modal') {
                await this.handleQuickWarnModal(interaction);
            } else if (customId === 'quick_mute_modal') {
                await this.handleQuickMuteModal(interaction);
            } else if (customId === 'quick_user_info_modal') {
                await this.handleQuickUserInfoModal(interaction);
            } else if (customId === 'quick_clear_warns_modal') {
                await this.handleQuickClearWarnsModal(interaction);
            }
            
        } catch (error) {
            this.logger.error('Erreur dans handleModerationModal:', error);
            
            await interaction.reply({
                content: '❌ Une erreur est survenue lors du traitement du modal.',
                ephemeral: true
            });
        }
    }

    // ==================== BOUTONS ====================

    async handleWarnButton(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('mod_warn_modal')
            .setTitle('⚠️ Avertir un utilisateur');

        const userInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('ID ou mention de l\'utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678 ou @utilisateur')
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Raison de l\'avertissement')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Décrivez la raison de cet avertissement...')
            .setRequired(true)
            .setMaxLength(500);

        const firstRow = new ActionRowBuilder().addComponents(userInput);
        const secondRow = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(firstRow, secondRow);
        await interaction.showModal(modal);
    }

    async handleMuteButton(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('mod_mute_modal')
            .setTitle('🔇 Muter un utilisateur');

        const userInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('ID ou mention de l\'utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678 ou @utilisateur')
            .setRequired(true);

        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Durée (5m, 1h, 1d, 7d)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1h')
            .setRequired(false);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Raison du mute')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Décrivez la raison de ce mute...')
            .setRequired(true)
            .setMaxLength(500);

        const firstRow = new ActionRowBuilder().addComponents(userInput);
        const secondRow = new ActionRowBuilder().addComponents(durationInput);
        const thirdRow = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(firstRow, secondRow, thirdRow);
        await interaction.showModal(modal);
    }

    async handleKickButton(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('mod_kick_modal')
            .setTitle('👢 Expulser un utilisateur');

        const userInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('ID ou mention de l\'utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678 ou @utilisateur')
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Raison de l\'expulsion')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Décrivez la raison de cette expulsion...')
            .setRequired(true)
            .setMaxLength(500);

        const firstRow = new ActionRowBuilder().addComponents(userInput);
        const secondRow = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(firstRow, secondRow);
        await interaction.showModal(modal);
    }

    async handleBanButton(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('mod_ban_modal')
            .setTitle('🔨 Bannir un utilisateur');

        const userInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('ID ou mention de l\'utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678 ou @utilisateur')
            .setRequired(true);

        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Durée (vide = permanent)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('7d (optionnel)')
            .setRequired(false);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Raison du bannissement')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Décrivez la raison de ce bannissement...')
            .setRequired(true)
            .setMaxLength(500);

        const firstRow = new ActionRowBuilder().addComponents(userInput);
        const secondRow = new ActionRowBuilder().addComponents(durationInput);
        const thirdRow = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(firstRow, secondRow, thirdRow);
        await interaction.showModal(modal);
    }

    async handleHistoryButton(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('mod_history_modal')
            .setTitle('📋 Consulter l\'historique');

        const userInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('ID ou mention de l\'utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678 ou @utilisateur')
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(userInput);
        modal.addComponents(firstRow);
        await interaction.showModal(modal);
    }

    async handleStatsButton(interaction) {
        await interaction.deferUpdate();

        const stats = await this.moderationManager.getStats();

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
            .setFooter({ text: `Statistiques • Mise à jour automatique` });

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_refresh_panel')
                    .setLabel('🔙 Retour au panel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({ 
            embeds: [embed],
            components: [backButton]
        });
    }

    async handleConfigButton(interaction) {
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
    }

    async handleRefreshPanel(interaction) {
        await interaction.deferUpdate();

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Panel de Modération')
            .setDescription('Sélectionnez une action de modération à effectuer')
            .addFields(
                { name: '⚠️ Avertissement', value: 'Donner un avertissement à un utilisateur', inline: true },
                { name: '🔇 Mute', value: 'Mettre un utilisateur en sourdine', inline: true },
                { name: '👢 Kick', value: 'Expulser un utilisateur du serveur', inline: true },
                { name: '🔨 Ban', value: 'Bannir un utilisateur définitivement', inline: true },
                { name: '📋 Historique', value: 'Consulter l\'historique d\'un utilisateur', inline: true },
                { name: '📊 Statistiques', value: 'Voir les stats de modération', inline: true }
            )
            .setColor('#3498db')
            .setTimestamp()
            .setFooter({ text: 'Système de modération • Panel actualisé' });

        const actionRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_warn_user')
                    .setLabel('⚠️ Avertir')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('mod_mute_user')
                    .setLabel('🔇 Muter')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('mod_kick_user')
                    .setLabel('👢 Kick')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('mod_ban_user')
                    .setLabel('🔨 Ban')
                    .setStyle(ButtonStyle.Danger)
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_history_user')
                    .setLabel('📋 Historique')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mod_stats')
                    .setLabel('📊 Statistiques')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mod_config')
                    .setLabel('⚙️ Configuration')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('mod_refresh_panel')
                    .setLabel('🔄 Actualiser')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow1, actionRow2]
        });
    }

    async handleClearWarnings(interaction) {
        const userId = interaction.customId.split('_')[3];
        
        try {
            const user = await this.client.users.fetch(userId);
            const warnings = await this.moderationManager.getUserWarnings(userId);
            const activeWarnings = warnings.filter(w => w.active);

            if (activeWarnings.length === 0) {
                return await interaction.reply({
                    content: '❌ Cet utilisateur n\'a aucun avertissement actif.',
                    ephemeral: true
                });
            }

            // Confirmation
            const confirmEmbed = new EmbedBuilder()
                .setTitle('🧹 Confirmation')
                .setDescription(`Êtes-vous sûr de vouloir effacer **${activeWarnings.length}** avertissement(s) de **${user.tag}** ?`)
                .setColor('#ffff00');

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`mod_confirm_clear_${userId}`)
                        .setLabel('✅ Confirmer')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('mod_cancel_clear')
                        .setLabel('❌ Annuler')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({
                embeds: [confirmEmbed],
                components: [confirmRow],
                ephemeral: true
            });

        } catch (error) {
            await interaction.reply({
                content: `❌ Erreur: ${error.message}`,
                ephemeral: true
            });
        }
    }

    // ==================== MODALS ====================

    async handleWarnModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userIdStr = interaction.fields.getTextInputValue('user_id');
        const reason = interaction.fields.getTextInputValue('reason');

        try {
            const user = await this.resolveUser(userIdStr);
            if (!user) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            const warnData = await this.moderationManager.warnUser(
                interaction.guild,
                interaction.user,
                user,
                reason
            );

            const warningCount = this.moderationManager.warnings.get(user.id)?.filter(w => w.active).length || 0;

            const embed = new EmbedBuilder()
                .setTitle('⚠️ Avertissement donné')
                .setDescription(`**${user.tag}** a été averti avec succès.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false },
                    { name: '📊 Total des avertissements', value: `${warningCount}`, inline: true }
                )
                .setColor('#ffff00')
                .setTimestamp()
                .setFooter({ text: `ID: ${warnData.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    async handleMuteModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userIdStr = interaction.fields.getTextInputValue('user_id');
        const durationStr = interaction.fields.getTextInputValue('duration') || '1h';
        const reason = interaction.fields.getTextInputValue('reason');

        try {
            const user = await this.resolveUser(userIdStr);
            if (!user) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            const duration = this.parseDuration(durationStr);
            const muteData = await this.moderationManager.muteUser(
                interaction.guild,
                interaction.user,
                user,
                reason,
                duration
            );

            const embed = new EmbedBuilder()
                .setTitle('🔇 Utilisateur mis en sourdine')
                .setDescription(`**${user.tag}** a été mis en sourdine avec succès.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '⏱️ Durée', value: this.moderationManager.formatDuration(duration), inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#ff8c00')
                .setTimestamp()
                .setFooter({ text: `ID: ${muteData.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    async handleKickModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userIdStr = interaction.fields.getTextInputValue('user_id');
        const reason = interaction.fields.getTextInputValue('reason');

        try {
            const user = await this.resolveUser(userIdStr);
            if (!user) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            const kickData = await this.moderationManager.kickUser(
                interaction.guild,
                interaction.user,
                user,
                reason
            );

            const embed = new EmbedBuilder()
                .setTitle('👢 Utilisateur expulsé')
                .setDescription(`**${user.tag}** a été expulsé du serveur.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#ff8c00')
                .setTimestamp()
                .setFooter({ text: `ID: ${kickData.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    async handleBanModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userIdStr = interaction.fields.getTextInputValue('user_id');
        const durationStr = interaction.fields.getTextInputValue('duration');
        const reason = interaction.fields.getTextInputValue('reason');

        try {
            const user = await this.resolveUser(userIdStr);
            if (!user) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            const duration = durationStr ? this.parseDuration(durationStr) : null;
            const banData = await this.moderationManager.banUser(
                interaction.guild,
                interaction.user,
                user,
                reason,
                duration
            );

            const embed = new EmbedBuilder()
                .setTitle('🔨 Utilisateur banni')
                .setDescription(`**${user.tag}** a été banni du serveur.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#ff0000')
                .setTimestamp()
                .setFooter({ text: `ID: ${banData.id}` });

            if (duration) {
                embed.addFields({
                    name: '⏱️ Durée',
                    value: `${this.moderationManager.formatDuration(duration)} (temporaire)`,
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
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    async handleUnbanModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.fields.getTextInputValue('user_id');
            const reason = interaction.fields.getTextInputValue('reason') || 'Aucune raison spécifiée';

            // Vérifier que l'ID est valide
            if (!/^\d{17,19}$/.test(userId)) {
                return await interaction.editReply({
                    content: '❌ ID utilisateur invalide. L\'ID doit être composé de 17-19 chiffres.'
                });
            }

            // Récupérer l'utilisateur
            const targetUser = await this.client.users.fetch(userId).catch(() => null);
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé avec cet ID.'
                });
            }

            // Effectuer l'unban
            const result = await this.moderationManager.unbanUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason
            );

            const embed = new EmbedBuilder()
                .setTitle('✅ Utilisateur Débanni')
                .setDescription(`**${targetUser.tag}** a été débanni avec succès.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    async handleUnmuteModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userInput = interaction.fields.getTextInputValue('user');
            const reason = interaction.fields.getTextInputValue('reason') || 'Aucune raison spécifiée';

            // Résoudre l'utilisateur
            const targetUser = await this.resolveUser(userInput);
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            // Effectuer l'unmute
            const result = await this.moderationManager.unmuteUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason
            );

            const embed = new EmbedBuilder()
                .setTitle('🔊 Utilisateur Démuté')
                .setDescription(`**${targetUser.tag}** n'est plus en sourdine.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    // ==================== CONFIGURATION ====================

    async handleConfigSelect(interaction, value) {
        switch (value) {
            case 'log_channel':
                await this.handleLogChannelConfig(interaction);
                break;
            case 'auto_actions':
                await this.handleAutoActionsConfig(interaction);
                break;
            case 'default_durations':
                await this.handleDurationsConfig(interaction);
                break;
            case 'reset_stats':
                await this.handleResetStats(interaction);
                break;
        }
    }

    async handleLogChannelConfig(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('mod_set_log_channel')
            .setTitle('📝 Configurer le canal de logs');

        const channelInput = new TextInputBuilder()
            .setCustomId('channel_id')
            .setLabel('ID ou mention du canal')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#moderation-logs ou 123456789012345678')
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(channelInput);
        modal.addComponents(firstRow);
        await interaction.showModal(modal);
    }

    async handleSetLogChannel(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const channelIdStr = interaction.fields.getTextInputValue('channel_id');
        
        try {
            const channel = await this.resolveChannel(channelIdStr);
            if (!channel || channel.type !== ChannelType.GuildText) {
                return await interaction.editReply({
                    content: '❌ Canal non trouvé ou ce n\'est pas un canal textuel.'
                });
            }

            this.moderationManager.setLogChannel(interaction.guild.id, channel.id);

            const embed = new EmbedBuilder()
                .setTitle('✅ Canal de logs configuré')
                .setDescription(`Le canal de logs de modération a été défini sur ${channel}.`)
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    // ==================== UTILITAIRES ====================

    async resolveUser(userInput) {
        // Extraire l'ID de différents formats
        let userId = userInput.match(/\d{17,19}/)?.[0];
        if (!userId) return null;

        try {
            return await this.client.users.fetch(userId);
        } catch {
            return null;
        }
    }

    async resolveChannel(channelInput) {
        // Extraire l'ID de différents formats
        let channelId = channelInput.match(/\d{17,19}/)?.[0];
        if (!channelId) return null;

        try {
            return await this.client.channels.fetch(channelId);
        } catch {
            return null;
        }
    }

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

    // ==================== NOUVEAUX BOUTONS ====================

    async handleUnbanButton(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('mod_unban_modal')
            .setTitle('🔓 Débannir un Utilisateur');

        const userIdInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('ID de l\'utilisateur à débannir')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678')
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Raison du débannissement')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Appel accepté')
            .setRequired(false);

        const actionRow1 = new ActionRowBuilder().addComponents(userIdInput);
        const actionRow2 = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(actionRow1, actionRow2);
        await interaction.showModal(modal);
    }

    async handleUnmuteButton(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('mod_unmute_modal')
            .setTitle('🔊 Retirer un Mute');

        const userInput = new TextInputBuilder()
            .setCustomId('user')
            .setLabel('Utilisateur à unmute')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('@utilisateur ou ID')
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Raison')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Mute levé')
            .setRequired(false);

        const actionRow1 = new ActionRowBuilder().addComponents(userInput);
        const actionRow2 = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(actionRow1, actionRow2);
        await interaction.showModal(modal);
    }

    async handleQuickActions(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚡ Actions Rapides de Modération')
            .setDescription('Sélectionnez une action rapide avec des paramètres prédéfinis')
            .addFields(
                { name: '⚠️ Actions d\'Avertissement', value: '• Spam/Flood\n• Langage inapproprié\n• Hors-sujet', inline: true },
                { name: '🔇 Mutes Rapides', value: '• 5 minutes\n• 1 heure\n• 24 heures', inline: true },
                { name: '🛠️ Outils', value: '• Nettoyer les warnings\n• Info utilisateur\n• Historique rapide', inline: true }
            )
            .setColor('#ff6b35')
            .setTimestamp();

        const actionRow1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('quick_warn_spam')
                    .setLabel('Warn Spam')
                    .setEmoji('⚠️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('quick_warn_language')
                    .setLabel('Warn Langage')
                    .setEmoji('🤬')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('quick_mute_5m')
                    .setLabel('Mute 5min')
                    .setEmoji('🔇')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('quick_mute_1h')
                    .setLabel('Mute 1h')
                    .setEmoji('🔇')
                    .setStyle(ButtonStyle.Primary)
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('quick_user_info')
                    .setLabel('Info User')
                    .setEmoji('👤')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('quick_clear_warns')
                    .setLabel('Clear Warns')
                    .setEmoji('🧹')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('mod_refresh_panel')
                    .setLabel('Retour')
                    .setEmoji('🔙')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow1, actionRow2],
            ephemeral: true
        });
    }

    async handleQuickActionButton(interaction) {
        const customId = interaction.customId;
        
        try {
            if (customId === 'quick_warn_spam') {
                await this.handleQuickWarn(interaction, 'Spam/Flood de messages');
            } else if (customId === 'quick_warn_language') {
                await this.handleQuickWarn(interaction, 'Langage inapproprié');
            } else if (customId === 'quick_mute_5m') {
                await this.handleQuickMute(interaction, 5 * 60 * 1000, '5 minutes');
            } else if (customId === 'quick_mute_1h') {
                await this.handleQuickMute(interaction, 60 * 60 * 1000, '1 heure');
            } else if (customId === 'quick_user_info') {
                await this.handleQuickUserInfo(interaction);
            } else if (customId === 'quick_clear_warns') {
                await this.handleQuickClearWarns(interaction);
            }
        } catch (error) {
            this.logger.error('Erreur dans handleQuickActionButton:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'action rapide.',
                ephemeral: true
            });
        }
    }

    async handleQuickWarn(interaction, reason) {
        const modal = new ModalBuilder()
            .setCustomId('quick_warn_modal')
            .setTitle('⚡ Avertissement Rapide');

        const userInput = new TextInputBuilder()
            .setCustomId('user')
            .setLabel('Utilisateur à avertir')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('@utilisateur ou ID')
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Raison')
            .setStyle(TextInputStyle.Short)
            .setValue(reason)
            .setRequired(true);

        const actionRow1 = new ActionRowBuilder().addComponents(userInput);
        const actionRow2 = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(actionRow1, actionRow2);
        await interaction.showModal(modal);
    }

    async handleQuickMute(interaction, duration, durationText) {
        const modal = new ModalBuilder()
            .setCustomId('quick_mute_modal')
            .setTitle(`⚡ Mute Rapide - ${durationText}`);

        const userInput = new TextInputBuilder()
            .setCustomId('user')
            .setLabel('Utilisateur à muter')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('@utilisateur ou ID')
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Raison')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`Mute ${durationText}`)
            .setRequired(true);

        const durationHidden = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Durée (ne pas modifier)')
            .setStyle(TextInputStyle.Short)
            .setValue(duration.toString())
            .setRequired(true);

        const actionRow1 = new ActionRowBuilder().addComponents(userInput);
        const actionRow2 = new ActionRowBuilder().addComponents(reasonInput);
        const actionRow3 = new ActionRowBuilder().addComponents(durationHidden);

        modal.addComponents(actionRow1, actionRow2, actionRow3);
        await interaction.showModal(modal);
    }

    async handleQuickUserInfo(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('quick_user_info_modal')
            .setTitle('👤 Informations Utilisateur');

        const userInput = new TextInputBuilder()
            .setCustomId('user')
            .setLabel('Utilisateur à consulter')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('@utilisateur ou ID')
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(userInput);
        modal.addComponents(actionRow);
        await interaction.showModal(modal);
    }

    async handleQuickClearWarns(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('quick_clear_warns_modal')
            .setTitle('🧹 Nettoyer les Avertissements');

        const userInput = new TextInputBuilder()
            .setCustomId('user')
            .setLabel('Utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('@utilisateur ou ID')
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Raison du nettoyage')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Réhabilitation')
            .setRequired(true);

        const actionRow1 = new ActionRowBuilder().addComponents(userInput);
        const actionRow2 = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(actionRow1, actionRow2);
        await interaction.showModal(modal);
    }

    // ==================== GESTIONNAIRES MODALS ACTIONS RAPIDES ====================

    async handleQuickWarnModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userInput = interaction.fields.getTextInputValue('user');
            const reason = interaction.fields.getTextInputValue('reason');

            const targetUser = await this.resolveUser(userInput);
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            const result = await this.moderationManager.warnUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason
            );

            const embed = new EmbedBuilder()
                .setTitle('⚡ Avertissement Rapide Appliqué')
                .setDescription(`**${targetUser.tag}** a reçu un avertissement.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#ffaa00')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    async handleQuickMuteModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userInput = interaction.fields.getTextInputValue('user');
            const reason = interaction.fields.getTextInputValue('reason');
            const duration = parseInt(interaction.fields.getTextInputValue('duration'));

            const targetUser = await this.resolveUser(userInput);
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            const result = await this.moderationManager.muteUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason,
                duration
            );

            const embed = new EmbedBuilder()
                .setTitle('⚡ Mute Rapide Appliqué')
                .setDescription(`**${targetUser.tag}** a été mis en sourdine.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '⏱️ Durée', value: this.moderationManager.formatDuration(duration), inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#ff6600')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    async handleQuickUserInfoModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userInput = interaction.fields.getTextInputValue('user');
            const targetUser = await this.resolveUser(userInput);
            
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            const warnings = await this.moderationManager.getUserWarnings(targetUser.id);
            const history = await this.moderationManager.getUserHistory(targetUser.id);

            const embed = new EmbedBuilder()
                .setTitle('👤 Informations Utilisateur')
                .setDescription(`Informations détaillées pour **${targetUser.tag}**`)
                .addFields(
                    { name: '🆔 ID', value: targetUser.id, inline: true },
                    { name: '📅 Création du compte', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '📊 Serveur', value: member ? `Rejoint <t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Non membre', inline: true },
                    { name: '⚠️ Avertissements', value: `${warnings.filter(w => w.active).length} actifs / ${warnings.length} total`, inline: true },
                    { name: '📋 Actions totales', value: history.length.toString(), inline: true },
                    { name: '👑 Rôles', value: member ? (member.roles.cache.size > 1 ? `${member.roles.cache.size - 1} rôles` : 'Aucun rôle') : 'N/A', inline: true }
                )
                .setColor('#3498db')
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    async handleQuickClearWarnsModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userInput = interaction.fields.getTextInputValue('user');
            const reason = interaction.fields.getTextInputValue('reason');

            const targetUser = await this.resolveUser(userInput);
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            const warnings = await this.moderationManager.getUserWarnings(targetUser.id);
            const activeWarnings = warnings.filter(w => w.active);

            if (activeWarnings.length === 0) {
                return await interaction.editReply({
                    content: `❌ **${targetUser.tag}** n'a aucun avertissement actif à nettoyer.`
                });
            }

            await this.moderationManager.clearWarnings(targetUser.id, interaction.user.id, reason);

            const embed = new EmbedBuilder()
                .setTitle('🧹 Avertissements Nettoyés')
                .setDescription(`Les avertissements de **${targetUser.tag}** ont été nettoyés.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '🧹 Nettoyés', value: `${activeWarnings.length} avertissements`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }
}
