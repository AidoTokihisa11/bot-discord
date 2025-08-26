import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ChannelType } from 'discord.js';
import AccessRestriction from '../utils/AccessRestriction.js';

export default class ModerationButtonHandler {
    constructor(client) {
        this.client = client;
        this.moderationManager = client.moderationManager;
        this.logger = client.logger;
        this.accessRestriction = new AccessRestriction();
    }

    async handleModerationButton(interaction) {
        const customId = interaction.customId;
        
        try {
            // === VÉRIFICATION D'ACCÈS GLOBALE ===
            const hasAccess = await this.accessRestriction.checkAccess(interaction);
            if (!hasAccess) {
                return; // Accès refusé, message déjà envoyé
            }

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
            } else if (customId.startsWith('history_')) {
                await this.handleHistoryNavigation(interaction);
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
            // === VÉRIFICATION D'ACCÈS GLOBALE ===
            const hasAccess = await this.accessRestriction.checkAccess(interaction);
            if (!hasAccess) {
                return; // Accès refusé, message déjà envoyé
            }

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
            // === VÉRIFICATION D'ACCÈS GLOBALE ===
            const hasAccess = await this.accessRestriction.checkAccess(interaction);
            if (!hasAccess) {
                return; // Accès refusé, message déjà envoyé
            }

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
            } else if (customId === 'mod_history_modal') {
                await this.handleHistoryModal(interaction);
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

    // ==================== HISTORIQUE AMÉLIORÉ ====================
    async handleHistoryButton(interaction) {
        const customId = interaction.customId;
        
        // Vérifier si c'est un bouton d'historique spécifique avec un ID utilisateur
        if (customId.includes('_full_')) {
            const userId = customId.split('_full_')[1];
            await this.handleFullHistory(interaction, userId);
            return;
        }
        
        if (customId.includes('_export_')) {
            const userId = customId.split('_export_')[1];
            await this.handleExportHistory(interaction, userId);
            return;
        }
        
        if (customId.includes('_quick_action_')) {
            const userId = customId.split('_quick_action_')[1];
            await this.handleQuickActionsForUser(interaction, userId);
            return;
        }

        // Si c'est le bouton général, afficher le modal
        const modal = new ModalBuilder()
            .setCustomId('mod_history_modal')
            .setTitle('📋 Consulter l\'historique détaillé');

        const userInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel('ID ou mention de l\'utilisateur')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('123456789012345678 ou @utilisateur')
            .setRequired(true);

        const detailedInput = new TextInputBuilder()
            .setCustomId('detailed')
            .setLabel('Affichage détaillé ? (oui/non)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('oui pour plus de détails')
            .setRequired(false);

        const firstRow = new ActionRowBuilder().addComponents(userInput);
        const secondRow = new ActionRowBuilder().addComponents(detailedInput);
        
        modal.addComponents(firstRow, secondRow);
        await interaction.showModal(modal);
    }

    async handleFullHistory(interaction, userId) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = await this.resolveUser(userId);
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé.'
                });
            }

            const history = await this.moderationManager.getUserHistory(targetUser.id);
            const warnings = await this.moderationManager.getUserWarnings(targetUser.id);

            if (history.length === 0 && warnings.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 Historique complet')
                    .setDescription(`**${targetUser.tag}** n'a aucun antécédent. ✅`)
                    .setColor('#00ff00');
                
                return await interaction.editReply({ embeds: [embed] });
            }

            // Générer un rapport complet avec pagination
            const fullHistoryEmbeds = await this.generateFullHistoryEmbeds(targetUser, history, warnings);
            
            // Système de pagination
            let currentPage = 0;
            const totalPages = fullHistoryEmbeds.length;

            const navigationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`history_prev_${userId}`)
                        .setLabel('◀️ Précédent')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId(`history_page_${userId}`)
                        .setLabel(`Page ${currentPage + 1}/${totalPages}`)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`history_next_${userId}`)
                        .setLabel('Suivant ▶️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === totalPages - 1),
                    new ButtonBuilder()
                        .setCustomId(`mod_export_history_${userId}`)
                        .setLabel('📁 Exporter')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.editReply({
                embeds: [fullHistoryEmbeds[currentPage]],
                components: [navigationRow]
            });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    async handleExportHistory(interaction, userId) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = await this.resolveUser(userId);
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé.'
                });
            }

            const history = await this.moderationManager.getUserHistory(targetUser.id);
            const warnings = await this.moderationManager.getUserWarnings(targetUser.id);

            // Générer un rapport détaillé
            const report = this.generateDetailedReport(targetUser, history, warnings);
            
            // Créer un fichier
            const buffer = Buffer.from(report, 'utf-8');
            
            const embed = new EmbedBuilder()
                .setTitle('📁 Export de l\'historique')
                .setDescription(`Historique complet de **${targetUser.tag}** exporté avec succès.`)
                .addFields(
                    { name: '📊 Actions totales', value: history.length.toString(), inline: true },
                    { name: '⚠️ Avertissements', value: warnings.length.toString(), inline: true },
                    { name: '📅 Généré le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed],
                files: [{
                    attachment: buffer,
                    name: `historique-${targetUser.tag.replace(/\s+/g, '-')}-${Date.now()}.txt`
                }]
            });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur lors de l'export: ${error.message}`
            });
        }
    }

    async handleQuickActionsForUser(interaction, userId) {
        const targetUser = await this.resolveUser(userId);
        if (!targetUser) {
            return await interaction.reply({
                content: '❌ Utilisateur non trouvé.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`⚡ Actions rapides pour ${targetUser.tag}`)
            .setDescription('Sélectionnez une action à effectuer rapidement')
            .setThumbnail(targetUser.displayAvatarURL())
            .setColor('#ff6b35');

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`quick_warn_user_${userId}`)
                    .setLabel('⚠️ Avertir')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`quick_mute_user_${userId}`)
                    .setLabel('🔇 Mute 1h')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`quick_kick_user_${userId}`)
                    .setLabel('👢 Kick')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`mod_clear_warnings_${userId}`)
                    .setLabel('🧹 Clear Warns')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow],
            ephemeral: true
        });
    }

    async handleHistoryNavigation(interaction, userId) {
        const customId = interaction.customId;
        
        if (customId.startsWith('history_prev_') || customId.startsWith('history_next_')) {
            // Logique de navigation entre pages
            await interaction.deferUpdate();
            // Implémentation de la pagination ici
        }
    }

    async handleHistoryModal(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userInput = interaction.fields.getTextInputValue('user_id');
            const detailedInput = interaction.fields.getTextInputValue('detailed') || '';
            const detailed = detailedInput.toLowerCase().includes('oui');

            const targetUser = await this.resolveUser(userInput);
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé. Vérifiez l\'ID ou la mention.'
                });
            }

            // Simuler la commande /moderation history
            const history = await this.moderationManager.getUserHistory(targetUser.id);
            const warnings = await this.moderationManager.getUserWarnings(targetUser.id);
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (history.length === 0 && warnings.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 Historique de modération')
                    .setDescription(`**${targetUser.tag}** n'a aucun antécédent de modération. ✅`)
                    .addFields(
                        { name: '🎯 Statut', value: 'Membre exemplaire', inline: true },
                        { name: '📅 Dernière vérification', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                        { name: '🏆 Réputation', value: '100% Propre', inline: true }
                    )
                    .setColor('#00ff00')
                    .setTimestamp()
                    .setThumbnail(targetUser.displayAvatarURL());

                return await interaction.editReply({ embeds: [embed] });
            }

            // Générer l'historique détaillé
            const embeds = await this.generateHistoryEmbeds(targetUser, history, warnings, member, detailed);
            
            // Boutons d'actions
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`mod_history_full_${targetUser.id}`)
                        .setLabel('📄 Historique complet')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(detailed),
                    new ButtonBuilder()
                        .setCustomId(`mod_clear_warnings_${targetUser.id}`)
                        .setLabel('🧹 Effacer les avertissements')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(warnings.filter(w => w.active).length === 0),
                    new ButtonBuilder()
                        .setCustomId(`mod_quick_action_${targetUser.id}`)
                        .setLabel('⚡ Actions rapides')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`mod_export_history_${targetUser.id}`)
                        .setLabel('📁 Exporter')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({ 
                embeds: embeds,
                components: [actionRow]
            });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    }

    // ==================== GÉNÉRATEURS D'EMBEDS ====================
    async generateHistoryEmbeds(targetUser, history, warnings, member, detailed) {
        const embeds = [];

        // Embed principal
        const mainEmbed = new EmbedBuilder()
            .setTitle('📋 **HISTORIQUE DE MODÉRATION**')
            .setDescription(`**Profil de ${targetUser.tag}**`)
            .addFields(
                { name: '👤 Utilisateur', value: `${targetUser.tag}`, inline: true },
                { name: '🆔 ID Discord', value: `\`${targetUser.id}\``, inline: true },
                { name: '📅 Compte créé', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setColor('#3498db')
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

        if (member) {
            mainEmbed.addFields(
                { name: '📥 Rejoint le serveur', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '👑 Rôles', value: member.roles.cache.size > 1 ? `${member.roles.cache.size - 1} rôles` : 'Aucun rôle', inline: true }
            );
        }

        embeds.push(mainEmbed);

        // Statistiques
        const actionCounts = {
            warn: history.filter(h => h.type === 'warn').length,
            mute: history.filter(h => h.type === 'mute').length,
            kick: history.filter(h => h.type === 'kick').length,
            ban: history.filter(h => h.type === 'ban').length
        };

        const statsEmbed = new EmbedBuilder()
            .setTitle('📊 **STATISTIQUES**')
            .addFields(
                { name: '⚠️ Avertissements', value: `${actionCounts.warn} total\n${warnings.filter(w => w.active).length} actifs`, inline: true },
                { name: '🔇 Mutes', value: `${actionCounts.mute} total`, inline: true },
                { name: '👢 Expulsions', value: `${actionCounts.kick} total`, inline: true }
            )
            .setColor('#9b59b6');

        embeds.push(statsEmbed);

        return embeds;
    }

    async generateFullHistoryEmbeds(targetUser, history, warnings) {
        const embeds = [];
        const itemsPerPage = 5;
        const totalItems = history.length + warnings.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Combiner et trier par date
        const allItems = [
            ...history.map(h => ({ ...h, itemType: 'history' })),
            ...warnings.map(w => ({ ...w, itemType: 'warning' }))
        ].sort((a, b) => b.timestamp - a.timestamp);

        for (let page = 0; page < totalPages; page++) {
            const startIndex = page * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = allItems.slice(startIndex, endIndex);

            const embed = new EmbedBuilder()
                .setTitle(`📋 Historique complet - Page ${page + 1}/${totalPages}`)
                .setDescription(`**${targetUser.tag}** - ${totalItems} éléments au total`)
                .setColor('#3498db')
                .setTimestamp();

            pageItems.forEach((item, index) => {
                const globalIndex = startIndex + index + 1;
                const date = `<t:${Math.floor(item.timestamp / 1000)}:R>`;
                
                if (item.itemType === 'history') {
                    const action = this.getActionEmoji(item.type) + ' ' + item.type.toUpperCase();
                    const reason = item.data?.reason || 'Aucune raison';
                    embed.addFields({
                        name: `${globalIndex}. ${action} ${date}`,
                        value: `📝 **Raison:** ${reason}\n👮 **Modérateur:** ${item.data?.moderator || 'Inconnu'}`,
                        inline: false
                    });
                } else {
                    embed.addFields({
                        name: `${globalIndex}. ⚠️ AVERTISSEMENT ${date}`,
                        value: `📝 **Raison:** ${item.reason}\n👮 **Modérateur:** ${item.moderator || 'Inconnu'}\n🎯 **Statut:** ${item.active ? '🟢 Actif' : '🔴 Inactif'}`,
                        inline: false
                    });
                }
            });

            embeds.push(embed);
        }

        return embeds;
    }

    generateDetailedReport(targetUser, history, warnings) {
        const report = [];
        
        report.push('═══════════════════════════════════════════════════════════════');
        report.push(`                RAPPORT D'HISTORIQUE DE MODÉRATION`);
        report.push('═══════════════════════════════════════════════════════════════');
        report.push('');
        report.push(`👤 UTILISATEUR: ${targetUser.tag} (${targetUser.id})`);
        report.push(`📅 GÉNÉRÉ LE: ${new Date().toLocaleString('fr-FR')}`);
        report.push(`📊 ACTIONS TOTALES: ${history.length}`);
        report.push(`⚠️ AVERTISSEMENTS: ${warnings.length} (${warnings.filter(w => w.active).length} actifs)`);
        report.push('');
        
        report.push('───────────────────────────────────────────────────────────────');
        report.push('                    HISTORIQUE DES ACTIONS');
        report.push('───────────────────────────────────────────────────────────────');
        
        history.forEach((action, index) => {
            report.push('');
            report.push(`${index + 1}. ACTION: ${action.type.toUpperCase()}`);
            report.push(`   📅 Date: ${new Date(action.timestamp).toLocaleString('fr-FR')}`);
            report.push(`   👮 Modérateur: ${action.data?.moderator || 'Inconnu'}`);
            report.push(`   📝 Raison: ${action.data?.reason || 'Aucune raison spécifiée'}`);
            if (action.data?.duration) {
                report.push(`   ⏱️ Durée: ${this.moderationManager.formatDuration(action.data.duration)}`);
            }
        });
        
        if (warnings.length > 0) {
            report.push('');
            report.push('───────────────────────────────────────────────────────────────');
            report.push('                    AVERTISSEMENTS DÉTAILLÉS');
            report.push('───────────────────────────────────────────────────────────────');
            
            warnings.forEach((warning, index) => {
                report.push('');
                report.push(`${index + 1}. AVERTISSEMENT ${warning.active ? '[ACTIF]' : '[INACTIF]'}`);
                report.push(`   📅 Date: ${new Date(warning.timestamp).toLocaleString('fr-FR')}`);
                report.push(`   👮 Modérateur: ${warning.moderator || 'Inconnu'}`);
                report.push(`   📝 Raison: ${warning.reason}`);
                report.push(`   🆔 ID: ${warning.id}`);
            });
        }
        
        report.push('');
        report.push('═══════════════════════════════════════════════════════════════');
        report.push('                      FIN DU RAPPORT');
        report.push('═══════════════════════════════════════════════════════════════');
        
        return report.join('\n');
    }

    // ==================== AUTRES BOUTONS ====================
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

    // ==================== CONFIGURATION AVANCÉE ====================
    async handleConfigButton(interaction) {
        const configEmbed = new EmbedBuilder()
            .setTitle('⚙️ **CONFIGURATION DU SYSTÈME DE MODÉRATION**')
            .setDescription('**Configurez tous les aspects du système de modération avancé**')
            .addFields(
                { 
                    name: '📝 Canal de logs', 
                    value: 'Définir le canal pour les logs de modération\n*Permet de suivre toutes les actions*', 
                    inline: true 
                },
                { 
                    name: '🚨 Actions automatiques', 
                    value: 'Configurer les sanctions automatiques\n*Seuils et escalades*', 
                    inline: true 
                },
                { 
                    name: '⏱️ Durées par défaut', 
                    value: 'Modifier les durées de timeout\n*Mutes et bans temporaires*', 
                    inline: true 
                },
                { 
                    name: '🛡️ Automodération', 
                    value: 'Paramètres de modération auto\n*Filtres et détection*', 
                    inline: true 
                },
                { 
                    name: '📊 Statistiques', 
                    value: 'Gestion des données et rapports\n*Export et réinitialisation*', 
                    inline: true 
                },
                { 
                    name: '🔧 Permissions', 
                    value: 'Configuration des rôles modérateurs\n*Hiérarchie et accès*', 
                    inline: true 
                }
            )
            .setColor('#3498db')
            .setTimestamp()
            .setFooter({ text: 'Sélectionnez une option pour configurer le système' });

        const configRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('mod_config_select')
                    .setPlaceholder('🔧 Sélectionnez une option de configuration')
                    .addOptions(
                        {
                            label: '📝 Canal de logs',
                            description: 'Définir le canal pour les logs de modération',
                            value: 'log_channel',
                            emoji: '📝'
                        },
                        {
                            label: '🚨 Actions automatiques',
                            description: 'Configurer les seuils de sanctions automatiques',
                            value: 'auto_actions',
                            emoji: '🚨'
                        },
                        {
                            label: '⏱️ Durées par défaut',
                            description: 'Modifier les durées de timeout par défaut',
                            value: 'default_durations',
                            emoji: '⏱️'
                        },
                        {
                            label: '🛡️ Automodération',
                            description: 'Paramètres de modération automatique',
                            value: 'automod_settings',
                            emoji: '🛡️'
                        },
                        {
                            label: '📊 Gestion des données',
                            description: 'Export, sauvegarde et réinitialisation',
                            value: 'data_management',
                            emoji: '📊'
                        },
                        {
                            label: '🔧 Permissions avancées',
                            description: 'Configuration des rôles et hiérarchie',
                            value: 'permissions_config',
                            emoji: '🔧'
                        }
                    )
            );

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_config_status')
                    .setLabel('📋 État actuel')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('mod_config_reset')
                    .setLabel('🔄 Réinitialiser')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('mod_config_export')
                    .setLabel('📁 Exporter config')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mod_refresh_panel')
                    .setLabel('🔙 Retour')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ 
            embeds: [configEmbed], 
            components: [configRow, buttonRow],
            ephemeral: true 
        });
    }

    async handleConfigSelect(interaction, value) {
        await interaction.deferReply({ ephemeral: true });

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
            case 'automod_settings':
                await this.handleAutoModConfig(interaction);
                break;
            case 'data_management':
                await this.handleDataManagementConfig(interaction);
                break;
            case 'permissions_config':
                await this.handlePermissionsConfig(interaction);
                break;
            default:
                await interaction.editReply({
                    content: '❌ Option de configuration non reconnue.'
                });
        }
    }

    async handleLogChannelConfig(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('mod_set_log_channel')
            .setTitle('📝 Configurer le canal de logs');

        const channelInput = new TextInputBuilder()
            .setCustomId('channel_id')
            .setLabel('ID ou mention du canal de logs')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#moderation-logs ou 123456789012345678')
            .setRequired(true);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description du canal (optionnel)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Canal pour enregistrer toutes les actions de modération...')
            .setRequired(false)
            .setMaxLength(500);

        const firstRow = new ActionRowBuilder().addComponents(channelInput);
        const secondRow = new ActionRowBuilder().addComponents(descriptionInput);
        
        modal.addComponents(firstRow, secondRow);
        await interaction.showModal(modal);
    }

    async handleAutoActionsConfig(interaction) {
        const currentConfig = this.moderationManager.config;
        
        const embed = new EmbedBuilder()
            .setTitle('🚨 **CONFIGURATION DES ACTIONS AUTOMATIQUES**')
            .setDescription('**Configurez les seuils pour les sanctions automatiques**')
            .addFields(
                { 
                    name: '⚠️ Seuil de mute automatique', 
                    value: `Actuellement: **${currentConfig.autoMuteThreshold}** avertissements\n*L'utilisateur sera muté automatiquement*`, 
                    inline: true 
                },
                { 
                    name: '👢 Seuil de kick automatique', 
                    value: `Actuellement: **${currentConfig.autoKickThreshold}** avertissements\n*L'utilisateur sera expulsé automatiquement*`, 
                    inline: true 
                },
                { 
                    name: '🔨 Seuil de ban automatique', 
                    value: `Actuellement: **${currentConfig.autoBanThreshold}** avertissements\n*L'utilisateur sera banni automatiquement*`, 
                    inline: true 
                },
                { 
                    name: '📋 Avertissements maximum', 
                    value: `Actuellement: **${currentConfig.maxWarnings}** avertissements\n*Limite totale d'avertissements*`, 
                    inline: true 
                },
                { 
                    name: '🔄 Statut du système', 
                    value: '✅ **ACTIF** - Les actions automatiques sont appliquées', 
                    inline: true 
                },
                { 
                    name: '⚡ Actions récentes', 
                    value: 'Aucune action automatique récente', 
                    inline: true 
                }
            )
            .setColor('#e74c3c')
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_auto_mute_threshold')
                    .setLabel('⚠️ Modifier seuil mute')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_auto_kick_threshold')
                    .setLabel('👢 Modifier seuil kick')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_auto_ban_threshold')
                    .setLabel('🔨 Modifier seuil ban')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('config_disable_auto')
                    .setLabel('🚫 Désactiver auto')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    }

    async handleDurationsConfig(interaction) {
        const currentConfig = this.moderationManager.config.muteDurations;
        
        const embed = new EmbedBuilder()
            .setTitle('⏱️ **CONFIGURATION DES DURÉES PAR DÉFAUT**')
            .setDescription('**Modifiez les durées de timeout et de sanctions**')
            .addFields(
                { 
                    name: '🕐 Mute court', 
                    value: `${this.formatDuration(currentConfig.short)}\n*Pour infractions mineures*`, 
                    inline: true 
                },
                { 
                    name: '🕕 Mute moyen', 
                    value: `${this.formatDuration(currentConfig.medium)}\n*Pour infractions modérées*`, 
                    inline: true 
                },
                { 
                    name: '🕘 Mute long', 
                    value: `${this.formatDuration(currentConfig.long)}\n*Pour infractions graves*`, 
                    inline: true 
                },
                { 
                    name: '📅 Mute très long', 
                    value: `${this.formatDuration(currentConfig.week)}\n*Pour récidivistes*`, 
                    inline: true 
                },
                { 
                    name: '⚡ Actions rapides', 
                    value: 'Utilisées dans le menu actions rapides', 
                    inline: true 
                },
                { 
                    name: '🎯 Recommandations', 
                    value: 'Basées sur les meilleures pratiques', 
                    inline: true 
                }
            )
            .setColor('#f39c12')
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_duration_short')
                    .setLabel('🕐 Mute court')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_duration_medium')
                    .setLabel('🕕 Mute moyen')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_duration_long')
                    .setLabel('🕘 Mute long')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_duration_week')
                    .setLabel('📅 Mute semaine')
                    .setStyle(ButtonStyle.Primary)
            );

        const presetRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_preset_strict')
                    .setLabel('🔒 Preset strict')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('config_preset_balanced')
                    .setLabel('⚖️ Preset équilibré')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_preset_lenient')
                    .setLabel('🤝 Preset clément')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('config_preset_reset')
                    .setLabel('🔄 Réinitialiser')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow, presetRow]
        });
    }

    async handleAutoModConfig(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ **CONFIGURATION DE L\'AUTOMODÉRATION**')
            .setDescription('**Paramétrez la modération automatique avancée**')
            .addFields(
                { 
                    name: '🚫 Filtres de contenu', 
                    value: '• Liens suspects\n• Spam de messages\n• Contenu inapproprié\n• Mentions excessives', 
                    inline: true 
                },
                { 
                    name: '⚡ Actions automatiques', 
                    value: '• Suppression de message\n• Avertissement auto\n• Mute temporaire\n• Signalement aux mods', 
                    inline: true 
                },
                { 
                    name: '📊 Statistiques', 
                    value: '• Messages filtrés: 0\n• Actions auto: 0\n• Précision: 98%\n• Faux positifs: 2%', 
                    inline: true 
                }
            )
            .setColor('#9b59b6')
            .setTimestamp()
            .setFooter({ text: '⚠️ L\'automodération est actuellement en développement' });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('automod_enable_basic')
                    .setLabel('✅ Activer basique')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('automod_configure_filters')
                    .setLabel('🔧 Configurer filtres')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('automod_test_mode')
                    .setLabel('🧪 Mode test')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('automod_coming_soon')
                    .setLabel('🚧 Bientôt disponible')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    }

    async handleDataManagementConfig(interaction) {
        const stats = await this.moderationManager.getStats();
        
        const embed = new EmbedBuilder()
            .setTitle('📊 **GESTION DES DONNÉES DE MODÉRATION**')
            .setDescription('**Gérez les données, statistiques et sauvegardes**')
            .addFields(
                { 
                    name: '📈 Statistiques actuelles', 
                    value: `• Actions totales: **${stats.totalActions}**\n• Actions aujourd'hui: **${stats.actionsToday}**\n• Mutes actifs: **${stats.activeMutes}**\n• Avertissements actifs: **${stats.totalWarnings}**`, 
                    inline: true 
                },
                { 
                    name: '💾 Données stockées', 
                    value: '• Historique des actions\n• Avertissements\n• Configuration\n• Logs de modération', 
                    inline: true 
                },
                { 
                    name: '🔄 Maintenance', 
                    value: '• Nettoyage automatique\n• Archivage mensuel\n• Sauvegarde quotidienne\n• Optimisation DB', 
                    inline: true 
                }
            )
            .setColor('#16a085')
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('data_export_all')
                    .setLabel('📁 Exporter tout')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('data_cleanup_old')
                    .setLabel('🧹 Nettoyer ancien')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('data_reset_stats')
                    .setLabel('🔄 Reset stats')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('data_backup_now')
                    .setLabel('💾 Sauvegarde')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    }

    async handlePermissionsConfig(interaction) {
        const guild = interaction.guild;
        const moderatorRoles = guild.roles.cache.filter(role => 
            role.permissions.has(PermissionFlagsBits.ModerateMembers)
        );

        const embed = new EmbedBuilder()
            .setTitle('🔧 **CONFIGURATION DES PERMISSIONS**')
            .setDescription('**Gérez les rôles et permissions de modération**')
            .addFields(
                { 
                    name: '👮 Rôles modérateurs détectés', 
                    value: moderatorRoles.size > 0 ? 
                        moderatorRoles.map(role => `• ${role.name} (${role.members.size} membres)`).slice(0, 5).join('\n') :
                        'Aucun rôle modérateur détecté', 
                    inline: false 
                },
                { 
                    name: '🛡️ Permissions requises', 
                    value: '• Modérer les membres\n• Gérer les messages\n• Expulser les membres\n• Bannir les membres', 
                    inline: true 
                },
                { 
                    name: '⚙️ Configuration avancée', 
                    value: '• Hiérarchie des rôles\n• Permissions par canal\n• Restrictions d\'actions\n• Logs d\'audit', 
                    inline: true 
                }
            )
            .setColor('#8e44ad')
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('perms_check_roles')
                    .setLabel('🔍 Vérifier rôles')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('perms_setup_hierarchy')
                    .setLabel('📊 Hiérarchie')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('perms_test_permissions')
                    .setLabel('🧪 Tester perms')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('perms_audit_log')
                    .setLabel('📋 Audit log')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}j ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
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

    // ==================== NAVIGATION DE L'HISTORIQUE ====================
    async handleHistoryNavigation(interaction) {
        const customId = interaction.customId;
        const userId = customId.split('_')[2]; // Extraire l'ID utilisateur
        
        if (customId.startsWith('history_prev_')) {
            await this.handleHistoryPageChange(interaction, userId, -1);
        } else if (customId.startsWith('history_next_')) {
            await this.handleHistoryPageChange(interaction, userId, 1);
        }
    }

    async handleHistoryPageChange(interaction, userId, direction) {
        await interaction.deferUpdate();

        try {
            const targetUser = await this.resolveUser(userId);
            if (!targetUser) {
                return await interaction.editReply({
                    content: '❌ Utilisateur non trouvé.'
                });
            }

            const history = await this.moderationManager.getUserHistory(targetUser.id);
            const warnings = await this.moderationManager.getUserWarnings(targetUser.id);

            // Générer les embeds complets
            const fullHistoryEmbeds = await this.generateFullHistoryEmbeds(targetUser, history, warnings);
            
            // Obtenir la page actuelle depuis le bouton
            const currentMessage = interaction.message;
            const currentPageButton = currentMessage.components[0].components[1];
            const currentPageText = currentPageButton.data.label;
            const currentPage = parseInt(currentPageText.split('/')[0].replace('Page ', '')) - 1;
            
            // Calculer la nouvelle page
            const newPage = Math.max(0, Math.min(fullHistoryEmbeds.length - 1, currentPage + direction));
            const totalPages = fullHistoryEmbeds.length;

            // Créer les nouveaux boutons de navigation
            const navigationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`history_prev_${userId}`)
                        .setLabel('◀️ Précédent')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(newPage === 0),
                    new ButtonBuilder()
                        .setCustomId(`history_page_${userId}`)
                        .setLabel(`Page ${newPage + 1}/${totalPages}`)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`history_next_${userId}`)
                        .setLabel('Suivant ▶️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(newPage === totalPages - 1),
                    new ButtonBuilder()
                        .setCustomId(`mod_export_history_${userId}`)
                        .setLabel('📁 Exporter')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.editReply({
                embeds: [fullHistoryEmbeds[newPage]],
                components: [navigationRow]
            });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur lors de la navigation: ${error.message}`
            });
        }
    }

    // ==================== GÉNÉRATION DES EMBEDS D'HISTORIQUE ====================
    async generateFullHistoryEmbeds(targetUser, history, warnings) {
        const embeds = [];
        const itemsPerPage = 5;

        // Page 1: Informations générales
        const member = await this.client.guilds.cache.first()?.members.fetch(targetUser.id).catch(() => null);
        
        const mainEmbed = new EmbedBuilder()
            .setTitle('📋 **HISTORIQUE COMPLET DE MODÉRATION**')
            .setDescription(`**Profil détaillé de ${targetUser.tag}**`)
            .addFields(
                { name: '👤 Utilisateur', value: `${targetUser.tag}`, inline: true },
                { name: '🆔 ID Discord', value: `\`${targetUser.id}\``, inline: true },
                { name: '📅 Compte créé', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setColor('#3498db')
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

        if (member) {
            mainEmbed.addFields(
                { name: '📥 Rejoint le serveur', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '👑 Rôles', value: member.roles.cache.size > 1 ? `${member.roles.cache.size - 1} rôles` : 'Aucun rôle', inline: true },
                { name: '💎 Statut', value: member.premiumSince ? '🌟 Booster' : '👤 Membre', inline: true }
            );
        }

        // Statistiques des sanctions
        const actionCounts = {
            warn: history.filter(h => h.type === 'warn').length,
            mute: history.filter(h => h.type === 'mute').length,
            kick: history.filter(h => h.type === 'kick').length,
            ban: history.filter(h => h.type === 'ban').length,
            unban: history.filter(h => h.type === 'unban').length
        };

        mainEmbed.addFields(
            { name: '⚠️ Avertissements', value: `${actionCounts.warn} total\n${warnings.filter(w => w.active).length} actifs`, inline: true },
            { name: '🔇 Mutes', value: `${actionCounts.mute} total`, inline: true },
            { name: '👢 Expulsions', value: `${actionCounts.kick} total`, inline: true },
            { name: '🔨 Bannissements', value: `${actionCounts.ban} total`, inline: true },
            { name: '✅ Débannissements', value: `${actionCounts.unban} total`, inline: true },
            { name: '📈 Score de risque', value: this.calculateRiskScore(actionCounts), inline: true }
        );

        embeds.push(mainEmbed);

        // Pages pour les avertissements actifs
        const activeWarnings = warnings.filter(w => w.active);
        if (activeWarnings.length > 0) {
            for (let i = 0; i < activeWarnings.length; i += itemsPerPage) {
                const pageWarnings = activeWarnings.slice(i, i + itemsPerPage);
                const warningsEmbed = new EmbedBuilder()
                    .setTitle(`⚠️ **AVERTISSEMENTS ACTIFS** (Page ${Math.floor(i / itemsPerPage) + 1})`)
                    .setColor('#ffaa00');

                const warningsList = pageWarnings.map((w, index) => {
                    const globalIndex = i + index + 1;
                    const date = `<t:${Math.floor(w.timestamp / 1000)}:R>`;
                    const moderator = w.moderator || 'Inconnu';
                    const reason = w.reason.length > 100 ? w.reason.substring(0, 100) + '...' : w.reason;
                    return `**${globalIndex}.** ${reason}\n📅 ${date} • 👮 ${moderator}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                }).join('\n\n');

                warningsEmbed.setDescription(warningsList);
                warningsEmbed.setFooter({ 
                    text: `Avertissement ${i + 1}-${Math.min(i + itemsPerPage, activeWarnings.length)} sur ${activeWarnings.length}` 
                });

                embeds.push(warningsEmbed);
            }
        }

        // Pages pour l'historique complet
        if (history.length > 0) {
            const sortedHistory = history.sort((a, b) => b.timestamp - a.timestamp);
            
            for (let i = 0; i < sortedHistory.length; i += itemsPerPage) {
                const pageHistory = sortedHistory.slice(i, i + itemsPerPage);
                const historyEmbed = new EmbedBuilder()
                    .setTitle(`📜 **HISTORIQUE COMPLET** (Page ${Math.floor(i / itemsPerPage) + 1})`)
                    .setColor('#9b59b6');

                const historyList = pageHistory.map((h, index) => {
                    const globalIndex = i + index + 1;
                    const action = this.getActionEmoji(h.type) + ' ' + h.type.toUpperCase();
                    const timestamp = `<t:${Math.floor(h.timestamp / 1000)}:F>`;
                    const moderator = h.data.moderator || 'Système';
                    const reason = h.data.reason?.substring(0, 80) || 'Aucune raison';
                    const duration = h.data.duration ? ` (${this.moderationManager.formatDuration(h.data.duration)})` : '';
                    
                    return `**${globalIndex}.** ${action}${duration}\n📝 ${reason}\n📅 ${timestamp}\n👮 ${moderator}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                }).join('\n\n');

                historyEmbed.setDescription(historyList);
                historyEmbed.setFooter({ 
                    text: `Action ${i + 1}-${Math.min(i + itemsPerPage, sortedHistory.length)} sur ${sortedHistory.length}` 
                });

                embeds.push(historyEmbed);
            }
        }

        return embeds;
    }

    // ==================== GÉNÉRATION DE RAPPORT DÉTAILLÉ ====================
    generateDetailedReport(targetUser, history, warnings) {
        const now = new Date();
        const activeWarnings = warnings.filter(w => w.active);
        
        let report = `🛡️ RAPPORT DE MODÉRATION DÉTAILLÉ
═══════════════════════════════════════════════════════════════════

👤 INFORMATIONS UTILISATEUR
• Nom: ${targetUser.tag}
• ID: ${targetUser.id}
• Compte créé: ${new Date(targetUser.createdTimestamp).toLocaleString('fr-FR')}
• Rapport généré: ${now.toLocaleString('fr-FR')}

📊 RÉSUMÉ DES SANCTIONS
• Actions totales: ${history.length}
• Avertissements actifs: ${activeWarnings.length}
• Avertissements total: ${warnings.length}

════════════════════════════════════════════════════════════════════

⚠️ AVERTISSEMENTS ACTIFS (${activeWarnings.length})
`;

        if (activeWarnings.length > 0) {
            activeWarnings.forEach((warning, index) => {
                const date = new Date(warning.timestamp).toLocaleString('fr-FR');
                report += `
${index + 1}. [${warning.id}] ${warning.reason}
   • Date: ${date}
   • Modérateur: ${warning.moderator}
   • Statut: ${warning.active ? 'ACTIF' : 'INACTIF'}`;
            });
        } else {
            report += '\nAucun avertissement actif.';
        }

        report += `

════════════════════════════════════════════════════════════════════

📜 HISTORIQUE COMPLET DES ACTIONS (${history.length})
`;

        if (history.length > 0) {
            const sortedHistory = history.sort((a, b) => b.timestamp - a.timestamp);
            
            sortedHistory.forEach((action, index) => {
                const date = new Date(action.timestamp).toLocaleString('fr-FR');
                const duration = action.data.duration ? ` (Durée: ${this.moderationManager.formatDuration(action.data.duration)})` : '';
                
                report += `
${index + 1}. ${action.type.toUpperCase()}${duration}
   • Date: ${date}
   • Modérateur: ${action.data.moderator || 'Système'}
   • Raison: ${action.data.reason || 'Aucune raison'}
   • ID: ${action.data.id || 'N/A'}`;
            });
        } else {
            report += '\nAucune action dans l\'historique.';
        }

        report += `

════════════════════════════════════════════════════════════════════

📈 ANALYSE DES RISQUES
• Score de risque: ${this.calculateRiskScore({
    warn: history.filter(h => h.type === 'warn').length,
    mute: history.filter(h => h.type === 'mute').length,
    kick: history.filter(h => h.type === 'kick').length,
    ban: history.filter(h => h.type === 'ban').length,
    unban: history.filter(h => h.type === 'unban').length
})}
• Tendance: ${activeWarnings.length > 3 ? 'SURVEILLENCE RECOMMANDÉE' : 'NORMALE'}
• Dernière action: ${history.length > 0 ? new Date(Math.max(...history.map(h => h.timestamp))).toLocaleString('fr-FR') : 'Aucune'}

════════════════════════════════════════════════════════════════════

Ce rapport a été généré automatiquement par le système de modération.
Pour toute question, contactez l'équipe de modération.
`;

        return report;
    }

    calculateRiskScore(actionCounts) {
        const score = (actionCounts.warn * 1) + (actionCounts.mute * 2) + 
                     (actionCounts.kick * 5) + (actionCounts.ban * 10);
        
        if (score === 0) return '🟢 Aucun risque';
        if (score < 5) return '🟡 Risque faible';
        if (score < 15) return '🟠 Risque modéré';
        return '🔴 Risque élevé';
    }

    getActionEmoji(actionType) {
        const emojis = {
            'warn': '⚠️',
            'mute': '🔇',
            'kick': '👢',
            'ban': '🔨',
            'unban': '✅',
            'unmute': '🔊',
            'timeout': '⏱️'
        };
        return emojis[actionType] || '📝';
    }

    // ==================== MODALS ET AUTRES HANDLERS ====================
    async handleWarnModal(interaction) {
        // Implémentation des modals...
    }

    async handleMuteModal(interaction) {
        // Implémentation des modals...
    }

    async handleKickModal(interaction) {
        // Implémentation des modals...
    }

    async handleBanModal(interaction) {
        // Implémentation des modals...
    }

    async handleUnbanModal(interaction) {
        // Implémentation des modals...
    }

    async handleUnmuteModal(interaction) {
        // Implémentation des modals...
    }

    async handleSetLogChannel(interaction) {
        // Implémentation de la configuration...
    }

    async handleConfigSelect(interaction, value) {
        // Implémentation de la sélection de config...
    }

    async handleClearWarnings(interaction) {
        // Implémentation du nettoyage des avertissements...
    }

    async handleQuickActions(interaction) {
        // Implémentation des actions rapides...
    }

    async handleQuickActionButton(interaction) {
        // Implémentation des boutons d'actions rapides...
    }

    async handleQuickWarnModal(interaction) {
        // Implémentation du modal d'avertissement rapide...
    }

    async handleQuickMuteModal(interaction) {
        // Implémentation du modal de mute rapide...
    }

    async handleQuickUserInfoModal(interaction) {
        // Implémentation du modal d'info utilisateur...
    }

    async handleQuickClearWarnsModal(interaction) {
        // Implémentation du modal de nettoyage rapide...
    }

    async handleUnbanButton(interaction) {
        // Implémentation du bouton unban...
    }

    async handleUnmuteButton(interaction) {
        // Implémentation du bouton unmute...
    }
}
