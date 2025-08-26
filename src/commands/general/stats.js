import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 Afficher les statistiques complètes du serveur')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de statistiques à afficher')
                .addChoices(
                    { name: '📊 Vue d\'ensemble', value: 'overview' },
                    { name: '👥 Membres', value: 'members' },
                    { name: '💬 Activité', value: 'activity' },
                    { name: '🛡️ Modération', value: 'moderation' },
                    { name: '📈 Croissance', value: 'growth' }
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        // === VÉRIFICATION D'ACCÈS GLOBALE ===
        const accessRestriction = new AccessRestriction();
        const hasAccess = await accessRestriction.checkAccess(interaction);
        if (!hasAccess) {
            return; // Accès refusé, message déjà envoyé
        }


        await interaction.deferReply();

        try {
            const statsType = interaction.options.getString('type') || 'overview';
            const guild = interaction.guild;
            
            // Calculer les statistiques complètes
            const stats = await this.calculateGuildStats(guild, interaction.client.db);
            
            let embed;
            
            switch (statsType) {
                case 'members':
                    embed = this.createMembersEmbed(guild, stats);
                    break;
                case 'activity':
                    embed = this.createActivityEmbed(guild, stats);
                    break;
                case 'moderation':
                    embed = this.createModerationEmbed(guild, stats);
                    break;
                case 'growth':
                    embed = this.createGrowthEmbed(guild, stats);
                    break;
                default:
                    embed = this.createOverviewEmbed(guild, stats);
            }

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('stats_overview')
                        .setLabel('📊 Vue d\'ensemble')
                        .setStyle(statsType === 'overview' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('stats_members')
                        .setLabel('👥 Membres')
                        .setStyle(statsType === 'members' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('stats_activity')
                        .setLabel('💬 Activité')
                        .setStyle(statsType === 'activity' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('stats_moderation')
                        .setLabel('🛡️ Modération')
                        .setStyle(statsType === 'moderation' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                );

            const actionRow2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('stats_growth')
                        .setLabel('📈 Croissance')
                        .setStyle(statsType === 'growth' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('stats_export')
                        .setLabel('📥 Exporter')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('stats_refresh')
                        .setLabel('🔄 Actualiser')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({
                embeds: [embed],
                components: [actionRow, actionRow2]
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ **Erreur**')
                .setDescription('Une erreur est survenue lors de la récupération des statistiques.')
                .setColor('#e74c3c');
                
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async calculateGuildStats(guild, database) {
        const stats = {
            // Statistiques des membres
            totalMembers: guild.memberCount,
            humans: 0,
            bots: 0,
            online: 0,
            offline: 0,
            
            // Statistiques des rôles et permissions
            totalRoles: guild.roles.cache.size,
            admins: 0,
            moderators: 0,
            boosters: guild.premiumSubscriptionCount || 0,
            
            // Statistiques des salons
            totalChannels: guild.channels.cache.size,
            textChannels: guild.channels.cache.filter(c => c.type === 0).size,
            voiceChannels: guild.channels.cache.filter(c => c.type === 2).size,
            categories: guild.channels.cache.filter(c => c.type === 4).size,
            
            // Statistiques temporelles
            createdAt: guild.createdTimestamp,
            age: Date.now() - guild.createdTimestamp,
            
            // Statistiques de modération (si disponible)
            moderationActions: {
                total: 0,
                warns: 0,
                kicks: 0,
                bans: 0,
                mutes: 0
            },
            
            // Statistiques d'activité
            activityScore: 0,
            engagement: 'Modéré'
        };

        try {
            // Analyser les membres (limité pour éviter les timeouts)
            const members = await guild.members.fetch({ limit: 1000 });
            
            members.forEach(member => {
                if (member.user.bot) {
                    stats.bots++;
                } else {
                    stats.humans++;
                }
                
                if (member.presence?.status === 'online' || member.presence?.status === 'idle' || member.presence?.status === 'dnd') {
                    stats.online++;
                } else {
                    stats.offline++;
                }
                
                if (member.permissions.has('Administrator')) {
                    stats.admins++;
                } else if (member.permissions.has('ModerateMembers')) {
                    stats.moderators++;
                }
            });

            // Récupérer les statistiques de modération
            if (database && database.getModerationStats) {
                const modStats = await database.getModerationStats(guild.id);
                if (modStats) {
                    stats.moderationActions = modStats;
                }
            }

            // Calculer le score d'engagement
            const onlineRatio = stats.online / stats.totalMembers;
            const boosterRatio = stats.boosters / stats.totalMembers;
            stats.activityScore = Math.round((onlineRatio * 60 + boosterRatio * 40) * 100);
            
            if (stats.activityScore > 75) {
                stats.engagement = 'Très élevé';
            } else if (stats.activityScore > 50) {
                stats.engagement = 'Élevé';
            } else if (stats.activityScore > 25) {
                stats.engagement = 'Modéré';
            } else {
                stats.engagement = 'Faible';
            }

        } catch (error) {
            console.error('Erreur lors du calcul des statistiques:', error);
        }

        return stats;
    },

    createOverviewEmbed(guild, stats) {
        return new EmbedBuilder()
            .setTitle(`📊 **STATISTIQUES GÉNÉRALES**`)
            .setDescription(`**Aperçu complet de ${guild.name}**`)
            .addFields(
                {
                    name: '👥 **Membres**',
                    value: `**Total :** ${stats.totalMembers.toLocaleString()}\n**Humains :** ${stats.humans.toLocaleString()}\n**Bots :** ${stats.bots.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🟢 **Présence**',
                    value: `**En ligne :** ${stats.online.toLocaleString()}\n**Hors ligne :** ${stats.offline.toLocaleString()}\n**Taux :** ${Math.round((stats.online / stats.totalMembers) * 100)}%`,
                    inline: true
                },
                {
                    name: '📈 **Engagement**',
                    value: `**Score :** ${stats.activityScore}/100\n**Niveau :** ${stats.engagement}\n**Boosters :** ${stats.boosters.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🏷️ **Structure**',
                    value: `**Rôles :** ${stats.totalRoles.toLocaleString()}\n**Admins :** ${stats.admins.toLocaleString()}\n**Modérateurs :** ${stats.moderators.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '📝 **Salons**',
                    value: `**Total :** ${stats.totalChannels.toLocaleString()}\n**Texte :** ${stats.textChannels.toLocaleString()}\n**Vocal :** ${stats.voiceChannels.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🛡️ **Modération**',
                    value: `**Actions totales :** ${stats.moderationActions.total.toLocaleString()}\n**Avertissements :** ${stats.moderationActions.warns.toLocaleString()}\n**Sanctions :** ${(stats.moderationActions.kicks + stats.moderationActions.bans).toLocaleString()}`,
                    inline: true
                },
                {
                    name: '📅 **Informations temporelles**',
                    value: `**Créé :** <t:${Math.floor(stats.createdAt / 1000)}:R>\n**Âge :** ${Math.floor(stats.age / (1000 * 60 * 60 * 24))} jours\n**Niveau :** ${guild.premiumTier} ⭐`,
                    inline: false
                }
            )
            .setColor('#3498db')
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Statistiques générées par Team7 Bot • ${guild.name}`,
                iconURL: guild.iconURL()
            });
    },

    createMembersEmbed(guild, stats) {
        const humanPercentage = Math.round((stats.humans / stats.totalMembers) * 100);
        const onlinePercentage = Math.round((stats.online / stats.totalMembers) * 100);
        
        return new EmbedBuilder()
            .setTitle(`👥 **STATISTIQUES DES MEMBRES**`)
            .setDescription(`**Analyse détaillée de la communauté**`)
            .addFields(
                {
                    name: '📊 **Répartition générale**',
                    value: `**Total :** ${stats.totalMembers.toLocaleString()} membres\n**Humains :** ${stats.humans.toLocaleString()} (${humanPercentage}%)\n**Bots :** ${stats.bots.toLocaleString()} (${100-humanPercentage}%)`,
                    inline: true
                },
                {
                    name: '🟢 **Statut de présence**',
                    value: `**Actifs :** ${stats.online.toLocaleString()} (${onlinePercentage}%)\n**Inactifs :** ${stats.offline.toLocaleString()} (${100-onlinePercentage}%)\n**Ratio activité :** ${onlinePercentage > 50 ? '🟢 Excellent' : onlinePercentage > 25 ? '🟡 Bon' : '🔴 Faible'}`,
                    inline: true
                },
                {
                    name: '🏆 **Membres privilégiés**',
                    value: `**Boosters :** ${stats.boosters.toLocaleString()}\n**Admins :** ${stats.admins.toLocaleString()}\n**Modérateurs :** ${stats.moderators.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '📈 **Analyse d\'engagement**',
                    value: `**Score global :** ${stats.activityScore}/100\n**Niveau :** ${stats.engagement}\n**Qualité :** ${stats.activityScore > 75 ? '🌟 Exceptionnelle' : stats.activityScore > 50 ? '✨ Très bonne' : stats.activityScore > 25 ? '👍 Correcte' : '⚠️ À améliorer'}`,
                    inline: false
                }
            )
            .setColor('#2ecc71')
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Analyse des membres • Team7 Bot`,
                iconURL: guild.iconURL()
            });
    },

    createActivityEmbed(guild, stats) {
        return new EmbedBuilder()
            .setTitle(`💬 **STATISTIQUES D'ACTIVITÉ**`)
            .setDescription(`**Mesure de l'engagement communautaire**`)
            .addFields(
                {
                    name: '📊 **Indicateurs principaux**',
                    value: `**Score d'activité :** ${stats.activityScore}/100\n**Niveau d'engagement :** ${stats.engagement}\n**Tendance :** ${stats.activityScore > 60 ? '📈 Croissante' : stats.activityScore > 40 ? '📊 Stable' : '📉 Décroissante'}`,
                    inline: true
                },
                {
                    name: '🟢 **Présence temps réel**',
                    value: `**Membres actifs :** ${stats.online.toLocaleString()}\n**Taux de présence :** ${Math.round((stats.online / stats.totalMembers) * 100)}%\n**Statut :** ${stats.online > stats.totalMembers * 0.3 ? '🔥 Très actif' : stats.online > stats.totalMembers * 0.15 ? '⚡ Actif' : '😴 Calme'}`,
                    inline: true
                },
                {
                    name: '🏆 **Engagement premium**',
                    value: `**Boosters :** ${stats.boosters.toLocaleString()}\n**Taux de boost :** ${Math.round((stats.boosters / stats.totalMembers) * 100)}%\n**Niveau serveur :** ${guild.premiumTier} ⭐`,
                    inline: true
                },
                {
                    name: '📈 **Métriques de qualité**',
                    value: `**Ratio Humains/Bots :** ${Math.round((stats.humans / stats.bots) * 100) / 100}\n**Diversité des rôles :** ${stats.totalRoles} rôles\n**Structure :** ${stats.totalChannels} salons`,
                    inline: false
                }
            )
            .setColor('#f39c12')
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Analyse d'activité • Team7 Bot`,
                iconURL: guild.iconURL()
            });
    },

    createModerationEmbed(guild, stats) {
        const totalActions = stats.moderationActions.total;
        const warnPercentage = totalActions > 0 ? Math.round((stats.moderationActions.warns / totalActions) * 100) : 0;
        
        return new EmbedBuilder()
            .setTitle(`🛡️ **STATISTIQUES DE MODÉRATION**`)
            .setDescription(`**Aperçu des actions de modération**`)
            .addFields(
                {
                    name: '📊 **Actions totales**',
                    value: `**Total :** ${totalActions.toLocaleString()}\n**Moyenne/jour :** ${Math.round(totalActions / Math.max(1, Math.floor(stats.age / (1000 * 60 * 60 * 24))))}\n**Efficacité :** ${totalActions < stats.totalMembers * 0.1 ? '🟢 Excellente' : totalActions < stats.totalMembers * 0.3 ? '🟡 Bonne' : '🔴 Attention'}`,
                    inline: true
                },
                {
                    name: '⚠️ **Avertissements**',
                    value: `**Total :** ${stats.moderationActions.warns.toLocaleString()}\n**Pourcentage :** ${warnPercentage}%\n**Statut :** ${warnPercentage > 70 ? '🟢 Préventif' : warnPercentage > 40 ? '🟡 Équilibré' : '🔴 Sévère'}`,
                    inline: true
                },
                {
                    name: '🚫 **Sanctions graves**',
                    value: `**Expulsions :** ${stats.moderationActions.kicks.toLocaleString()}\n**Bannissements :** ${stats.moderationActions.bans.toLocaleString()}\n**Mutes :** ${stats.moderationActions.mutes.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '👮 **Équipe de modération**',
                    value: `**Administrateurs :** ${stats.admins.toLocaleString()}\n**Modérateurs :** ${stats.moderators.toLocaleString()}\n**Ratio staff/membres :** 1/${Math.round(stats.totalMembers / Math.max(1, stats.admins + stats.moderators))}`,
                    inline: false
                }
            )
            .setColor('#e74c3c')
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Statistiques de modération • Team7 Bot`,
                iconURL: guild.iconURL()
            });
    },

    createGrowthEmbed(guild, stats) {
        const dailyGrowth = Math.round(stats.totalMembers / Math.max(1, Math.floor(stats.age / (1000 * 60 * 60 * 24))));
        const monthlyProjection = dailyGrowth * 30;
        
        return new EmbedBuilder()
            .setTitle(`📈 **STATISTIQUES DE CROISSANCE**`)
            .setDescription(`**Analyse de l'évolution du serveur**`)
            .addFields(
                {
                    name: '🕐 **Données temporelles**',
                    value: `**Âge du serveur :** ${Math.floor(stats.age / (1000 * 60 * 60 * 24))} jours\n**Créé le :** <t:${Math.floor(stats.createdAt / 1000)}:D>\n**Maturité :** ${stats.age > 365 * 24 * 60 * 60 * 1000 ? '🌟 Établi' : stats.age > 90 * 24 * 60 * 60 * 1000 ? '🌱 En développement' : '🌰 Nouveau'}`,
                    inline: true
                },
                {
                    name: '📊 **Croissance moyenne**',
                    value: `**Membres/jour :** ${dailyGrowth.toLocaleString()}\n**Projection mensuelle :** +${monthlyProjection.toLocaleString()}\n**Tendance :** ${dailyGrowth > 5 ? '🚀 Rapide' : dailyGrowth > 1 ? '📈 Stable' : '📉 Lente'}`,
                    inline: true
                },
                {
                    name: '🏆 **Milestones**',
                    value: `**Niveau actuel :** ${stats.totalMembers.toLocaleString()} membres\n**Prochain objectif :** ${this.getNextMilestone(stats.totalMembers).toLocaleString()}\n**Progression :** ${Math.round((stats.totalMembers / this.getNextMilestone(stats.totalMembers)) * 100)}%`,
                    inline: true
                },
                {
                    name: '🎯 **Objectifs de qualité**',
                    value: `**Score d'engagement :** ${stats.activityScore}/100\n**Qualité communauté :** ${stats.activityScore > 75 ? '🌟 Premium' : stats.activityScore > 50 ? '✨ Excellente' : stats.activityScore > 25 ? '👍 Bonne' : '⚠️ À améliorer'}\n**Potentiel :** ${stats.activityScore > 60 ? '🔥 Très élevé' : stats.activityScore > 40 ? '⚡ Élevé' : '💪 En développement'}`,
                    inline: false
                }
            )
            .setColor('#9b59b6')
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setImage('https://i.imgur.com/s74nSIc.png')
            .setTimestamp()
            .setFooter({ 
                text: `Analyse de croissance • Team7 Bot`,
                iconURL: guild.iconURL()
            });
    },

    getNextMilestone(current) {
        const milestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
        return milestones.find(m => m > current) || current + 100000;
    }
};
