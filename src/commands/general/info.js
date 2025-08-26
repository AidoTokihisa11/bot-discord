import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import AccessRestriction from '../../utils/AccessRestriction.js';
export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('📋 Afficher les informations détaillées d\'un utilisateur')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur à analyser')
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
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            if (!member) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ **Utilisateur introuvable**')
                    .setDescription('Cet utilisateur n\'est pas membre de ce serveur.')
                    .setColor('#e74c3c');
                    
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            // Calculer les statistiques
            const userStats = await this.calculateUserStats(member, interaction.client.db);
            
            const embed = new EmbedBuilder()
                .setTitle(`📋 **PROFIL UTILISATEUR DÉTAILLÉ**`)
                .setDescription(`**Analyse complète de ${member.user.tag}**`)
                .addFields(
                    {
                        name: '👤 **Informations générales**',
                        value: `**Nom :** ${member.user.tag}\n**ID :** \`${member.user.id}\`\n**Mention :** ${member}\n**Surnom :** ${member.nickname || 'Aucun'}`,
                        inline: true
                    },
                    {
                        name: '📅 **Dates importantes**',
                        value: `**Compte créé :** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n**Rejoint le serveur :** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n**Booster depuis :** ${member.premiumSince ? `<t:${Math.floor(member.premiumSince.getTime() / 1000)}:R>` : 'Non booster'}`,
                        inline: true
                    },
                    {
                        name: '🎭 **Statut et présence**',
                        value: `**Statut :** ${this.getStatusEmoji(member.presence?.status)} ${member.presence?.status || 'offline'}\n**Activité :** ${this.getActivity(member.presence)}\n**Sur mobile :** ${member.presence?.clientStatus?.mobile ? '📱 Oui' : '💻 Non'}`,
                        inline: true
                    },
                    {
                        name: `🏷️ **Rôles (${member.roles.cache.size - 1})**`,
                        value: member.roles.cache.size > 1 
                            ? member.roles.cache
                                .filter(role => role.id !== interaction.guild.id)
                                .sort((a, b) => b.position - a.position)
                                .slice(0, 10)
                                .map(role => `${role}`)
                                .join(' ') + (member.roles.cache.size > 11 ? `\n*... et ${member.roles.cache.size - 11} autre(s)*` : '')
                            : 'Aucun rôle',
                        inline: false
                    },
                    {
                        name: '🛡️ **Permissions clés**',
                        value: this.getKeyPermissions(member),
                        inline: true
                    },
                    {
                        name: '📊 **Statistiques**',
                        value: `**Niveau de confiance :** ${userStats.trustLevel}\n**Score d'activité :** ${userStats.activityScore}/100\n**Antécédents :** ${userStats.moderationHistory}`,
                        inline: true
                    },
                    {
                        name: '🔍 **Analyse comportementale**',
                        value: `**Profil :** ${userStats.behaviorProfile}\n**Risque :** ${userStats.riskLevel}\n**Recommandation :** ${userStats.recommendation}`,
                        inline: true
                    }
                )
                .setColor(member.displayHexColor || '#3498db')
                .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                .setImage('https://i.imgur.com/s74nSIc.png')
                .setTimestamp()
                .setFooter({ 
                    text: `Analyse généré par Team7 Bot • Demandé par ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`user_moderation_${targetUser.id}`)
                        .setLabel('🛡️ Historique modération')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`user_permissions_${targetUser.id}`)
                        .setLabel('🔐 Permissions détaillées')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`user_activity_${targetUser.id}`)
                        .setLabel('📈 Activité détaillée')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`user_refresh_${targetUser.id}`)
                        .setLabel('🔄 Actualiser')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({
                embeds: [embed],
                components: [actionRow]
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des informations:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ **Erreur**')
                .setDescription('Une erreur est survenue lors de la récupération des informations.')
                .setColor('#e74c3c');
                
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async calculateUserStats(member, database) {
        const stats = {
            trustLevel: 'Nouveau',
            activityScore: 50,
            moderationHistory: 'Aucun',
            behaviorProfile: 'Standard',
            riskLevel: '🟢 Faible',
            recommendation: 'Aucune action requise'
        };

        try {
            // Calculer le niveau de confiance basé sur l'ancienneté
            const accountAge = Date.now() - member.user.createdTimestamp;
            const guildAge = Date.now() - member.joinedTimestamp;
            
            if (accountAge > 365 * 24 * 60 * 60 * 1000) { // Plus d'1 an
                stats.trustLevel = 'Expérimenté';
                stats.activityScore += 20;
            } else if (accountAge > 90 * 24 * 60 * 60 * 1000) { // Plus de 3 mois
                stats.trustLevel = 'Confirmé';
                stats.activityScore += 10;
            }

            // Vérifier l'historique de modération
            if (database && database.getUserHistory) {
                const history = await database.getUserHistory(member.user.id);
                if (history && history.length > 0) {
                    const warnings = history.filter(h => h.type === 'warn').length;
                    const serious = history.filter(h => ['kick', 'ban'].includes(h.type)).length;
                    
                    if (serious > 0) {
                        stats.moderationHistory = `${serious} sanction(s) grave(s)`;
                        stats.riskLevel = '🔴 Élevé';
                        stats.recommendation = 'Surveillance recommandée';
                        stats.activityScore -= 30;
                    } else if (warnings > 2) {
                        stats.moderationHistory = `${warnings} avertissement(s)`;
                        stats.riskLevel = '🟡 Modéré';
                        stats.recommendation = 'Attention requise';
                        stats.activityScore -= 15;
                    } else if (warnings > 0) {
                        stats.moderationHistory = `${warnings} avertissement(s) mineur(s)`;
                        stats.activityScore -= 5;
                    }
                }
            }

            // Analyser les rôles et permissions
            if (member.permissions.has('Administrator')) {
                stats.behaviorProfile = 'Administrateur';
                stats.trustLevel = 'Administrateur';
            } else if (member.permissions.has('ModerateMembers')) {
                stats.behaviorProfile = 'Modérateur';
                stats.trustLevel = 'Staff';
            } else if (member.premiumSince) {
                stats.behaviorProfile = 'Booster loyal';
                stats.activityScore += 15;
            }

            // S'assurer que le score reste dans les limites
            stats.activityScore = Math.max(0, Math.min(100, stats.activityScore));

        } catch (error) {
            console.error('Erreur lors du calcul des statistiques:', error);
        }

        return stats;
    },

    getStatusEmoji(status) {
        const emojis = {
            'online': '🟢',
            'idle': '🟡',
            'dnd': '🔴',
            'offline': '⚫'
        };
        return emojis[status] || '❓';
    },

    getActivity(presence) {
        if (!presence?.activities?.length) return 'Aucune activité';
        
        const activity = presence.activities[0];
        const types = {
            0: '🎮 Joue à',
            1: '🎥 Stream',
            2: '🎵 Écoute',
            3: '📺 Regarde',
            5: '🏆 En compétition'
        };
        
        return `${types[activity.type] || '📱'} ${activity.name}`;
    },

    getKeyPermissions(member) {
        const keyPerms = [
            ['Administrator', '👑 Administrateur'],
            ['ManageGuild', '⚙️ Gérer le serveur'],
            ['ModerateMembers', '🛡️ Modérer les membres'],
            ['ManageChannels', '📝 Gérer les salons'],
            ['ManageRoles', '🏷️ Gérer les rôles'],
            ['KickMembers', '👢 Expulser'],
            ['BanMembers', '🔨 Bannir']
        ];

        const userPerms = keyPerms
            .filter(([perm]) => member.permissions.has(perm))
            .map(([, display]) => display);

        return userPerms.length > 0 
            ? userPerms.slice(0, 3).join('\n') + (userPerms.length > 3 ? `\n*... et ${userPerms.length - 3} autre(s)*` : '')
            : 'Permissions de base';
    }
};
