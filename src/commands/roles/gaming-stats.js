import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import Logger from '../../utils/Logger.js';

const logger = new Logger();

export default {
    data: new SlashCommandBuilder()
        .setName('gaming-stats')
        .setDescription('📊 Affiche les statistiques détaillées des rôles gaming')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('Voir les statistiques d\'un utilisateur spécifique')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('période')
                .setDescription('Période pour les statistiques')
                .setRequired(false)
                .addChoices(
                    { name: '7 derniers jours', value: '7d' },
                    { name: '30 derniers jours', value: '30d' },
                    { name: '90 derniers jours', value: '90d' },
                    { name: 'Tout le temps', value: 'all' }
                )
        ),

    async execute(interaction, client) {
        try {
            // Vérifier les permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.reply({
                    content: '❌ Vous devez avoir la permission "Gérer les rôles" pour utiliser cette commande.',
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // Vérifier que le gestionnaire gaming existe
            if (!client.gamingRoleManager) {
                return await interaction.editReply({
                    content: '❌ Le gestionnaire de rôles gaming n\'est pas initialisé.'
                });
            }

            const targetUser = interaction.options.getUser('utilisateur');
            const period = interaction.options.getString('période') || '30d';

            // Calculer la date de début selon la période
            let startDate;
            switch (period) {
                case '7d':
                    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90d':
                    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case 'all':
                default:
                    startDate = new Date(0);
                    break;
            }

            if (targetUser) {
                // Statistiques pour un utilisateur spécifique
                await this.showUserStats(interaction, client, targetUser, startDate, period);
            } else {
                // Statistiques générales du serveur
                await this.showServerStats(interaction, client, startDate, period);
            }

        } catch (error) {
            logger.error('Erreur dans gaming-stats:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('❌ **ERREUR**')
                .setDescription('Une erreur est survenue lors de la récupération des statistiques.')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    async showServerStats(interaction, client, startDate, period) {
        try {
            // Récupérer les statistiques gaming
            const stats = await client.gamingRoleManager.getGamingStats(interaction.guild.id);
            
            if (!stats) {
                return await interaction.editReply({
                    content: '❌ Aucune statistique disponible.'
                });
            }

            // Filtrer les actions selon la période
            const allActions = client.db.data.gamingRoles?.userActions || [];
            const filteredActions = allActions.filter(action => 
                action.guildId === interaction.guild.id &&
                new Date(action.timestamp) >= startDate
            );

            // Calculer les statistiques globales
            const totalActions = filteredActions.length;
            const totalAdds = filteredActions.filter(a => a.action === 'add').length;
            const totalRemoves = filteredActions.filter(a => a.action === 'remove').length;
            const uniqueUsers = new Set(filteredActions.map(a => a.userId)).size;

            // Trouver le jeu le plus populaire
            const gamePopularity = {};
            for (const action of filteredActions) {
                if (!gamePopularity[action.gameKey]) {
                    gamePopularity[action.gameKey] = 0;
                }
                gamePopularity[action.gameKey]++;
            }

            const mostPopularGame = Object.entries(gamePopularity)
                .sort(([,a], [,b]) => b - a)[0];

            // Créer l'embed principal
            const mainEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📊 **STATISTIQUES GAMING DU SERVEUR**')
                .setDescription(`Statistiques pour la période : **${this.getPeriodLabel(period)}**`)
                .addFields(
                    {
                        name: '📈 **Actions Totales**',
                        value: `\`\`\`
🔢 Total: ${totalActions}
➕ Ajouts: ${totalAdds}
➖ Retraits: ${totalRemoves}
👥 Utilisateurs uniques: ${uniqueUsers}
\`\`\``,
                        inline: false
                    }
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({ 
                    text: `${interaction.guild.name} • Statistiques Gaming`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();

            if (mostPopularGame) {
                const gameConfig = client.gamingRoleManager.GAMING_CONFIG[mostPopularGame[0]];
                if (gameConfig) {
                    mainEmbed.addFields({
                        name: '🏆 **Jeu le Plus Populaire**',
                        value: `${gameConfig.emoji} **${gameConfig.name}**\n\`${mostPopularGame[1]} actions\``,
                        inline: true
                    });
                }
            }

            // Créer l'embed des détails par jeu
            const gamesEmbed = new EmbedBuilder()
                .setColor(0x00D4AA)
                .setTitle('🎮 **DÉTAILS PAR JEU**');

            const gameFields = [];
            for (const [gameKey, gameStats] of Object.entries(stats)) {
                const gameActions = filteredActions.filter(a => a.gameKey === gameKey);
                const gameAdds = gameActions.filter(a => a.action === 'add').length;
                const gameRemoves = gameActions.filter(a => a.action === 'remove').length;
                
                gameFields.push({
                    name: `${gameStats.emoji} **${gameStats.name}**`,
                    value: `\`\`\`
Actions: ${gameActions.length}
Ajouts: ${gameAdds}
Retraits: ${gameRemoves}
\`\`\``,
                    inline: true
                });
            }

            if (gameFields.length > 0) {
                gamesEmbed.addFields(gameFields);
            } else {
                gamesEmbed.setDescription('Aucune activité pour cette période.');
            }

            // Créer l'embed des utilisateurs les plus actifs
            const userActivity = {};
            for (const action of filteredActions) {
                if (!userActivity[action.userId]) {
                    userActivity[action.userId] = 0;
                }
                userActivity[action.userId]++;
            }

            const topUsers = Object.entries(userActivity)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

            const usersEmbed = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('👑 **TOP UTILISATEURS ACTIFS**');

            if (topUsers.length > 0) {
                const userFields = [];
                for (let i = 0; i < topUsers.length; i++) {
                    const [userId, count] = topUsers[i];
                    const user = await client.users.fetch(userId).catch(() => null);
                    const medal = ['🥇', '🥈', '🥉', '🏅', '🏅'][i];
                    
                    userFields.push({
                        name: `${medal} ${user ? user.displayName : 'Utilisateur inconnu'}`,
                        value: `\`${count} actions\``,
                        inline: true
                    });
                }
                usersEmbed.addFields(userFields);
            } else {
                usersEmbed.setDescription('Aucune activité pour cette période.');
            }

            await interaction.editReply({ 
                embeds: [mainEmbed, gamesEmbed, usersEmbed] 
            });

        } catch (error) {
            logger.error('Erreur dans showServerStats:', error);
            throw error;
        }
    },

    async showUserStats(interaction, client, targetUser, startDate, period) {
        try {
            // Récupérer les actions de l'utilisateur
            const allActions = client.db.data.gamingRoles?.userActions || [];
            const userActions = allActions.filter(action => 
                action.userId === targetUser.id &&
                action.guildId === interaction.guild.id &&
                new Date(action.timestamp) >= startDate
            );

            if (userActions.length === 0) {
                return await interaction.editReply({
                    content: `❌ Aucune activité trouvée pour ${targetUser.displayName} sur cette période.`
                });
            }

            // Calculer les statistiques de l'utilisateur
            const totalActions = userActions.length;
            const totalAdds = userActions.filter(a => a.action === 'add').length;
            const totalRemoves = userActions.filter(a => a.action === 'remove').length;

            // Analyser l'activité par jeu
            const gameActivity = {};
            for (const action of userActions) {
                if (!gameActivity[action.gameKey]) {
                    gameActivity[action.gameKey] = { adds: 0, removes: 0 };
                }
                gameActivity[action.gameKey][action.action === 'add' ? 'adds' : 'removes']++;
            }

            // Récupérer les rôles actuels de l'utilisateur
            const member = interaction.guild.members.cache.get(targetUser.id);
            const currentGamingRoles = [];
            
            if (member) {
                const activeGames = client.gamingRoleManager.getActiveGames();
                for (const [gameKey, gameConfig] of Object.entries(activeGames)) {
                    if (member.roles.cache.has(gameConfig.roleId)) {
                        currentGamingRoles.push(`${gameConfig.emoji} ${gameConfig.name}`);
                    }
                }
            }

            // Créer l'embed principal
            const userEmbed = new EmbedBuilder()
                .setColor(0x9146FF)
                .setTitle(`📊 **STATISTIQUES DE ${targetUser.displayName.toUpperCase()}**`)
                .setDescription(`Statistiques pour la période : **${this.getPeriodLabel(period)}**`)
                .addFields(
                    {
                        name: '📈 **Activité Globale**',
                        value: `\`\`\`
🔢 Actions totales: ${totalActions}
➕ Rôles obtenus: ${totalAdds}
➖ Rôles retirés: ${totalRemoves}
\`\`\``,
                        inline: false
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `Demandé par ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            // Ajouter les rôles actuels
            if (currentGamingRoles.length > 0) {
                userEmbed.addFields({
                    name: '🎮 **Rôles Gaming Actuels**',
                    value: currentGamingRoles.join('\n'),
                    inline: true
                });
            }

            // Créer l'embed des détails par jeu
            const gameDetailsEmbed = new EmbedBuilder()
                .setColor(0x00D4AA)
                .setTitle('🎯 **ACTIVITÉ PAR JEU**');

            const gameFields = [];
            for (const [gameKey, activity] of Object.entries(gameActivity)) {
                const gameConfig = client.gamingRoleManager.GAMING_CONFIG[gameKey];
                if (gameConfig) {
                    gameFields.push({
                        name: `${gameConfig.emoji} **${gameConfig.name}**`,
                        value: `\`\`\`
Obtenus: ${activity.adds}
Retirés: ${activity.removes}
Total: ${activity.adds + activity.removes}
\`\`\``,
                        inline: true
                    });
                }
            }

            if (gameFields.length > 0) {
                gameDetailsEmbed.addFields(gameFields);
            }

            // Créer un graphique d'activité simple
            const activityEmbed = new EmbedBuilder()
                .setColor(0xFEE75C)
                .setTitle('📅 **CHRONOLOGIE D\'ACTIVITÉ**');

            // Grouper les actions par jour
            const dailyActivity = {};
            for (const action of userActions) {
                const date = new Date(action.timestamp).toLocaleDateString('fr-FR');
                if (!dailyActivity[date]) {
                    dailyActivity[date] = 0;
                }
                dailyActivity[date]++;
            }

            const recentDays = Object.entries(dailyActivity)
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .slice(-7); // 7 derniers jours avec activité

            if (recentDays.length > 0) {
                const activityText = recentDays
                    .map(([date, count]) => `\`${date}\`: ${count} action${count > 1 ? 's' : ''}`)
                    .join('\n');
                
                activityEmbed.setDescription(activityText);
            } else {
                activityEmbed.setDescription('Aucune activité récente.');
            }

            await interaction.editReply({ 
                embeds: [userEmbed, gameDetailsEmbed, activityEmbed] 
            });

        } catch (error) {
            logger.error('Erreur dans showUserStats:', error);
            throw error;
        }
    },

    getPeriodLabel(period) {
        switch (period) {
            case '7d': return '7 derniers jours';
            case '30d': return '30 derniers jours';
            case '90d': return '90 derniers jours';
            case 'all': return 'Depuis le début';
            default: return '30 derniers jours';
        }
    }
};
