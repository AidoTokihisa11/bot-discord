import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('role-monitoring-status')
        .setDescription('📊 Afficher le statut de la surveillance des mentions de rôles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;
            const manager = interaction.client.roleMentionManager;

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('📊 STATUT DE LA SURVEILLANCE')
                .setTimestamp();

            if (!manager) {
                embed.setColor('#ff6b6b');
                embed.setDescription('❌ **GESTIONNAIRE NON INITIALISÉ**');
                embed.addFields({
                    name: 'ℹ️ INFORMATION',
                    value: 'Le gestionnaire de surveillance n\'est pas encore initialisé.\n' +
                           'Utilisez `/setup-role-monitoring activer:true` pour l\'activer.',
                    inline: false
                });
                
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const stats = manager.getMonitoringStats(guild.id);

            if (!stats) {
                embed.setColor('#ffa500');
                embed.setDescription('⚠️ **SURVEILLANCE INACTIVE**');
                embed.addFields({
                    name: 'ℹ️ INFORMATION',
                    value: 'La surveillance automatique n\'est pas configurée pour ce serveur.\n' +
                           'Utilisez `/setup-role-monitoring activer:true` pour l\'activer.',
                    inline: false
                });
            } else {
                embed.setColor('#00ff00');
                embed.setDescription('✅ **SURVEILLANCE ACTIVE**');

                // Configuration actuelle
                const logChannel = stats.logChannel ? guild.channels.cache.get(stats.logChannel) : null;
                embed.addFields({
                    name: '⚙️ CONFIGURATION ACTUELLE',
                    value: `• **Statut:** ${stats.isMonitored ? '✅ Active' : '❌ Inactive'}\n` +
                           `• **Auto-correction:** ${stats.autoFixEnabled ? '✅ Activée' : '❌ Désactivée'}\n` +
                           `• **Salon de logs:** ${logChannel ? `${logChannel}` : '❌ Aucun'}\n` +
                           `• **Notifications admin:** ${stats.notifyAdmins ? '✅ Activées' : '❌ Désactivées'}\n` +
                           `• **Intervalle:** ${Math.round(stats.checkInterval / 60000)} minutes`,
                    inline: false
                });

                // Effectuer une vérification rapide
                const quickCheck = await manager.quickCheck(guild);
                
                embed.addFields({
                    name: '🔍 DERNIÈRE VÉRIFICATION',
                    value: `• **Problèmes détectés:** ${quickCheck.issueCount}\n` +
                           `• **Sévérité:** ${getSeverityEmoji(quickCheck.severity)} ${quickCheck.severity}\n` +
                           `• **Statut global:** ${quickCheck.hasIssues ? '⚠️ Attention requise' : '✅ Tout va bien'}`,
                    inline: false
                });

                if (quickCheck.hasIssues) {
                    // Analyser les types de problèmes
                    const issueTypes = quickCheck.issues.reduce((acc, issue) => {
                        acc[issue.type] = (acc[issue.type] || 0) + 1;
                        return acc;
                    }, {});

                    const issueDetails = Object.entries(issueTypes).map(([type, count]) => {
                        switch (type) {
                            case 'NON_MENTIONABLE_ROLE':
                                return `• 🎭 ${count} rôle(s) non-mentionnable(s)`;
                            case 'CHANNEL_BLOCKS_MENTIONS':
                                return `• 🚫 ${count} salon(s) bloquant les mentions`;
                            case 'CHANNEL_BLOCKS_ROLE_MENTIONS':
                                return `• 🔒 ${count} permission(s) restrictive(s)`;
                            case 'NO_MENTION_ROLES':
                                return `• ❓ Aucun rôle de mention configuré`;
                            default:
                                return `• ⚠️ ${count} problème(s) de type ${type}`;
                        }
                    }).join('\n');

                    embed.addFields({
                        name: '📋 DÉTAIL DES PROBLÈMES',
                        value: issueDetails,
                        inline: false
                    });

                    if (stats.autoFixEnabled) {
                        embed.addFields({
                            name: '🔧 CORRECTION AUTOMATIQUE',
                            value: 'Les problèmes seront automatiquement corrigés lors de la prochaine vérification programmée.',
                            inline: false
                        });
                    }
                }
            }

            // Statistiques du serveur
            const roles = guild.roles.cache.filter(role => role.id !== guild.id);
            const mentionableRoles = roles.filter(role => role.mentionable);
            const textChannels = guild.channels.cache.filter(ch => ch.isTextBased());

            embed.addFields({
                name: '📈 STATISTIQUES DU SERVEUR',
                value: `• **Total des rôles:** ${roles.size}\n` +
                       `• **Rôles mentionnables:** ${mentionableRoles.size}\n` +
                       `• **Salons texte:** ${textChannels.size}\n` +
                       `• **Pourcentage mentionnable:** ${Math.round((mentionableRoles.size / roles.size) * 100)}%`,
                inline: false
            });

            // Actions disponibles
            embed.addFields({
                name: '🎮 ACTIONS DISPONIBLES',
                value: '• `/setup-role-monitoring` - Configurer la surveillance\n' +
                       '• `/check-role-mentions` - Diagnostic complet\n' +
                       '• `/fix-role-mentions` - Correction manuelle\n' +
                       '• `/force-role-check` - Vérification immédiate',
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ ERREUR')
                .setDescription('Une erreur est survenue lors de la vérification du statut.')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};

function getSeverityEmoji(severity) {
    switch (severity) {
        case 'HIGH': return '🔴';
        case 'MEDIUM': return '🟡';
        case 'LOW': return '🟢';
        case 'NONE': return '✅';
        default: return '⚪';
    }
}
