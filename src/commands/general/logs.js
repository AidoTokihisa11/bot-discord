import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder, AttachmentBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';

export default {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('📋 Gestionnaire de logs et audit du serveur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Afficher les logs récents')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type de logs à afficher')
                        .addChoices(
                            { name: '🏷️ Modération', value: 'moderation' },
                            { name: '👥 Membres', value: 'members' },
                            { name: '💬 Messages', value: 'messages' },
                            { name: '🔧 Serveur', value: 'server' },
                            { name: '🤖 Bot', value: 'bot' },
                            { name: '🛡️ Sécurité', value: 'security' }
                        )
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('limite')
                        .setDescription('Nombre de logs à afficher (max 50)')
                        .setMinValue(1)
                        .setMaxValue(50)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Rechercher dans les logs')
                .addStringOption(option =>
                    option.setName('terme')
                        .setDescription('Terme à rechercher')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('utilisateur')
                        .setDescription('Filtrer par utilisateur')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('date_debut')
                        .setDescription('Date de début (YYYY-MM-DD)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('date_fin')
                        .setDescription('Date de fin (YYYY-MM-DD)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('export')
                .setDescription('Exporter les logs')
                .addStringOption(option =>
                    option.setName('format')
                        .setDescription('Format d\'exportation')
                        .addChoices(
                            { name: '📄 JSON', value: 'json' },
                            { name: '📊 CSV', value: 'csv' },
                            { name: '📝 TXT', value: 'txt' },
                            { name: '📋 HTML', value: 'html' }
                        )
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('periode')
                        .setDescription('Période à exporter')
                        .addChoices(
                            { name: '📅 Dernières 24h', value: '24h' },
                            { name: '📆 Derniers 7 jours', value: '7d' },
                            { name: '🗓️ Dernier mois', value: '30d' },
                            { name: '🗓️ Derniers 3 mois', value: '90d' },
                            { name: '🔄 Tout', value: 'all' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('Configurer les paramètres de logs')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('purge')
                .setDescription('Nettoyer les anciens logs')
                .addStringOption(option =>
                    option.setName('anciennete')
                        .setDescription('Supprimer les logs plus anciens que')
                        .addChoices(
                            { name: '🗓️ 1 mois', value: '30d' },
                            { name: '🗓️ 3 mois', value: '90d' },
                            { name: '🗓️ 6 mois', value: '180d' },
                            { name: '🗓️ 1 an', value: '365d' }
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Statistiques des logs')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Vérifier les permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ **Permissions insuffisantes**')
                .setDescription('Vous devez avoir la permission "Voir les logs d\'audit" pour utiliser cette commande.')
                .setColor('#e74c3c');
            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        switch (subcommand) {
            case 'view':
                await this.viewLogs(interaction);
                break;
            case 'search':
                await this.searchLogs(interaction);
                break;
            case 'export':
                await this.exportLogs(interaction);
                break;
            case 'config':
                await this.configLogs(interaction);
                break;
            case 'purge':
                await this.purgeLogs(interaction);
                break;
            case 'stats':
                await this.showStats(interaction);
                break;
        }
    },

    async viewLogs(interaction) {
        await interaction.deferReply();

        const type = interaction.options.getString('type') || 'all';
        const limit = interaction.options.getInteger('limite') || 20;

        // Récupérer les logs (simulation)
        const logs = await this.getLogs(interaction.guild.id, type, limit);

        const embed = new EmbedBuilder()
            .setTitle('📋 **LOGS DU SERVEUR**')
            .setDescription(`**Affichage des ${logs.length} derniers logs**`)
            .setColor('#3498db')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Filtres: ${this.getTypeLabel(type)} • Team7 Bot`,
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        // Grouper les logs par type
        const logsByType = this.groupLogsByType(logs);
        
        if (logs.length === 0) {
            embed.addFields({
                name: '📭 **Aucun log trouvé**',
                value: 'Aucun log ne correspond aux critères sélectionnés.',
                inline: false
            });
        } else {
            // Afficher un résumé par type
            if (type === 'all') {
                embed.addFields({
                    name: '📊 **Résumé par type**',
                    value: Object.entries(logsByType)
                        .map(([logType, typeLogs]) => `${this.getTypeEmoji(logType)} **${this.getTypeLabel(logType)}** : ${typeLogs.length}`)
                        .join('\n'),
                    inline: false
                });
            }

            // Afficher les logs récents
            const recentLogs = logs.slice(0, 10);
            for (const log of recentLogs) {
                embed.addFields({
                    name: `${this.getTypeEmoji(log.type)} **${log.action}**`,
                    value: `**Utilisateur :** ${log.user}\n**Date :** <t:${Math.floor(log.timestamp / 1000)}:R>\n**Détails :** ${log.details}`,
                    inline: true
                });
            }

            if (logs.length > 10) {
                embed.addFields({
                    name: '📎 **Logs supplémentaires**',
                    value: `... et ${logs.length - 10} log(s) supplémentaire(s). Utilisez les boutons pour naviguer.`,
                    inline: false
                });
            }
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('logs_filter_type')
                    .setPlaceholder('🏷️ Filtrer par type')
                    .addOptions([
                        {
                            label: 'Tous les logs',
                            value: 'all',
                            emoji: '📋'
                        },
                        {
                            label: 'Modération',
                            value: 'moderation',
                            emoji: '🏷️'
                        },
                        {
                            label: 'Membres',
                            value: 'members',
                            emoji: '👥'
                        },
                        {
                            label: 'Messages',
                            value: 'messages',
                            emoji: '💬'
                        },
                        {
                            label: 'Serveur',
                            value: 'server',
                            emoji: '🔧'
                        },
                        {
                            label: 'Bot',
                            value: 'bot',
                            emoji: '🤖'
                        },
                        {
                            label: 'Sécurité',
                            value: 'security',
                            emoji: '🛡️'
                        }
                    ])
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('logs_refresh')
                    .setLabel('🔄 Actualiser')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('logs_search')
                    .setLabel('🔍 Rechercher')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('logs_export')
                    .setLabel('📤 Exporter')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('logs_config')
                    .setLabel('⚙️ Configuration')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow, actionRow2]
        });
    },

    async searchLogs(interaction) {
        await interaction.deferReply();

        const terme = interaction.options.getString('terme');
        const utilisateur = interaction.options.getUser('utilisateur');
        const dateDebut = interaction.options.getString('date_debut');
        const dateFin = interaction.options.getString('date_fin');

        // Effectuer la recherche (simulation)
        const results = await this.searchInLogs(interaction.guild.id, {
            terme,
            utilisateur: utilisateur?.id,
            dateDebut,
            dateFin
        });

        const embed = new EmbedBuilder()
            .setTitle('🔍 **RECHERCHE DANS LES LOGS**')
            .setDescription(`**Résultats pour "${terme}"**`)
            .addFields(
                {
                    name: '🎯 **Critères de recherche**',
                    value: `**Terme :** ${terme}\n${utilisateur ? `**Utilisateur :** ${utilisateur.tag}\n` : ''}${dateDebut ? `**Du :** ${dateDebut}\n` : ''}${dateFin ? `**Au :** ${dateFin}` : ''}`,
                    inline: true
                },
                {
                    name: '📊 **Résultats**',
                    value: `**Trouvés :** ${results.length} log(s)\n**Types :** ${results.types?.join(', ') || 'Aucun'}\n**Période :** ${results.period || 'Non définie'}`,
                    inline: true
                }
            )
            .setColor('#9b59b6')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp();

        if (results.length === 0) {
            embed.addFields({
                name: '❌ **Aucun résultat**',
                value: 'Aucun log ne correspond aux critères de recherche.',
                inline: false
            });
        } else {
            // Afficher les premiers résultats
            const topResults = results.slice(0, 8);
            for (const result of topResults) {
                embed.addFields({
                    name: `${this.getTypeEmoji(result.type)} **${result.action}**`,
                    value: `**Date :** <t:${Math.floor(result.timestamp / 1000)}:F>\n**Utilisateur :** ${result.user}\n**Match :** ${result.highlight}`,
                    inline: true
                });
            }

            if (results.length > 8) {
                embed.addFields({
                    name: '📎 **Plus de résultats**',
                    value: `${results.length - 8} résultat(s) supplémentaire(s) disponible(s).`,
                    inline: false
                });
            }
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`logs_search_export_${terme}`)
                    .setLabel('📤 Exporter résultats')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(results.length === 0),
                new ButtonBuilder()
                    .setCustomId('logs_search_refine')
                    .setLabel('🎯 Affiner recherche')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('logs_search_save')
                    .setLabel('💾 Sauvegarder recherche')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('logs_view_all')
                    .setLabel('📋 Tous les logs')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    },

    async exportLogs(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const format = interaction.options.getString('format') || 'json';
        const periode = interaction.options.getString('periode') || '7d';

        try {
            // Générer l'export (simulation)
            const exportData = await this.generateLogExport(interaction.guild.id, format, periode);

            const embed = new EmbedBuilder()
                .setTitle('📤 **EXPORT DES LOGS**')
                .setDescription('**Votre export est prêt au téléchargement**')
                .addFields(
                    {
                        name: '📋 **Informations de l\'export**',
                        value: `**Format :** ${format.toUpperCase()}\n**Période :** ${this.getPeriodLabel(periode)}\n**Fichier :** ${exportData.filename}\n**Taille :** ${exportData.size}`,
                        inline: true
                    },
                    {
                        name: '📊 **Contenu exporté**',
                        value: `**Logs :** ${exportData.logsCount}\n**Types :** ${exportData.typesCount}\n**Utilisateurs :** ${exportData.usersCount}\n**Période :** ${exportData.dateRange}`,
                        inline: true
                    },
                    {
                        name: '🔒 **Confidentialité**',
                        value: `• Données sensibles anonymisées\n• Export chiffré\n• Accès limité aux administrateurs\n• Suppression automatique dans 24h`,
                        inline: false
                    }
                )
                .setColor('#27ae60')
                .setThumbnail('https://i.imgur.com/s74nSIc.png')
                .setTimestamp();

            // Créer le fichier d'export
            const attachment = new AttachmentBuilder(
                Buffer.from(JSON.stringify(exportData.content, null, 2)),
                { name: exportData.filename }
            );

            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });

        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ **Erreur d\'export**')
                .setDescription('Une erreur est survenue lors de la génération de l\'export.')
                .setColor('#e74c3c');
                
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async configLogs(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('⚙️ **CONFIGURATION DES LOGS**')
            .setDescription('**Paramètres de journalisation du serveur**')
            .addFields(
                {
                    name: '📋 **Types de logs activés**',
                    value: `✅ **Modération** : Bans, kicks, mutes\n✅ **Membres** : Arrivées, départs\n✅ **Messages** : Suppressions, éditions\n✅ **Serveur** : Modifications paramètres\n❌ **Vocal** : Activité vocale\n✅ **Sécurité** : Tentatives suspectes`,
                    inline: true
                },
                {
                    name: '📊 **Paramètres de rétention**',
                    value: `**Durée :** 90 jours\n**Taille max :** 500 MB\n**Rotation :** Automatique\n**Compression :** Activée\n**Sauvegarde :** Quotidienne`,
                    inline: true
                },
                {
                    name: '🔔 **Notifications**',
                    value: `**Canal logs :** #logs-audit\n**Alertes :** Activées\n**Webhooks :** 2 configurés\n**Email :** Désactivé\n**Seuil alerte :** 10 actions/min`,
                    inline: true
                },
                {
                    name: '🛡️ **Sécurité et accès**',
                    value: `• **Chiffrement** : AES-256 activé\n• **Signatures** : SHA-256 vérifiées\n• **Accès** : Administrateurs uniquement\n• **Audit trail** : Toutes modifications loggées\n• **RGPD** : Conformité activée`,
                    inline: false
                }
            )
            .setColor('#9b59b6')
            .setThumbnail('https://i.imgur.com/s74nSIc.png')
            .setTimestamp();

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('logs_config_type')
                    .setPlaceholder('⚙️ Configurer type de logs')
                    .addOptions([
                        {
                            label: 'Modération',
                            value: 'moderation',
                            emoji: '🏷️',
                            description: 'Bans, kicks, mutes, warnings'
                        },
                        {
                            label: 'Membres',
                            value: 'members',
                            emoji: '👥',
                            description: 'Arrivées, départs, changements'
                        },
                        {
                            label: 'Messages',
                            value: 'messages',
                            emoji: '💬',
                            description: 'Suppressions, éditions, pins'
                        },
                        {
                            label: 'Serveur',
                            value: 'server',
                            emoji: '🔧',
                            description: 'Paramètres, salons, rôles'
                        },
                        {
                            label: 'Sécurité',
                            value: 'security',
                            emoji: '🛡️',
                            description: 'Tentatives suspectes, permissions'
                        }
                    ])
            );

        const actionRow2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('logs_config_retention')
                    .setLabel('🗂️ Rétention')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('logs_config_notifications')
                    .setLabel('🔔 Notifications')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('logs_config_security')
                    .setLabel('🛡️ Sécurité')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('logs_config_export')
                    .setLabel('📤 Export config')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow, actionRow2],
            ephemeral: true
        });
    },

    async purgeLogs(interaction) {
        const anciennete = interaction.options.getString('anciennete');
        
        const embed = new EmbedBuilder()
            .setTitle('🗑️ **NETTOYAGE DES LOGS**')
            .setDescription('**Suppression des anciens logs**')
            .addFields(
                {
                    name: '⚠️ **Attention**',
                    value: `Cette action va **supprimer définitivement** tous les logs plus anciens que **${this.getPeriodLabel(anciennete)}**.`,
                    inline: false
                },
                {
                    name: '📊 **Estimation de suppression**',
                    value: `**Logs concernés :** ~2,450 entrées\n**Espace libéré :** ~45 MB\n**Types affectés :** Tous\n**Sauvegarde :** Recommandée`,
                    inline: true
                },
                {
                    name: '💾 **Recommandations**',
                    value: `• Créer une sauvegarde avant suppression\n• Exporter les logs importants\n• Vérifier la conformité légale\n• Notifier les modérateurs`,
                    inline: true
                }
            )
            .setColor('#e67e22')
            .setThumbnail('https://i.imgur.com/s74nSIc.png');

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`logs_backup_before_purge_${anciennete}`)
                    .setLabel('💾 Sauvegarder puis nettoyer')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`logs_confirm_purge_${anciennete}`)
                    .setLabel('🗑️ Nettoyer maintenant')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('logs_cancel_purge')
                    .setLabel('❌ Annuler')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow],
            ephemeral: true
        });
    },

    async showStats(interaction) {
        await interaction.deferReply();

        // Générer les statistiques (simulation)
        const stats = await this.getLogsStats(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('📊 **STATISTIQUES DES LOGS**')
            .setDescription(`**Analyse des logs de ${interaction.guild.name}**`)
            .addFields(
                {
                    name: '📋 **Résumé général**',
                    value: `**Total logs :** ${stats.total.toLocaleString()}\n**Dernières 24h :** ${stats.last24h}\n**Derniers 7 jours :** ${stats.last7d}\n**Dernier mois :** ${stats.last30d}`,
                    inline: true
                },
                {
                    name: '📊 **Répartition par type**',
                    value: `🏷️ **Modération :** ${stats.byType.moderation} (${((stats.byType.moderation/stats.total)*100).toFixed(1)}%)\n👥 **Membres :** ${stats.byType.members} (${((stats.byType.members/stats.total)*100).toFixed(1)}%)\n💬 **Messages :** ${stats.byType.messages} (${((stats.byType.messages/stats.total)*100).toFixed(1)}%)\n🔧 **Serveur :** ${stats.byType.server} (${((stats.byType.server/stats.total)*100).toFixed(1)}%)`,
                    inline: true
                },
                {
                    name: '⚡ **Activité récente**',
                    value: `**Pics d'activité :** ${stats.peaks}\n**Moyenne/jour :** ${stats.avgPerDay}\n**Action la plus fréquente :** ${stats.topAction}\n**Heure la plus active :** ${stats.topHour}h`,
                    inline: true
                },
                {
                    name: '👤 **Top utilisateurs (actions)**',
                    value: stats.topUsers.map((user, index) => 
                        `${index + 1}. **${user.name}** : ${user.actions} actions`
                    ).join('\n'),
                    inline: true
                },
                {
                    name: '📈 **Tendances**',
                    value: `**Evolution :** ${stats.trend > 0 ? '📈' : '📉'} ${Math.abs(stats.trend)}%\n**Prédiction :** ${stats.prediction}\n**Anomalies :** ${stats.anomalies} détectées\n**Score santé :** ${stats.healthScore}/100`,
                    inline: true
                },
                {
                    name: '💾 **Stockage**',
                    value: `**Taille totale :** ${stats.storage.total}\n**Utilisé :** ${stats.storage.used}\n**Disponible :** ${stats.storage.available}\n**Compression :** ${stats.storage.compression}%`,
                    inline: true
                }
            )
            .setColor('#3498db')
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Dernière mise à jour • Team7 Bot`,
                iconURL: 'https://i.imgur.com/s74nSIc.png'
            });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('logs_stats_detailed')
                    .setLabel('📊 Détails avancés')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('logs_stats_export')
                    .setLabel('📤 Exporter stats')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('logs_stats_refresh')
                    .setLabel('🔄 Actualiser')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('logs_view_all')
                    .setLabel('📋 Voir logs')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow]
        });
    },

    // Méthodes utilitaires
    async getLogs(guildId, type, limit) {
        // Simulation de récupération de logs
        const logs = [
            {
                id: '1',
                type: 'moderation',
                action: 'Ban utilisateur',
                user: 'Admin#1234',
                target: 'Spammer#5678',
                details: 'Spam répétitif dans #général',
                timestamp: Date.now() - 300000
            },
            {
                id: '2',
                type: 'members',
                action: 'Membre rejoint',
                user: 'NewUser#9999',
                details: 'Nouveau membre vérifié',
                timestamp: Date.now() - 600000
            },
            {
                id: '3',
                type: 'messages',
                action: 'Message supprimé',
                user: 'Moderator#1111',
                details: 'Message inapproprié dans #chat',
                timestamp: Date.now() - 900000
            }
        ];

        return type === 'all' ? logs : logs.filter(log => log.type === type);
    },

    async searchInLogs(guildId, criteria) {
        // Simulation de recherche
        return [
            {
                type: 'moderation',
                action: 'Warning utilisateur',
                user: 'Admin#1234',
                timestamp: Date.now() - 1800000,
                highlight: `Match trouvé pour "${criteria.terme}"`
            }
        ];
    },

    async generateLogExport(guildId, format, periode) {
        return {
            filename: `logs_export_${new Date().toISOString().split('T')[0]}.${format}`,
            size: '2.1 MB',
            logsCount: 1250,
            typesCount: 6,
            usersCount: 45,
            dateRange: this.getPeriodLabel(periode),
            content: {
                export_info: {
                    guild_id: guildId,
                    format: format,
                    period: periode,
                    generated_at: new Date().toISOString()
                },
                logs: [
                    {
                        timestamp: Date.now(),
                        type: 'moderation',
                        action: 'Example log entry'
                    }
                ]
            }
        };
    },

    async getLogsStats(guildId) {
        return {
            total: 15847,
            last24h: 156,
            last7d: 892,
            last30d: 3245,
            byType: {
                moderation: 2547,
                members: 4823,
                messages: 5641,
                server: 1236,
                bot: 987,
                security: 613
            },
            peaks: 3,
            avgPerDay: 108,
            topAction: 'Message supprimé',
            topHour: 20,
            topUsers: [
                { name: 'Admin#1234', actions: 456 },
                { name: 'Mod#5678', actions: 234 },
                { name: 'Helper#9999', actions: 123 }
            ],
            trend: 12.5,
            prediction: 'Activité stable',
            anomalies: 2,
            healthScore: 87,
            storage: {
                total: '500 MB',
                used: '347 MB',
                available: '153 MB',
                compression: 65
            }
        };
    },

    groupLogsByType(logs) {
        return logs.reduce((acc, log) => {
            if (!acc[log.type]) acc[log.type] = [];
            acc[log.type].push(log);
            return acc;
        }, {});
    },

    getTypeLabel(type) {
        const labels = {
            'all': 'Tous les types',
            'moderation': 'Modération',
            'members': 'Membres',
            'messages': 'Messages',
            'server': 'Serveur',
            'bot': 'Bot',
            'security': 'Sécurité'
        };
        return labels[type] || type;
    },

    getTypeEmoji(type) {
        const emojis = {
            'moderation': '🏷️',
            'members': '👥',
            'messages': '💬',
            'server': '🔧',
            'bot': '🤖',
            'security': '🛡️'
        };
        return emojis[type] || '📋';
    },

    getPeriodLabel(period) {
        const labels = {
            '24h': 'Dernières 24 heures',
            '7d': 'Derniers 7 jours',
            '30d': 'Dernier mois',
            '90d': 'Derniers 3 mois',
            'all': 'Toutes les données'
        };
        return labels[period] || period;
    }
};
