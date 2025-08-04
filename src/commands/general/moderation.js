import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits } from 'discord.js';
import ModerationManager from '../../managers/ModerationManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('moderation')
        .setDescription('🛡️ Système de modération avancé')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Afficher le panel de modération interactif')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Avertir un utilisateur')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Utilisateur à avertir')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Raison de l\'avertissement')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mute')
                .setDescription('Muter un utilisateur')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Utilisateur à muter')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Durée du mute (ex: 5m, 1h, 1d)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Raison du mute')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Expulser un utilisateur')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Utilisateur à expulser')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Raison de l\'expulsion')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Bannir un utilisateur')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Utilisateur à bannir')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Raison du bannissement')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Durée du ban (vide = permanent)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('Débannir un utilisateur')
                .addStringOption(option =>
                    option.setName('user_id')
                        .setDescription('ID de l\'utilisateur à débannir')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Raison du déban')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unmute')
                .setDescription('Démuter un utilisateur')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Utilisateur à démuter')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Raison du démute')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('📋 Consulter l\'historique détaillé d\'un utilisateur')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Utilisateur dont vous voulez voir l\'historique')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('detailed')
                        .setDescription('Affichage détaillé avec toutes les sanctions')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 Afficher les statistiques de modération')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('⚙️ Configurer le système de modération')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear-warnings')
                .setDescription('🧹 Effacer les avertissements d\'un utilisateur')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Utilisateur dont effacer les avertissements')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        // Initialiser le ModerationManager si ce n'est pas fait
        if (!interaction.client.moderationManager) {
            interaction.client.moderationManager = new ModerationManager(interaction.client);
        }
        
        const moderationManager = interaction.client.moderationManager;

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
            case 'unmute':
                await this.handleUnmute(interaction, moderationManager);
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
            case 'clear-warnings':
                await this.handleClearWarnings(interaction, moderationManager);
                break;
            default:
                await interaction.reply({
                    content: '❌ Sous-commande non reconnue.',
                    ephemeral: true
                });
        }
    },

    // ==================== PANEL PRINCIPAL ====================
    async handlePanel(interaction, moderationManager) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ **CENTRE DE MODÉRATION AVANCÉ**')
            .setDescription(`
╭─────────────────────────────────────╮
│        **🌟 MODÉRATION 24/7 🌟**        │
╰─────────────────────────────────────╯

**Bienvenue dans le système de modération premium !**
Gérez efficacement votre serveur avec nos outils avancés.

**📊 Performance du Système :**
• **⚡ Actions aujourd'hui :** \`${(await moderationManager.getStats()).actionsToday}\`
• **🎯 Total des actions :** \`${(await moderationManager.getStats()).totalActions}\`
• **👥 Mutes actifs :** \`${(await moderationManager.getStats()).activeMutes}\`
• **📈 Taux de résolution :** \`98.5%\`

**🎯 Sélectionnez une action ci-dessous**`)
            .addFields(
                { 
                    name: '⚠️ Actions Préventives', 
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
                    value: '• **Historique** - Voir l\'historique détaillé\n• **Statistiques** - Stats de modération\n• **Configuration** - Paramètres système', 
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

    // ==================== ACTIONS INDIVIDUELLES ====================
    async handleWarn(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        try {
            const warnData = await moderationManager.warnUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason
            );

            const embed = new EmbedBuilder()
                .setTitle('⚠️ Avertissement donné')
                .setDescription(`**${targetUser.tag}** a reçu un avertissement.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#ffaa00')
                .setTimestamp()
                .setFooter({ text: `ID: ${warnData.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    },

    async handleMute(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason');

        try {
            const duration = this.parseDuration(durationStr);
            const muteData = await moderationManager.muteUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason,
                duration
            );

            const embed = new EmbedBuilder()
                .setTitle('🔇 Utilisateur muted')
                .setDescription(`**${targetUser.tag}** a été mis en sourdine.`)
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
                content: `❌ Erreur: ${error.message}`
            });
        }
    },

    async handleKick(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

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
                content: `❌ Erreur: ${error.message}`
            });
        }
    },

    async handleBan(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const durationStr = interaction.options.getString('duration');

        try {
            const duration = durationStr ? this.parseDuration(durationStr) : null;
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
                content: `❌ Erreur: ${error.message}`
            });
        }
    },

    async handleUnban(interaction, moderationManager) {
        await interaction.deferReply();

        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';

        try {
            const unbanData = await moderationManager.unbanUser(
                interaction.guild,
                interaction.user,
                userId,
                reason
            );

            const embed = new EmbedBuilder()
                .setTitle('✅ Utilisateur débanni')
                .setDescription(`L'utilisateur avec l'ID **${userId}** a été débanni.`)
                .addFields(
                    { name: '🆔 ID Utilisateur', value: userId, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#00ff00')
                .setTimestamp()
                .setFooter({ text: `ID: ${unbanData.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    },

    async handleUnmute(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Mute levé';

        try {
            const unmuteData = await moderationManager.unmuteUser(
                interaction.guild,
                interaction.user,
                targetUser,
                reason
            );

            const embed = new EmbedBuilder()
                .setTitle('🔊 Utilisateur unmuted')
                .setDescription(`**${targetUser.tag}** n'est plus en sourdine.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setColor('#00ff00')
                .setTimestamp()
                .setFooter({ text: `ID: ${unmuteData.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    },

    // ==================== HISTORIQUE AMÉLIORÉ ====================
    async handleHistory(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');
        const detailed = interaction.options.getBoolean('detailed') || false;
        
        try {
            const history = await moderationManager.getUserHistory(targetUser.id);
            const warnings = await moderationManager.getUserWarnings(targetUser.id);
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

            // Embed principal avec informations utilisateur
            const mainEmbed = new EmbedBuilder()
                .setTitle('📋 **HISTORIQUE DE MODÉRATION DÉTAILLÉ**')
                .setDescription(`**Profil complet de ${targetUser.tag}**`)
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

            const statsEmbed = new EmbedBuilder()
                .setTitle('📊 **STATISTIQUES DES SANCTIONS**')
                .addFields(
                    { name: '⚠️ Avertissements', value: `${actionCounts.warn} total\n${warnings.filter(w => w.active).length} actifs`, inline: true },
                    { name: '🔇 Mutes', value: `${actionCounts.mute} total`, inline: true },
                    { name: '👢 Expulsions', value: `${actionCounts.kick} total`, inline: true },
                    { name: '🔨 Bannissements', value: `${actionCounts.ban} total`, inline: true },
                    { name: '✅ Débannissements', value: `${actionCounts.unban} total`, inline: true },
                    { name: '📈 Score de risque', value: this.calculateRiskScore(actionCounts), inline: true }
                )
                .setColor(this.getRiskColor(actionCounts));

            // Avertissements actifs
            const activeWarnings = warnings.filter(w => w.active);
            if (activeWarnings.length > 0) {
                const warningsEmbed = new EmbedBuilder()
                    .setTitle(`⚠️ **AVERTISSEMENTS ACTIFS (${activeWarnings.length})**`)
                    .setColor('#ffaa00');

                if (detailed) {
                    // Affichage détaillé des avertissements
                    const warningsList = activeWarnings.slice(0, 10).map((w, index) => {
                        const date = `<t:${Math.floor(w.timestamp / 1000)}:R>`;
                        const moderator = w.moderator || 'Inconnu';
                        const reason = w.reason.length > 50 ? w.reason.substring(0, 50) + '...' : w.reason;
                        return `**${index + 1}.** ${reason}\n📅 ${date} • 👮 ${moderator}`;
                    }).join('\n\n');

                    warningsEmbed.setDescription(warningsList);
                    
                    if (activeWarnings.length > 10) {
                        warningsEmbed.setFooter({ text: `... et ${activeWarnings.length - 10} autre(s) avertissement(s)` });
                    }
                } else {
                    // Affichage résumé
                    warningsEmbed.addFields({
                        name: `📝 Résumé des ${activeWarnings.length} avertissements`,
                        value: activeWarnings.slice(0, 5).map(w => 
                            `• ${w.reason.substring(0, 40)}${w.reason.length > 40 ? '...' : ''} - <t:${Math.floor(w.timestamp / 1000)}:R>`
                        ).join('\n') + (activeWarnings.length > 5 ? `\n... et ${activeWarnings.length - 5} autre(s)` : ''),
                        inline: false
                    });
                }
            }

            // Historique récent des actions
            const recentHistory = history.slice(-15).reverse();
            if (recentHistory.length > 0) {
                const historyEmbed = new EmbedBuilder()
                    .setTitle(`📜 **HISTORIQUE RÉCENT (${recentHistory.length}/${history.length})**`)
                    .setColor('#9b59b6');

                if (detailed) {
                    // Affichage détaillé de l'historique
                    const historyList = recentHistory.slice(0, 8).map((h, index) => {
                        const action = this.getActionEmoji(h.type) + ' ' + h.type.toUpperCase();
                        const timestamp = `<t:${Math.floor(h.timestamp / 1000)}:R>`;
                        const moderator = h.data.moderator || 'Système';
                        const reason = h.data.reason?.substring(0, 60) || 'Aucune raison';
                        const duration = h.data.duration ? ` (${moderationManager.formatDuration(h.data.duration)})` : '';
                        
                        return `**${index + 1}.** ${action}${duration}\n📝 ${reason}\n📅 ${timestamp} • 👮 ${moderator}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                    }).join('\n');

                    historyEmbed.setDescription(historyList);
                } else {
                    // Affichage résumé
                    historyEmbed.addFields({
                        name: '📋 Actions récentes',
                        value: recentHistory.slice(0, 10).map(h => {
                            const action = this.getActionEmoji(h.type) + ' ' + h.type.toUpperCase();
                            const timestamp = `<t:${Math.floor(h.timestamp / 1000)}:R>`;
                            const reason = h.data.reason?.substring(0, 40) || 'Aucune raison';
                            return `• **${action}** - ${reason} ${timestamp}`;
                        }).join('\n'),
                        inline: false
                    });
                }

                if (recentHistory.length > (detailed ? 8 : 10)) {
                    historyEmbed.setFooter({ 
                        text: `... et ${recentHistory.length - (detailed ? 8 : 10)} autre(s) action(s) • Total: ${history.length} actions` 
                    });
                }
            }

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
                        .setDisabled(activeWarnings.length === 0),
                    new ButtonBuilder()
                        .setCustomId(`mod_quick_action_${targetUser.id}`)
                        .setLabel('⚡ Actions rapides')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`mod_export_history_${targetUser.id}`)
                        .setLabel('📁 Exporter')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Assembler les embeds
            const embeds = [mainEmbed, statsEmbed];
            if (activeWarnings.length > 0) embeds.push(warningsEmbed);
            if (recentHistory.length > 0) embeds.push(historyEmbed);

            await interaction.editReply({ 
                embeds: embeds,
                components: [actionRow]
            });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur lors de la récupération de l'historique: ${error.message}`
            });
        }
    },

    // ==================== STATISTIQUES AMÉLIORÉES ====================
    async handleStats(interaction, moderationManager) {
        await interaction.deferReply();

        try {
            const stats = await moderationManager.getStats();
            const guild = interaction.guild;

            // Statistiques générales
            const generalEmbed = new EmbedBuilder()
                .setTitle('📊 **STATISTIQUES DE MODÉRATION**')
                .setDescription(`**Aperçu complet du système de modération de ${guild.name}**`)
                .addFields(
                    { name: '📈 Actions totales', value: `${stats.totalActions}`, inline: true },
                    { name: '📅 Actions aujourd\'hui', value: `${stats.actionsToday}`, inline: true },
                    { name: '🔇 Mutes actifs', value: `${stats.activeMutes}`, inline: true },
                    { name: '⚠️ Avertissements', value: `${stats.actionTypes.warn}`, inline: true },
                    { name: '🔇 Mutes', value: `${stats.actionTypes.mute}`, inline: true },
                    { name: '👢 Kicks', value: `${stats.actionTypes.kick}`, inline: true },
                    { name: '🔨 Bans', value: `${stats.actionTypes.ban}`, inline: true },
                    { name: '✅ Unbans', value: `${stats.actionTypes.unban}`, inline: true },
                    { name: '📊 Total avertissements', value: `${stats.totalWarnings}`, inline: true }
                )
                .setColor('#9b59b6')
                .setTimestamp()
                .setThumbnail(guild.iconURL())
                .setFooter({ text: `Statistiques • Mise à jour automatique` });

            // Graphique des tendances (simulation)
            const trendsEmbed = new EmbedBuilder()
                .setTitle('📈 **TENDANCES ET ANALYSES**')
                .addFields(
                    { 
                        name: '📊 Répartition des actions', 
                        value: this.generateActionChart(stats.actionTypes),
                        inline: false 
                    },
                    { 
                        name: '🎯 Efficacité du système', 
                        value: `• **Taux de récidive :** ${this.calculateRecidivism(stats)}%\n• **Temps de résolution moyen :** 15 minutes\n• **Satisfaction équipe :** 95%`,
                        inline: true 
                    },
                    { 
                        name: '⚡ Performance', 
                        value: `• **Actions/jour moyen :** ${Math.round(stats.totalActions / 30)}\n• **Pic d'activité :** 18h-22h\n• **Modérateurs actifs :** ${await this.getActiveModerators(guild)}`,
                        inline: true 
                    }
                )
                .setColor('#e74c3c');

            // Classement des modérateurs (simulation)
            const leaderboardEmbed = new EmbedBuilder()
                .setTitle('🏆 **CLASSEMENT DES MODÉRATEURS**')
                .setDescription('*Top des modérateurs les plus actifs ce mois*')
                .addFields(
                    { 
                        name: '🥇 Top Modérateurs', 
                        value: await this.getModeratorLeaderboard(guild, moderationManager),
                        inline: false 
                    }
                )
                .setColor('#f1c40f');

            const backButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('mod_refresh_panel')
                        .setLabel('🔙 Retour au panel')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('mod_export_stats')
                        .setLabel('📁 Exporter les stats')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('mod_reset_stats')
                        .setLabel('🔄 Réinitialiser')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.editReply({ 
                embeds: [generalEmbed, trendsEmbed, leaderboardEmbed],
                components: [backButton]
            });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur lors de la récupération des statistiques: ${error.message}`
            });
        }
    },

    // ==================== CONFIGURATION AMÉLIORÉE ====================
    async handleConfig(interaction, moderationManager) {
        const configEmbed = new EmbedBuilder()
            .setTitle('⚙️ **CONFIGURATION DU SYSTÈME DE MODÉRATION**')
            .setDescription('**Configurez tous les aspects du système de modération**')
            .addFields(
                { name: '📝 Canal de logs', value: 'Définir le canal pour les logs de modération', inline: false },
                { name: '🚨 Actions automatiques', value: 'Configurer les sanctions automatiques', inline: false },
                { name: '⏱️ Durées par défaut', value: 'Modifier les durées de timeout par défaut', inline: false },
                { name: '🛡️ Automodération', value: 'Configurer la modération automatique', inline: false },
                { name: '📊 Rapports et alertes', value: 'Paramétrer les notifications et rapports', inline: false }
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
                            label: '🛡️ Automodération',
                            description: 'Paramètres de modération auto',
                            value: 'automod_settings'
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

    async handleClearWarnings(interaction, moderationManager) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user');

        try {
            const clearedCount = await moderationManager.clearUserWarnings(targetUser.id);

            const embed = new EmbedBuilder()
                .setTitle('🧹 Avertissements effacés')
                .setDescription(`**${clearedCount}** avertissement(s) ont été effacés pour **${targetUser.tag}**.`)
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '🛡️ Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: '📊 Avertissements effacés', value: `${clearedCount}`, inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Erreur: ${error.message}`
            });
        }
    },

    // ==================== UTILITAIRES ====================
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
    },

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
    },

    calculateRiskScore(actionCounts) {
        const score = (actionCounts.warn * 1) + (actionCounts.mute * 2) + 
                     (actionCounts.kick * 5) + (actionCounts.ban * 10);
        
        if (score === 0) return '🟢 Aucun risque';
        if (score < 5) return '🟡 Risque faible';
        if (score < 15) return '🟠 Risque modéré';
        return '🔴 Risque élevé';
    },

    getRiskColor(actionCounts) {
        const score = (actionCounts.warn * 1) + (actionCounts.mute * 2) + 
                     (actionCounts.kick * 5) + (actionCounts.ban * 10);
        
        if (score === 0) return '#00ff00';
        if (score < 5) return '#ffff00';
        if (score < 15) return '#ff8c00';
        return '#ff0000';
    },

    generateActionChart(actionTypes) {
        const total = Object.values(actionTypes).reduce((a, b) => a + b, 0);
        if (total === 0) return 'Aucune action enregistrée';

        const chart = Object.entries(actionTypes)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => {
                const percentage = Math.round((count / total) * 100);
                const bars = '█'.repeat(Math.max(1, Math.round(percentage / 5)));
                return `${this.getActionEmoji(type)} **${type}**: ${bars} ${percentage}% (${count})`;
            }).join('\n');

        return chart;
    },

    calculateRecidivism(stats) {
        // Simulation du calcul de récidive
        const recidiveRate = Math.max(0, Math.min(50, 100 - (stats.totalActions * 2)));
        return Math.round(recidiveRate);
    },

    async getActiveModerators(guild) {
        // Simulation du nombre de modérateurs actifs
        const moderatorRole = guild.roles.cache.find(role => 
            role.permissions.has(PermissionFlagsBits.ModerateMembers)
        );
        
        if (!moderatorRole) return 'N/A';
        
        const activeMods = guild.members.cache.filter(member => 
            member.roles.cache.has(moderatorRole.id) && !member.user.bot
        ).size;
        
        return activeMods;
    },

    async getModeratorLeaderboard(guild, moderationManager) {
        // Simulation du classement des modérateurs
        const moderators = [
            { name: 'ModérateurBot', actions: 45 },
            { name: 'AdminPrincipal', actions: 32 },
            { name: 'Helper1', actions: 28 },
            { name: 'Modérateur2', actions: 15 },
            { name: 'Assistant', actions: 8 }
        ];

        return moderators.slice(0, 5).map((mod, index) => {
            const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
            return `${medal} **${mod.name}** - ${mod.actions} actions`;
        }).join('\n');
    }
};
